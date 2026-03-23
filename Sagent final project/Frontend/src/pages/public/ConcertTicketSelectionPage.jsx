import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Loader from '../../components/common/Loader';
import ErrorState from '../../components/common/ErrorState';
import EmptyState from '../../components/common/EmptyState';
import { getEventById } from '../../api/eventsApi';
import { getScheduleById } from '../../api/schedulesApi';
import { getConcertInventoryByScheduleId } from '../../api/seatsApi';
import { getVenueById } from '../../api/venuesApi';
import { formatCurrency, formatDate, formatTime } from '../../utils/format';
import { getValue, normalizeArray } from '../../utils/entity';
import { calculateBookingPricing } from '../../utils/pricing';
import { setCheckoutSelection } from '../../utils/storage';
import { useToast } from '../../components/common/ToastProvider';

const toId = (value) => String(value ?? '').trim();
const toConcertType = (value) => String(value ?? '').trim().toUpperCase();
const isInactiveEvent = (event) => toConcertType(getValue(event, ['event_status', 'eventStatus', 'status'])) === 'INACTIVE';
const getTicketCategoryId = (category) => toId(getValue(category, ['ticket_category_id', 'ticketCategoryId', 'id']));
const getTicketCategoryName = (category) => getValue(category, ['category_name', 'categoryName'], '-');
const normalizeConcertCategoryName = (category) => toConcertType(getTicketCategoryName(category)).replace(/\s+/g, ' ');
const isVipCategoryName = (name) => name.includes('VIP');
const isFanPitCategoryName = (name) =>
  name.includes('FAN PIT') || name === 'PIT' || name.endsWith(' PIT') || name.includes('MOSH');
const isGeneralCategoryName = (name) => name.includes('GENERAL') || name.includes('STANDING') || name.includes('REGULAR');
const toPositiveInt = (value, fallback = 1) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return Math.floor(parsed);
};
const clampQuantityValue = (value, maxSelectableQuantity, fallback = 1) =>
  String(Math.min(maxSelectableQuantity, Math.max(1, toPositiveInt(value, fallback))));
const getCategoryTheme = (category) => {
  const normalizedName = normalizeConcertCategoryName(category);

  if (isVipCategoryName(normalizedName)) {
    return 'tier-vip';
  }

  if (isFanPitCategoryName(normalizedName)) {
    return 'tier-pit';
  }

  if (isGeneralCategoryName(normalizedName)) {
    return 'tier-general';
  }

  return 'tier-standard';
};
const getAvailabilityBadge = (availableTickets, totalTickets) => {
  if (availableTickets <= 0) {
    return { label: 'SOLD OUT', tone: 'neutral' };
  }

  const availabilityRatio = totalTickets > 0 ? availableTickets / totalTickets : 0;
  if (availabilityRatio > 0 && availabilityRatio <= 0.2) {
    return { label: 'LIMITED', tone: 'warning' };
  }

  return { label: 'AVAILABLE', tone: 'success' };
};

