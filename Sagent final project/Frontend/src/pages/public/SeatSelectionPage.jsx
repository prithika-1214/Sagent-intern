import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Loader from '../../components/common/Loader';
import ErrorState from '../../components/common/ErrorState';
import EmptyState from '../../components/common/EmptyState';
import SeatGrid from '../../components/seats/SeatGrid';
import { getEventById } from '../../api/eventsApi';
import { getScheduleById } from '../../api/schedulesApi';
import { createEventSeat, getEventSeatsByScheduleId, holdEventSeats } from '../../api/eventSeatsApi';
import { getSeats } from '../../api/seatsApi';
import { getVenueById } from '../../api/venuesApi';
import { formatCurrency, formatDate, formatTime } from '../../utils/format';
import { getValue, normalizeArray } from '../../utils/entity';
import { calculateBookingPricing } from '../../utils/pricing';
import { setCheckoutSelection } from '../../utils/storage';
import { useToast } from '../../components/common/ToastProvider';

const toId = (value) => String(value ?? '').trim();
const toText = (value) => String(value ?? '').trim();
const toUpperText = (value) => toText(value).toUpperCase();
const normalizeCategory = (value) => {
  const normalized = toUpperText(value).replace(/-/g, '_').replace(/\s+/g, '_');
  if (normalized === 'SHOW' || normalized === 'STANDUP') {
    return 'STANDUP_SHOW';
  }
  return normalized;
};
const normalizeVenueType = (value) => toUpperText(value).replace(/-/g, '_').replace(/\s+/g, '_');
const isInactiveEvent = (event) => toUpperText(getValue(event, ['event_status', 'eventStatus', 'status'])) === 'INACTIVE';
const createHoldToken = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `hold-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};
const toNumericSeat = (value) => {
  const raw = String(value ?? '').trim();
  const match = raw.match(/\d+/);
  if (!match) {
    return null;
  }
  const parsed = Number(match[0]);
  return Number.isFinite(parsed) ? parsed : null;
};
const toSeatKey = (row, number) => `${String(row).trim().toUpperCase()}-${Number(number)}`;
const hasAudiSeatAssignment = (seat) =>
  Boolean(toText(getValue(seat, ['audi_id', 'audiId'])) || toText(getValue(seat, ['audi_name', 'audiName'])));
const matchesScheduleAudi = (seat, scheduleAudiId, scheduleAudiName) => {
  const seatAudiId = toUpperText(getValue(seat, ['audi_id', 'audiId']));
  const seatAudiName = toUpperText(getValue(seat, ['audi_name', 'audiName']));

  if (scheduleAudiId && seatAudiId && seatAudiId === scheduleAudiId) {
    return true;
  }

  if (scheduleAudiName && seatAudiName && seatAudiName === scheduleAudiName) {
    return true;
  }

  return false;
};
const filterSeatsForScheduleAudi = (seats, scheduleAudiId, scheduleAudiName) => {
  if (!scheduleAudiId && !scheduleAudiName) {
    return seats;
  }

  const assignedSeats = seats.filter(hasAudiSeatAssignment);
  if (!assignedSeats.length) {
    return seats;
  }

  const matchingSeats = assignedSeats.filter((seat) => matchesScheduleAudi(seat, scheduleAudiId, scheduleAudiName));
  if (matchingSeats.length) {
    return matchingSeats;
  }

  const unassignedSeats = seats.filter((seat) => !hasAudiSeatAssignment(seat));
  if (unassignedSeats.length) {
    return unassignedSeats;
  }

  const configuredAudiAssignments = new Set(
    assignedSeats
      .map((seat) => toUpperText(getValue(seat, ['audi_id', 'audiId'])) || toUpperText(getValue(seat, ['audi_name', 'audiName'])))
      .filter(Boolean)
  );

  // Older venue-wide seat setups may have every seat stamped with a single default audi
  // even though the same layout should be reused across the venue's other schedules.
  if (configuredAudiAssignments.size <= 1) {
    return seats;
  }

  return [];
};
const getSeatSelectionId = (seat) =>
  String(
    getValue(seat, ['seat_selection_id', 'seatSelectionId']) ||
      getValue(seat, ['event_seat_id', 'eventSeatId', 'id']) ||
      `virtual-${getValue(seat, ['seat_key'], `${getValue(seat, ['seat_row'], 'ROW')}-${getValue(seat, ['seat_number'], '00')}`)}`
  );
const getCouplePairId = (seat) => String(getValue(seat, ['couple_pair_id', 'couplePairId'], '')).trim();
const isSeatUnavailable = (seat) => ['BOOKED', 'HELD'].includes(toUpperText(getValue(seat, ['seat_status'], 'AVAILABLE')));

const DEFAULT_SEAT_PRICES = {
  REGULAR: 220,
  PREMIUM: 320,
  VIP: 220,
  BALCONY: 220,
  COUPLE: 220
};

const defaultSeatPrice = (seatType) => DEFAULT_SEAT_PRICES[String(seatType).toUpperCase()] ?? DEFAULT_SEAT_PRICES.REGULAR;

const sortSeats = (first, second) => {
  const rowCompare = toUpperText(getValue(first, ['seat_row', 'seatRow'])).localeCompare(
    toUpperText(getValue(second, ['seat_row', 'seatRow'])),
    undefined,
    { numeric: true, sensitivity: 'base' }
  );

  if (rowCompare !== 0) {
    return rowCompare;
  }

  return toText(getValue(first, ['seat_number', 'seatNumber'])).localeCompare(
    toText(getValue(second, ['seat_number', 'seatNumber'])),
    undefined,
    { numeric: true, sensitivity: 'base' }
  );
};

const buildCoupleSeatMeta = (venueSeats = []) => {
  const pairMeta = new Map();
  const coupleSeatsByRow = venueSeats.reduce((acc, seat) => {
    const seatType = toUpperText(getValue(seat, ['seat_type', 'seatType']));
    if (seatType !== 'COUPLE') {
      return acc;
    }

    const row = toUpperText(getValue(seat, ['seat_row', 'seatRow']));
    if (!row) {
      return acc;
    }

    if (!acc.has(row)) {
      acc.set(row, []);
    }

    acc.get(row).push(seat);
    return acc;
  }, new Map());

  coupleSeatsByRow.forEach((rowSeats, row) => {
    const sortedRowSeats = [...rowSeats].sort(sortSeats);

    for (let index = 0; index < sortedRowSeats.length; index += 2) {
      const firstSeat = sortedRowSeats[index];
      const secondSeat = sortedRowSeats[index + 1];
      if (!firstSeat || !secondSeat) {
        continue;
      }

      const firstSeatId = toId(getValue(firstSeat, ['seat_id', 'seatId', 'id']));
      const secondSeatId = toId(getValue(secondSeat, ['seat_id', 'seatId', 'id']));
      if (!firstSeatId || !secondSeatId) {
        continue;
      }

      const pairId = `${row}-PAIR-${Math.floor(index / 2) + 1}`;
      pairMeta.set(firstSeatId, { couplePairId: pairId, pairSeatId: secondSeatId });
      pairMeta.set(secondSeatId, { couplePairId: pairId, pairSeatId: firstSeatId });
    }
  });

  return pairMeta;
};

const getSeatSummaryLabel = (seat) => {
  const seatNumber = toText(getValue(seat, ['seat_number', 'seatNumber']));
  const seatRow = toUpperText(getValue(seat, ['seat_row', 'seatRow']));

  if (seatNumber && seatRow && toUpperText(seatNumber).startsWith(seatRow)) {
    return seatNumber;
  }

  if (seatRow && seatNumber) {
    return `${seatRow}${seatNumber}`;
  }

  return seatNumber || seatRow || '-';
};
const getSeatTypeSummaryLabel = (seat, simplifySeatTypes = false) => {
  const seatType = toUpperText(getValue(seat, ['seat_type', 'seatType'], 'REGULAR'));
  if (simplifySeatTypes && ['PREMIUM', 'COUPLE'].includes(seatType)) {
    return 'REGULAR';
  }
  if (!simplifySeatTypes && Boolean(getValue(seat, ['is_couple_seat', 'isCoupleSeat'], false))) {
    return 'COUPLE';
  }
  return seatType || 'REGULAR';
};

const SeatSelectionPage = () => {
  const { scheduleId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [schedule, setSchedule] = useState(null);
  const [eventSeats, setEventSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [provisioning, setProvisioning] = useState(false);
  const [selectedSeatIds, setSelectedSeatIds] = useState([]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      const scheduleResponse = await getScheduleById(scheduleId);
      const eventId = getValue(scheduleResponse, ['event_id', 'eventId']);
      const scheduleVenueId = getValue(scheduleResponse, ['venue_id', 'venueId', 'id']);
      const [eventResponse, venueResponse, eventSeatsResponse, seatsResponse] = await Promise.all([
        eventId ? getEventById(eventId) : Promise.resolve(null),
        scheduleVenueId ? getVenueById(scheduleVenueId) : Promise.resolve(null),
        getEventSeatsByScheduleId(scheduleId),
        getSeats()
      ]);

      if (isInactiveEvent(eventResponse)) {
        throw new Error('This event is inactive and cannot be booked.');
      }

      const venueId = Number(getValue(scheduleResponse, ['venue_id', 'venueId']));
      const scheduleAudiId = toUpperText(getValue(scheduleResponse, ['audi_id', 'audiId']));
      const scheduleAudiName = toUpperText(getValue(scheduleResponse, ['audi_name', 'audiName']));
      const scheduleStatus = toUpperText(getValue(scheduleResponse, ['schedule_status', 'scheduleStatus'], 'OPEN'));
      const venueType = normalizeVenueType(getValue(venueResponse, ['venue_type', 'venueType'], getValue(scheduleResponse, ['venue_type', 'venueType'])));

      if (scheduleStatus !== 'OPEN') {
        throw new Error(
          scheduleStatus === 'CLOSED' ? 'This slot is closed and cannot be booked.' : 'This slot is no longer available for booking.'
        );
      }

      const seats = normalizeArray(seatsResponse);
      const venueSeats = filterSeatsForScheduleAudi(
        seats
        .filter((seat) => Number(getValue(seat, ['venue_id', 'venueId'])) === venueId)
        .filter((seat) => !toText(getValue(seat, ['concert_category_name', 'concertCategoryName'])))
        .sort(sortSeats),
        scheduleAudiId,
        scheduleAudiName
      );
      const coupleSeatMeta = venueType === 'HALL_VENUE' ? new Map() : buildCoupleSeatMeta(venueSeats);

      const scheduleEventSeats = normalizeArray(eventSeatsResponse);
      const eventSeatBySeatId = new Map();
      scheduleEventSeats.forEach((eventSeat) => {
        const seatRef = toId(getValue(eventSeat, ['seat_id', 'seatId']));
        if (seatRef && !eventSeatBySeatId.has(seatRef)) {
          eventSeatBySeatId.set(seatRef, eventSeat);
        }
      });

      const mergedSeats = venueSeats.map((seatRecord) => {
        const seatId = getValue(seatRecord, ['seat_id', 'seatId', 'id'], '');
        const seatNumber = toText(getValue(seatRecord, ['seat_number', 'seatNumber']));
        const seatRow = toUpperText(getValue(seatRecord, ['seat_row', 'seatRow']));
        const seatType = String(getValue(seatRecord, ['seat_type', 'seatType'], 'REGULAR')).toUpperCase();
        const eventSeat = seatId ? eventSeatBySeatId.get(String(seatId)) : null;
        const numericSeatValue = toNumericSeat(seatNumber);
        const coupleMeta = coupleSeatMeta.get(toId(seatId)) || {};
        const existingPrice = Number(getValue(eventSeat, ['seat_price', 'seatPrice'], NaN));
        const baseSeatPrice = Number(getValue(seatRecord, ['seat_price', 'seatPrice'], NaN));
        const seatPrice = Number.isFinite(existingPrice)
          ? existingPrice
          : Number.isFinite(baseSeatPrice)
            ? baseSeatPrice
            : defaultSeatPrice(seatType);

        return {
          ...eventSeat,
          seat_key: `${seatRow}-${seatNumber || seatId}`,
          event_seat_id: getValue(eventSeat, ['event_seat_id', 'eventSeatId', 'id'], ''),
          seat_id: seatId,
          seat_number: seatNumber,
          seat_number_value: numericSeatValue,
          seat_row: seatRow,
          seat_type: seatType,
          seat_price: seatPrice,
          seat_status: getValue(eventSeat, ['seat_status', 'seatStatus'], 'AVAILABLE'),
          schedule_id: Number(scheduleId),
          venue_id: venueId,
          is_couple_seat: seatType === 'COUPLE' && Boolean(coupleMeta.couplePairId),
          couple_pair_id: coupleMeta.couplePairId || '',
          pair_seat_key: coupleMeta.pairSeatId || '',
          is_virtual_seat: false,
          is_virtual_event_seat: !eventSeat,
          seat_selection_id: getValue(eventSeat, ['event_seat_id', 'eventSeatId', 'id'], '') || `seat-${seatId}`
        };
      });

      setSchedule({
        ...scheduleResponse,
        event_name: getValue(eventResponse, ['event_name', 'eventName', 'name']),
        category: getValue(eventResponse, ['category']),
        image_url: getValue(eventResponse, ['image_url', 'imageUrl']),
        genre: getValue(eventResponse, ['genre']),
        language: getValue(eventResponse, ['language']),
        venue_name: getValue(venueResponse, ['venue_name', 'venueName', 'name'], getValue(scheduleResponse, ['venue_name', 'venueName'])),
        venue_type: getValue(venueResponse, ['venue_type', 'venueType'], getValue(scheduleResponse, ['venue_type', 'venueType']))
      });
      setEventSeats(mergedSeats);
      setSelectedSeatIds([]);
    } catch (err) {
      setError(err.message || 'Failed to load seats');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [scheduleId]);

  const selectedSeats = useMemo(
    () => eventSeats.filter((seat) => selectedSeatIds.includes(getSeatSelectionId(seat))),
    [eventSeats, selectedSeatIds]
  );

  const pricing = useMemo(() => calculateBookingPricing({ selectedSeats }), [selectedSeats]);
  const isHallVenue = useMemo(
    () => normalizeVenueType(getValue(schedule, ['venue_type', 'venueType'])) === 'HALL_VENUE',
    [schedule]
  );
  const isHallShowSeatMap = useMemo(
    () => isHallVenue && normalizeCategory(getValue(schedule, ['category'])) === 'STANDUP_SHOW',
    [isHallVenue, schedule]
  );
  const coupleSeatPairs = useMemo(
    () =>
      eventSeats.reduce((acc, seat) => {
        const pairId = getCouplePairId(seat);
        if (!pairId) {
          return acc;
        }
        if (!acc.has(pairId)) {
          acc.set(pairId, []);
        }
        acc.get(pairId).push(seat);
        return acc;
      }, new Map()),
    [eventSeats]
  );

  const handleToggleSeat = (seat) => {
    const seatStatus = getValue(seat, ['seat_status'], '').toUpperCase();
    if (seatStatus === 'BOOKED' || seatStatus === 'HELD') {
      return;
    }

    const couplePairId = getCouplePairId(seat);
    if (couplePairId) {
      const pairSeats = coupleSeatPairs.get(couplePairId) || [];
      const pairSeatIds = pairSeats.map((item) => getSeatSelectionId(item));

      if (pairSeatIds.length < 2) {
        const id = getSeatSelectionId(seat);
        setSelectedSeatIds((current) =>
          current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
        );
        return;
      }

      const hasUnavailableSeatInPair = pairSeats.some((item) => isSeatUnavailable(item));

      if (hasUnavailableSeatInPair) {
        toast.error('This couple seat pair is not fully available');
        return;
      }

      setSelectedSeatIds((current) => {
        const allSelected = pairSeatIds.every((id) => current.includes(id));
        if (allSelected) {
          return current.filter((id) => !pairSeatIds.includes(id));
        }

        const next = new Set(current);
        pairSeatIds.forEach((id) => next.add(id));
        return Array.from(next);
      });
      return;
    }

    const id = getSeatSelectionId(seat);
    setSelectedSeatIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  };

  const ensureEventSeatForSelectedSeat = async (seat) => {
    const existingEventSeatId = getValue(seat, ['event_seat_id', 'eventSeatId', 'id']);
    if (existingEventSeatId) {
      return seat;
    }

    let seatId = getValue(seat, ['seat_id', 'seatId']);

    if (!seatId) {
      throw new Error('Seat is not configured for this venue yet.');
    }

    let createdEventSeat = null;
    try {
      createdEventSeat = await createEventSeat({
        scheduleId: Number(scheduleId),
        seatId: Number(seatId),
        seatPrice: Number(getValue(seat, ['seat_price'], 0)),
        seatStatus: 'AVAILABLE'
      });
    } catch (createError) {
      const refreshedEventSeats = await getEventSeatsByScheduleId(scheduleId);
      createdEventSeat = normalizeArray(refreshedEventSeats).find(
        (item) => String(getValue(item, ['seat_id', 'seatId'])) === String(seatId)
      );

      if (!createdEventSeat) {
        throw createError;
      }
    }

    const eventSeatId = getValue(createdEventSeat, ['event_seat_id', 'eventSeatId', 'id']);
    if (!eventSeatId) {
      throw new Error('Unable to reserve seat mapping. Please try again.');
    }

    return {
      ...seat,
      seat_id: seatId,
      event_seat_id: eventSeatId,
      seat_status: getValue(createdEventSeat, ['seat_status', 'seatStatus'], getValue(seat, ['seat_status'])),
      seat_selection_id: String(eventSeatId),
      is_virtual_seat: false,
      is_virtual_event_seat: false
    };
  };

  const handleProceed = () => {
    const proceed = async () => {
      if (!selectedSeats.length) {
        toast.error('Please select at least one seat');
        return;
      }

      try {
        setProvisioning(true);
        const resolvedSeats = [];

        for (const seat of selectedSeats) {
          // Persist virtual seat/event-seat mappings before checkout.
          // This guarantees booking payload has real eventSeatIds.
          // eslint-disable-next-line no-await-in-loop
          const resolved = await ensureEventSeatForSelectedSeat(seat);
          resolvedSeats.push(resolved);
        }

        const resolvedBySelectionId = new Map(
          resolvedSeats.map((item) => [toId(getValue(item, ['seat_selection_id'])), item])
        );
        const eventSeatIds = resolvedSeats
          .map((item) => Number(getValue(item, ['event_seat_id', 'eventSeatId', 'id'])))
          .filter((value) => Number.isFinite(value) && value > 0);

        if (!eventSeatIds.length) {
          throw new Error('Unable to hold selected seats. Please try again.');
        }

        const holdToken = createHoldToken();
        const holdResponse = await holdEventSeats({
          scheduleId: Number(scheduleId),
          eventSeatIds,
          holdToken
        });
        const holdExpiresAt = getValue(holdResponse, ['holdExpiresAt', 'hold_expires_at']);
        if (!holdExpiresAt) {
          throw new Error('Unable to start the booking timer. Please try again.');
        }
        const checkoutSelection = {
          schedule,
          selectedSeats: resolvedSeats,
          holdToken: getValue(holdResponse, ['holdToken', 'hold_token'], holdToken),
          holdExpiresAt
        };

        setEventSeats((current) =>
          current.map((seat) => {
            const id = toId(getSeatSelectionId(seat));
            const resolvedSeat = resolvedBySelectionId.get(id);
            if (!resolvedSeat) {
              return seat;
            }

            return {
              ...resolvedSeat,
              seat_status: eventSeatIds.includes(Number(getValue(resolvedSeat, ['event_seat_id', 'eventSeatId', 'id'])))
                ? 'HELD'
                : getValue(resolvedSeat, ['seat_status'])
            };
          })
        );

        setCheckoutSelection(checkoutSelection);
        navigate('/checkout', { state: { checkout: checkoutSelection } });
      } catch (err) {
        await loadData();
        toast.error(err.message || 'Unable to prepare seats for booking');
      } finally {
        setProvisioning(false);
      }
    };

    proceed();
  };

  if (loading) {
    return <Loader text="Loading seat map..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadData} />;
  }

  if (!eventSeats.length) {
    return <EmptyState title="No seats configured for this schedule" description="Please contact admin." />;
  }

  return (
    <section className="container section">
      <div className="section-head concert-selection-head">
        <div>
          <h1>Select Seats</h1>
          <p>
            {getValue(schedule, ['event_name', 'eventName', 'name'], 'Event')} | {formatDate(getValue(schedule, ['show_date']))} at{' '}
            {formatTime(getValue(schedule, ['show_time']))}
          </p>
          <div className="concert-selection-meta">
            <span className="concert-selection-pill">{getValue(schedule, ['category'], 'Event')}</span>
            {getValue(schedule, ['genre']) ? <span className="concert-selection-pill">{getValue(schedule, ['genre'])}</span> : null}
            {getValue(schedule, ['language']) ? <span className="concert-selection-pill">{getValue(schedule, ['language'])}</span> : null}
            {getValue(schedule, ['venue_name', 'venueName']) ? (
              <span className="concert-selection-pill">{getValue(schedule, ['venue_name', 'venueName'])}</span>
            ) : null}
            {getValue(schedule, ['audi_name', 'audiName']) ? (
              <span className="concert-selection-pill">{getValue(schedule, ['audi_name', 'audiName'])}</span>
            ) : null}
          </div>
        </div>
      </div>

      <div className="seat-layout">
        <div className="seat-map-card">
          <SeatGrid
            seats={eventSeats}
            selectedSeatIds={selectedSeatIds}
            onToggleSeat={handleToggleSeat}
            stageVariant={isHallShowSeatMap ? 'microphone' : 'screen'}
            simplifySeatTypes={isHallVenue}
          />
        </div>
        <aside className="summary-card">
          <h3>Selected Seats</h3>
          {!selectedSeats.length ? <p>No seats selected</p> : null}
          {selectedSeats.map((seat) => (
            <div key={getSeatSelectionId(seat)} className="summary-seat-item">
              <span>
                {getSeatSummaryLabel(seat)} ({getSeatTypeSummaryLabel(seat, isHallVenue)})
              </span>
              <strong>{formatCurrency(seat.seat_price)}</strong>
            </div>
          ))}
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
          <button type="button" className="btn btn-primary full-width-btn" onClick={handleProceed} disabled={provisioning}>
            {provisioning ? 'Preparing Seats...' : 'Proceed to Booking'}
          </button>
        </aside>
      </div>
    </section>
  );
};

export default SeatSelectionPage;