const ConcertTicketSelectionPage = () => {
  const { scheduleId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [schedule, setSchedule] = useState(null);
  const [event, setEvent] = useState(null);
  const [ticketCategories, setTicketCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [quantityInput, setQuantityInput] = useState('1');

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      const scheduleResponse = await getScheduleById(scheduleId);
      const eventId = getValue(scheduleResponse, ['event_id', 'eventId']);
      const venueId = getValue(scheduleResponse, ['venue_id', 'venueId', 'id']);
      const [eventResponse, venueResponse] = await Promise.all([
        eventId ? getEventById(eventId) : Promise.resolve(null),
        venueId ? getVenueById(venueId) : Promise.resolve(null)
      ]);

      if (isInactiveEvent(eventResponse)) {
        throw new Error('This event is inactive and cannot be booked.');
      }

      if (toConcertType(getValue(eventResponse, ['category'])) !== 'CONCERT') {
        throw new Error('This schedule uses seat selection instead of concert ticket booking.');
      }

      const scheduleStatus = toConcertType(getValue(scheduleResponse, ['schedule_status', 'scheduleStatus'], 'OPEN'));
      if (scheduleStatus !== 'OPEN') {
        throw new Error(
          scheduleStatus === 'CLOSED'
            ? 'This concert slot is closed and cannot be booked.'
            : 'This concert slot is no longer available for booking.'
        );
      }

      const categoriesResponse = await getConcertInventoryByScheduleId(scheduleId);
      const categories = normalizeArray(categoriesResponse)
        .map((category) => ({
          ...category,
          ticket_category_id: getValue(category, ['seat_id', 'seatId', 'ticket_category_id', 'ticketCategoryId', 'id']),
          category_name: getValue(category, ['category_name', 'categoryName']),
          price: Number(getValue(category, ['price'], 0)),
          total_tickets: Number(getValue(category, ['total_tickets', 'totalTickets'], 0)),
          sold_tickets: Number(getValue(category, ['sold_tickets', 'soldTickets'], 0)),
          available_tickets: Number(getValue(category, ['available_tickets', 'availableTickets'], 0))
        }))
        .sort((first, second) => Number(first.price || 0) - Number(second.price || 0));

      setSchedule({
        ...scheduleResponse,
        event_id: getValue(scheduleResponse, ['event_id', 'eventId']),
        event_name: getValue(eventResponse, ['event_name', 'eventName', 'name']),
        category: getValue(eventResponse, ['category']),
        image_url: getValue(eventResponse, ['image_url', 'imageUrl']),
        genre: getValue(eventResponse, ['genre']),
        language: getValue(eventResponse, ['language']),
        venue_name: getValue(venueResponse, ['venue_name', 'venueName', 'name'], getValue(scheduleResponse, ['venue_name', 'venueName']))
      });
      setEvent(eventResponse);
      setTicketCategories(categories);

      const firstAvailableCategory = categories.find((category) => Number(category.available_tickets || 0) > 0);
      setSelectedCategoryId(toId(getValue(firstAvailableCategory, ['ticket_category_id', 'ticketCategoryId', 'id'])));
      setQuantityInput('1');
    } catch (loadError) {
      setError(loadError.message || 'Failed to load concert tickets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scheduleId]);

  const selectedCategory = useMemo(
    () =>
      ticketCategories.find(
        (category) => getTicketCategoryId(category) === selectedCategoryId
      ) || null,
    [selectedCategoryId, ticketCategories]
  );
  const selectedCategoryAvailableTickets = Number(getValue(selectedCategory, ['available_tickets', 'availableTickets'], 0));
  const maxSelectableQuantity = Math.max(1, selectedCategoryAvailableTickets || 1);
  const normalizedQuantity = useMemo(() => {
    if (!selectedCategory) {
      return 1;
    }

    return Number(clampQuantityValue(quantityInput, maxSelectableQuantity));
  }, [maxSelectableQuantity, quantityInput, selectedCategory]);

  const ticketCategoryLayout = useMemo(() => {
    const usedIds = new Set();

    const findCategory = (matcher) =>
      ticketCategories.find((category) => {
        const categoryId = getTicketCategoryId(category);
        return categoryId && matcher(normalizeConcertCategoryName(category));
      }) || null;

    const reserveCategory = (category) => {
      const categoryId = getTicketCategoryId(category);
      if (!categoryId || usedIds.has(categoryId)) {
        return null;
      }

      usedIds.add(categoryId);
      return category;
    };

    const takeNextCategory = () => {
      const nextCategory =
        ticketCategories.find((category) => {
          const categoryId = getTicketCategoryId(category);
          return categoryId && !usedIds.has(categoryId);
        }) || null;

      return reserveCategory(nextCategory);
    };

    const leftCategoryMatch = reserveCategory(findCategory((name) => isVipCategoryName(name)));
    const rightCategoryMatch = reserveCategory(
      findCategory((name) => isFanPitCategoryName(name))
    );
    const bottomCategoryMatch = reserveCategory(findCategory((name) => isGeneralCategoryName(name)));

    return {
      leftCategory: leftCategoryMatch || takeNextCategory(),
      rightCategory: rightCategoryMatch || takeNextCategory(),
      bottomCategory: bottomCategoryMatch || takeNextCategory(),
      extras: ticketCategories.filter((category) => {
        const categoryId = getTicketCategoryId(category);
        return categoryId && !usedIds.has(categoryId);
      })
    };
  }, [ticketCategories]);

  useEffect(() => {
    if (!selectedCategory) {
      return;
    }

    const availableTickets = Number(getValue(selectedCategory, ['available_tickets', 'availableTickets'], 0));
    if (availableTickets <= 0) {
      setQuantityInput('1');
      return;
    }

    setQuantityInput((current) => {
      const trimmed = String(current ?? '').trim();
      if (!trimmed) {
        return '';
      }

      return clampQuantityValue(trimmed, availableTickets);
    });
  }, [selectedCategory]);

  const pricing = useMemo(() => {
    if (!selectedCategory) {
      return calculateBookingPricing();
    }

    return calculateBookingPricing({
      ticketSelection: {
        price: Number(getValue(selectedCategory, ['price'], 0)),
        quantity: normalizedQuantity
      }
    });
  }, [normalizedQuantity, selectedCategory]);

  const handleQuantityChange = (event) => {
    const nextValue = String(event.target.value ?? '');
    if (!nextValue) {
      setQuantityInput('');
      return;
    }

    const sanitizedValue = nextValue.replace(/\D+/g, '');
    if (sanitizedValue) {
      setQuantityInput(sanitizedValue);
    }
  };

  const handleQuantityBlur = () => {
    setQuantityInput(clampQuantityValue(quantityInput, maxSelectableQuantity));
  };

  const incrementQuantity = () => {
    setQuantityInput(String(Math.min(maxSelectableQuantity, normalizedQuantity + 1)));
  };

  const decrementQuantity = () => {
    setQuantityInput(String(Math.max(1, normalizedQuantity - 1)));
  };

  const renderCategoryCard = (category, slotClass) => {
    if (!category) {
      return <div className={`concert-map-placeholder ${slotClass}`.trim()} aria-hidden="true" />;
    }

    const categoryId = getTicketCategoryId(category);
    const availableTickets = Number(getValue(category, ['available_tickets', 'availableTickets'], 0));
    const totalTickets = Number(getValue(category, ['total_tickets', 'totalTickets'], 0));
    const isSelected = selectedCategoryId === categoryId;
    const availabilityBadge = getAvailabilityBadge(availableTickets, totalTickets);
    const themeClass = getCategoryTheme(category);

    return (
      <button
        key={`${slotClass || 'category'}-${categoryId}`}
        type="button"
        className={`concert-category-card ${slotClass} ${themeClass} ${isSelected ? 'active' : ''}`.trim()}
        onClick={() => setSelectedCategoryId(categoryId)}
        disabled={availableTickets <= 0}
        aria-pressed={isSelected}
        aria-label={`${getTicketCategoryName(category)}, ${availabilityBadge.label.toLowerCase()}, ${formatCurrency(
          getValue(category, ['price'], 0)
        )} per ticket`}
      >
        <div className="concert-category-top">
          <div className="concert-category-actions">
            <span className={`status-badge ${availabilityBadge.tone}`}>{availabilityBadge.label}</span>
          </div>
        </div>
        <div className="concert-category-body">
          <div className="concert-category-heading">
            <h4>{getTicketCategoryName(category)}</h4>
            <div className="concert-category-price">
              <span>From</span>
              <strong>{formatCurrency(getValue(category, ['price'], 0))}</strong>
            </div>
          </div>
        </div>
      </button>
    );
  };

  const handleProceed = () => {
    if (!selectedCategory) {
      toast.error('Please choose a ticket category');
      return;
    }

    const availableTickets = Number(getValue(selectedCategory, ['available_tickets', 'availableTickets'], 0));
    if (availableTickets <= 0) {
      toast.error('This category is sold out');
      return;
    }

    const normalizedQuantity = Math.min(Math.max(1, toPositiveInt(quantityInput, 1)), availableTickets);
    const checkoutSelection = {
      schedule,
      ticketSelection: {
        ticketCategoryId: Number(getValue(selectedCategory, ['ticket_category_id', 'ticketCategoryId', 'id'])),
        categoryName: getValue(selectedCategory, ['category_name', 'categoryName'], '-'),
        price: Number(getValue(selectedCategory, ['price'], 0)),
        totalTickets: Number(getValue(selectedCategory, ['total_tickets', 'totalTickets'], 0)),
        availableTickets,
        quantity: normalizedQuantity
      }
    };

    setCheckoutSelection(checkoutSelection);
    navigate('/checkout', { state: { checkout: checkoutSelection } });
  };

  if (loading) {
    return <Loader text="Loading concert tickets..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadData} />;
  }

  if (!ticketCategories.length) {
    return (
      <EmptyState
        title="No ticket categories configured"
        description="This concert does not have ticket categories yet. Please contact the organizer."
      />
    );
  }

  return (
    <section className="container section">
      <div className="section-head concert-selection-head">
        <div>
          <h1>Select Concert Tickets</h1>
          <p>
            {getValue(event, ['event_name', 'eventName', 'name'], 'Concert')} | {formatDate(getValue(schedule, ['show_date']))} at{' '}
            {formatTime(getValue(schedule, ['show_time']))}
          </p>
          <div className="concert-selection-meta">
            <span className="concert-selection-pill">Concert</span>
            {getValue(event, ['genre']) ? <span className="concert-selection-pill">{getValue(event, ['genre'])}</span> : null}
            {getValue(event, ['language']) ? <span className="concert-selection-pill">{getValue(event, ['language'])}</span> : null}
            {getValue(schedule, ['venue_name', 'venueName']) ? (
              <span className="concert-selection-pill">{getValue(schedule, ['venue_name', 'venueName'])}</span>
            ) : null}
            <span className="concert-selection-pill">{ticketCategories.length} zones</span>
          </div>
        </div>
      </div>

      <div className="seat-layout">
        <div className="seat-map-card concert-map-card">
          <div className="concert-layout-surface">
            <div className="concert-layout-map">
              <div className="concert-stage concert-stage-top">
                <span>Main Stage</span>
              </div>
              {renderCategoryCard(ticketCategoryLayout.leftCategory, 'layout-left')}
              <div className="concert-stage concert-stage-runway">
                <span>Runway</span>
              </div>
              {renderCategoryCard(ticketCategoryLayout.rightCategory, 'layout-right')}
              {renderCategoryCard(ticketCategoryLayout.bottomCategory, 'layout-bottom')}
            </div>
          </div>
          {ticketCategoryLayout.extras.length ? (
            <div className="concert-extra-section">
              <div className="concert-extra-head">
                <h3>Additional zones</h3>
                <p>More ticket sections available for this concert layout.</p>
              </div>
              <div className="concert-extra-grid">
                {ticketCategoryLayout.extras.map((category) => renderCategoryCard(category, 'concert-extra-card'))}
              </div>
            </div>
          ) : null}
        </div>

        <aside className="summary-card concert-summary-card">
          <div className="concert-summary-head">
            <span className="concert-map-eyebrow">Live Summary</span>
            <h3>Ticket Summary</h3>
            <p>Review your selected zone, quantity, and estimated charges before checkout.</p>
          </div>
          {!selectedCategory ? <p className="concert-summary-empty">Select a ticket zone from the layout to continue.</p> : null}
          {selectedCategory ? (
            <>
              <div className="concert-summary-selection">
                <div className="concert-summary-selection-head">
                  <div>
                    <span className="concert-summary-label">Category</span>
                    <strong>{getValue(selectedCategory, ['category_name', 'categoryName'], '-')}</strong>
                  </div>
                </div>
                <div className="concert-summary-grid">
                  <div className="concert-summary-stat">
                    <span>Price Per Ticket</span>
                    <strong>{formatCurrency(getValue(selectedCategory, ['price'], 0))}</strong>
                  </div>
                </div>
              </div>
              <label className="field-group">
                <span className="field-label">Quantity</span>
                <div className="concert-quantity-picker">
                  <button
                    type="button"
                    className="btn btn-outline concert-quantity-btn"
                    onClick={decrementQuantity}
                    disabled={normalizedQuantity <= 1}
                  >
                    -
                  </button>
                  <input
                    className="field-input concert-quantity-input"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={quantityInput}
                    onChange={handleQuantityChange}
                    onBlur={handleQuantityBlur}
                  />
                  <button
                    type="button"
                    className="btn btn-outline concert-quantity-btn"
                    onClick={incrementQuantity}
                    disabled={normalizedQuantity >= maxSelectableQuantity}
                  >
                    +
                  </button>
                </div>
                <span className="field-help">You can book up to {maxSelectableQuantity} tickets in this zone.</span>
              </label>
              <div className="summary-totals">
                <div>
                  <span>Subtotal</span>
                  <strong>{formatCurrency(pricing.subtotal)}</strong>
                </div>
                <div>
                  <span>Convenience Fee</span>
                  <strong>{formatCurrency(pricing.convenienceFee)}</strong>
                </div>
                <div>
                  <span>GST ({pricing.gstPercentage}%)</span>
                  <strong>{formatCurrency(pricing.gstAmount)}</strong>
                </div>
                <div className="total">
                  <span>Estimated Total</span>
                  <strong>{formatCurrency(pricing.total)}</strong>
                </div>
              </div>
            </>
          ) : null}
          <button
            type="button"
            className="btn btn-primary full-width-btn"
            onClick={handleProceed}
            disabled={!selectedCategory || Number(getValue(selectedCategory, ['available_tickets', 'availableTickets'], 0)) <= 0}
          >
            Proceed to Booking
          </button>
        </aside>
      </div>
    </section>
  );
};

export default ConcertTicketSelectionPage;
