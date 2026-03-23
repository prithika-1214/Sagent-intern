import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import BookingSummary from '../../components/booking/BookingSummary';
import FormInput from '../../components/common/FormInput';
import SelectInput from '../../components/common/SelectInput';
import { getCheckoutSelection, setSelectedUserId, clearCheckoutSelection, setLastBookingSuccess } from '../../utils/storage';
import { createBooking, deleteBooking, getBookings, updateBooking } from '../../api/bookingsApi';
import { releaseEventSeatHold } from '../../api/eventSeatsApi';
import { createPayment, getPayments } from '../../api/paymentsApi';
import { formatCurrency } from '../../utils/format';
import { getValue } from '../../utils/entity';
import { calculateUserLoyalty, getLoyaltyDiscount, getPointsForDiscount } from '../../utils/loyalty';
import { calculateBookingPricing, calculatePersistedPaymentPricing } from '../../utils/pricing';
import { useToast } from '../../components/common/ToastProvider';
import { useAuth } from '../../context/AuthContext';
import { getEventById } from '../../api/eventsApi';
import { getVenueById } from '../../api/venuesApi';

const paymentMethodOptions = [
  { value: 'UPI', label: 'UPI' },
  { value: 'CARD', label: 'CARD' },
  { value: 'NETBANKING', label: 'NETBANKING' }
];

const getRemainingSeconds = (holdExpiresAtValue) => {
  const holdExpiresAtMs = Date.parse(holdExpiresAtValue || '');
  if (!Number.isFinite(holdExpiresAtMs)) {
    return 0;
  }

  return Math.max(0, Math.ceil((holdExpiresAtMs - Date.now()) / 1000));
};

const formatCountdown = (secondsRemaining) => {
  const minutes = Math.floor(secondsRemaining / 60)
    .toString()
    .padStart(2, '0');
  const seconds = Math.max(0, secondsRemaining % 60)
    .toString()
    .padStart(2, '0');
  return `${minutes}:${seconds}`;
};

const buildConcertTicketLabel = (ticketSelection) => {
  const categoryName = getValue(ticketSelection, ['categoryName', 'category_name'], '-');
  const quantity = Number(getValue(ticketSelection, ['quantity'], 0));
  return quantity > 0 ? `${categoryName} x${quantity}` : categoryName;
};

const PAYMENT_CANCELED_MESSAGE = 'Payment canceled. Your seats were released.';
const PAYMENT_CANCELED_RELEASE_FALLBACK =
  'Payment canceled. We could not confirm seat release right now, but the hold will expire automatically.';

const CheckoutPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  const { currentUser } = useAuth();

  const [processing, setProcessing] = useState(false);
  const checkoutCompletedRef = useRef(false);
  const exitReleaseInProgressRef = useRef(false);
  const exitCleanupEnabledRef = useRef(false);
  const exitCleanupStateRef = useRef({
    isConcertBooking: false,
    hasSeatHold: false,
    processing: false,
    holdExpired: false,
    holdHandled: false,
    holdToken: '',
    checkoutCompleted: false
  });
  const toastRef = useRef(toast);

  const checkoutData = useMemo(() => location.state?.checkout || getCheckoutSelection(), [location.state]);
  const schedule = checkoutData?.schedule || null;
  const selectedSeats = checkoutData?.selectedSeats || [];
  const ticketSelection = checkoutData?.ticketSelection || null;
  const isConcertBooking = Boolean(ticketSelection);
  const holdToken = String(getValue(checkoutData, ['holdToken', 'hold_token'], '')).trim();
  const holdExpiresAt = getValue(checkoutData, ['holdExpiresAt', 'hold_expires_at'], '');
  const hasSeatHold = !isConcertBooking && Boolean(holdToken && holdExpiresAt);
  const authUserId = getValue(currentUser, ['id', 'user_id', 'userId']);
  const authUserName = getValue(currentUser, ['name', 'user_name', 'userName'], 'User');

  const [formValues, setFormValues] = useState({
    user_id: authUserId || '',
    payment_method: 'UPI'
  });
  const [errors, setErrors] = useState({});
  const [useLoyaltyPoints, setUseLoyaltyPoints] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(() => (isConcertBooking ? 0 : getRemainingSeconds(holdExpiresAt)));
  const [holdExpired, setHoldExpired] = useState(() =>
    isConcertBooking ? false : !hasSeatHold || getRemainingSeconds(holdExpiresAt) <= 0
  );
  const [holdFailureMessage, setHoldFailureMessage] = useState(() =>
    isConcertBooking ? '' : hasSeatHold ? '' : 'Your seat hold is missing. Please select seats again.'
  );
  const [holdHandled, setHoldHandled] = useState(false);
  const [summaryMeta, setSummaryMeta] = useState({
    movieName: getValue(schedule, ['event_name', 'eventName', 'name'], '-'),
    venueName: getValue(schedule, ['venue_name', 'venueName', 'name'], '-'),
    eventImageUrl: getValue(schedule, ['image_url', 'imageUrl']),
    eventCategory: getValue(schedule, ['category']),
    eventStatus: getValue(schedule, ['event_status', 'eventStatus', 'status']),
    eventGenre: getValue(schedule, ['genre']),
    eventLanguage: getValue(schedule, ['language'])
  });
  const [loyalty, setLoyalty] = useState({
    loading: true,
    availablePoints: 0,
    earnedPoints: 0,
    redeemedPoints: 0,
    bookingCount: 0
  });

  const basePricing = useMemo(
    () =>
      calculateBookingPricing({
        selectedSeats,
        ticketSelection
      }),
    [selectedSeats, ticketSelection]
  );
  const subtotal = basePricing.subtotal;

  const discount = useMemo(() => {
    if (!useLoyaltyPoints) {
      return 0;
    }

    return getLoyaltyDiscount(loyalty.availablePoints, subtotal);
  }, [subtotal, loyalty.availablePoints, useLoyaltyPoints]);

  const loyaltyPointsToUse = useMemo(() => {
    if (!useLoyaltyPoints || discount <= 0) {
      return 0;
    }

    return getPointsForDiscount(discount, loyalty.availablePoints);
  }, [discount, loyalty.availablePoints, useLoyaltyPoints]);

  const pricing = useMemo(
    () =>
      calculateBookingPricing({
        selectedSeats,
        ticketSelection,
        discountAmount: discount
      }),
    [discount, selectedSeats, ticketSelection]
  );
  const total = pricing.total;
  const eventId = getValue(schedule, ['event_id', 'eventId']);
  const isInactiveEvent = String(summaryMeta.eventStatus || '').trim().toUpperCase() === 'INACTIVE';

  toastRef.current = toast;
  exitCleanupStateRef.current = {
    isConcertBooking,
    hasSeatHold,
    processing,
    holdExpired,
    holdHandled,
    holdToken,
    checkoutCompleted: checkoutCompletedRef.current
  };

  useEffect(() => {
    setFormValues((current) => ({ ...current, user_id: authUserId || '' }));
    setUseLoyaltyPoints(false);
  }, [authUserId]);

  useEffect(() => {
    if (isConcertBooking) {
      setSecondsRemaining(0);
      setHoldExpired(false);
      setHoldFailureMessage('');
      return undefined;
    }

    if (!hasSeatHold) {
      setSecondsRemaining(0);
      setHoldExpired(true);
      return undefined;
    }

    const updateTimer = () => {
      const nextSecondsRemaining = getRemainingSeconds(holdExpiresAt);
      setSecondsRemaining(nextSecondsRemaining);
      setHoldExpired(nextSecondsRemaining <= 0);
    };

    updateTimer();
    const intervalId = window.setInterval(updateTimer, 1000);
    return () => window.clearInterval(intervalId);
  }, [hasSeatHold, holdExpiresAt, isConcertBooking]);

  useEffect(() => {
    if (isConcertBooking || !holdExpired || holdHandled || processing) {
      return;
    }

    setHoldHandled(true);
    clearCheckoutSelection();

    if (!hasSeatHold) {
      setHoldFailureMessage('Your seat hold is missing. Please select seats again.');
      return;
    }

    const expiryMessage = holdFailureMessage || 'Payment failed because the 3-minute seat hold expired. Please select seats again.';
    setHoldFailureMessage(expiryMessage);
    if (!holdFailureMessage) {
      toast.error(expiryMessage);
    }

    releaseEventSeatHold(holdToken).catch(() => {
      // Ignore release errors. The backend also frees expired holds on read.
    });
  }, [hasSeatHold, holdExpired, holdFailureMessage, holdHandled, holdToken, isConcertBooking, processing, toast]);

  useEffect(() => {
    const enableCleanupId = window.setTimeout(() => {
      exitCleanupEnabledRef.current = true;
    }, 0);

    return () => {
      window.clearTimeout(enableCleanupId);

      const latestState = exitCleanupStateRef.current;
      const shouldReleaseOnExit =
        exitCleanupEnabledRef.current &&
        !exitReleaseInProgressRef.current &&
        !latestState.isConcertBooking &&
        latestState.hasSeatHold &&
        !latestState.processing &&
        !latestState.holdExpired &&
        !latestState.holdHandled &&
        !latestState.checkoutCompleted &&
        Boolean(latestState.holdToken);

      exitCleanupEnabledRef.current = false;

      if (!shouldReleaseOnExit) {
        return;
      }

      exitReleaseInProgressRef.current = true;
      clearCheckoutSelection();

      releaseEventSeatHold(latestState.holdToken)
        .then(() => {
          toastRef.current.info(PAYMENT_CANCELED_MESSAGE);
        })
        .catch(() => {
          toastRef.current.error(PAYMENT_CANCELED_RELEASE_FALLBACK);
        });
    };
  }, []);

  useEffect(() => {
    let active = true;

    const loadSummaryMeta = async () => {
      if (!schedule) {
        setSummaryMeta({
          movieName: '-',
          venueName: '-',
          eventImageUrl: '',
          eventCategory: '',
          eventStatus: '',
          eventGenre: '',
          eventLanguage: ''
        });
        return;
      }

      const eventId = getValue(schedule, ['event_id', 'eventId', 'id']);
      const venueId = getValue(schedule, ['venue_id', 'venueId', 'id']);
      const localMovieName = getValue(schedule, ['event_name', 'eventName', 'name']);
      const localVenueName = getValue(schedule, ['venue_name', 'venueName', 'name']);

      try {
        const [eventResponse, venueResponse] = await Promise.all([
          eventId ? getEventById(eventId) : Promise.resolve(null),
          venueId ? getVenueById(venueId) : Promise.resolve(null)
        ]);

        if (!active) {
          return;
        }

        setSummaryMeta({
          movieName: getValue(eventResponse, ['event_name', 'name'], localMovieName || '-'),
          venueName: getValue(venueResponse, ['venue_name', 'name'], localVenueName || '-'),
          eventImageUrl: getValue(eventResponse, ['image_url', 'imageUrl']),
          eventCategory: getValue(eventResponse, ['category'], getValue(schedule, ['category'])),
          eventStatus: getValue(eventResponse, ['event_status', 'eventStatus', 'status'], getValue(schedule, ['event_status', 'eventStatus', 'status'])),
          eventGenre: getValue(eventResponse, ['genre'], getValue(schedule, ['genre'])),
          eventLanguage: getValue(eventResponse, ['language'], getValue(schedule, ['language']))
        });
      } catch (error) {
        if (!active) {
          return;
        }
        setSummaryMeta({
          movieName: localMovieName || '-',
          venueName: localVenueName || '-',
          eventImageUrl: getValue(schedule, ['image_url', 'imageUrl']),
          eventCategory: getValue(schedule, ['category']),
          eventStatus: getValue(schedule, ['event_status', 'eventStatus', 'status']),
          eventGenre: getValue(schedule, ['genre']),
          eventLanguage: getValue(schedule, ['language'])
        });
      }
    };

    loadSummaryMeta();

    return () => {
      active = false;
    };
  }, [schedule]);

  useEffect(() => {
    let active = true;

    const loadLoyalty = async () => {
      if (!authUserId) {
        setLoyalty({
          loading: false,
          availablePoints: 0,
          earnedPoints: 0,
          redeemedPoints: 0,
          bookingCount: 0
        });
        return;
      }

      try {
        setLoyalty((current) => ({ ...current, loading: true }));
        const [bookingsResponse, paymentsResponse] = await Promise.all([getBookings(), getPayments()]);
        const loyaltyStats = calculateUserLoyalty({
          bookings: bookingsResponse,
          payments: paymentsResponse,
          userId: authUserId
        });

        if (!active) {
          return;
        }

        setLoyalty({
          loading: false,
          availablePoints: loyaltyStats.availablePoints,
          earnedPoints: loyaltyStats.earnedPoints,
          redeemedPoints: loyaltyStats.redeemedPoints,
          bookingCount: loyaltyStats.bookingCount
        });
      } catch (error) {
        if (!active) {
          return;
        }
        setLoyalty({
          loading: false,
          availablePoints: 0,
          earnedPoints: 0,
          redeemedPoints: 0,
          bookingCount: 0
        });
        toast.error('Unable to load loyalty points');
      }
    };

    loadLoyalty();

    return () => {
      active = false;
    };
  }, [authUserId, toast]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: '' }));
  };

  const validate = () => {
    const nextErrors = {};
    if (!authUserId) {
      nextErrors.user_id = 'User not found. Please login again.';
    }
    if (!formValues.payment_method) {
      nextErrors.payment_method = 'Payment method is required';
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleCheckout = async (event) => {
    event.preventDefault();

    if (!validate()) {
      return;
    }

    if (!schedule || (!isConcertBooking && !selectedSeats.length) || (isConcertBooking && !ticketSelection)) {
      toast.error(isConcertBooking ? 'Ticket selection is missing. Please choose tickets again.' : 'Seat selection is missing. Please choose seats again.');
      navigate('/events');
      return;
    }

    if (isInactiveEvent) {
      toast.error('This event is inactive and cannot be booked.');
      navigate(eventId ? `/events/${eventId}` : '/events');
      return;
    }

    if (!isConcertBooking && (!hasSeatHold || holdExpired || secondsRemaining <= 0)) {
      const expiryMessage = 'Payment failed because your seat hold expired. Please select your seats again.';
      setHoldExpired(true);
      setHoldFailureMessage(expiryMessage);
      toast.error(expiryMessage);
      return;
    }

    let createdBookingId = null;

    try {
      setProcessing(true);

      const scheduleId = Number(getValue(schedule, ['schedule_id', 'id']));
      const discountAmount = discount;

      let bookingPayload;

      if (isConcertBooking) {
        const ticketCategoryId = Number(getValue(ticketSelection, ['ticketCategoryId', 'ticket_category_id']));
        const ticketQuantity = Number(getValue(ticketSelection, ['quantity'], 0));

        if (!Number.isFinite(ticketCategoryId) || ticketCategoryId <= 0 || !Number.isFinite(ticketQuantity) || ticketQuantity <= 0) {
          throw new Error('Selected concert tickets are invalid. Please choose them again.');
        }

        bookingPayload = {
          userId: Number(authUserId) || authUserId,
          scheduleId,
          ticketCategoryId,
          ticketQuantity,
          eventSeatIds: []
        };
      } else {
        const eventSeatIds = selectedSeats
          .map((seat) => Number(getValue(seat, ['event_seat_id', 'eventSeatId', 'id'])))
          .filter((id) => Number.isFinite(id) && id > 0);

        if (!eventSeatIds.length) {
          throw new Error('Selected seats are invalid. Please select seats again.');
        }

        bookingPayload = {
          userId: Number(authUserId) || authUserId,
          scheduleId,
          holdToken,
          eventSeatIds
        };
      }

      const bookingResponse = await createBooking(bookingPayload);
      const bookingId = getValue(bookingResponse, ['booking_id', 'bookingId', 'id']);

      if (!bookingId) {
        throw new Error('Booking response missing booking ID');
      }

      createdBookingId = bookingId;

      const paymentPayload = {
        bookingId,
        paymentMethod: formValues.payment_method,
        amount: total,
        discountAmount,
        convenienceFee: pricing.convenienceFee,
        gstPercentage: pricing.gstPercentage,
        gstAmount: pricing.gstAmount,
        paymentStatus: 'SUCCESS',
        transactionId: `TXN_${Date.now()}`
      };

      const paymentResponse = await createPayment(paymentPayload);
      const paymentPricing = calculatePersistedPaymentPricing({
        payment: paymentResponse,
        quantity: pricing.quantity
      });
      const paymentStatus = String(getValue(paymentResponse, ['payment_status', 'paymentStatus'], 'SUCCESS')).toUpperCase();
      let bookingStatus = String(getValue(bookingResponse, ['booking_status', 'bookingStatus'], 'BOOKED')).toUpperCase();

      if (paymentStatus === 'SUCCESS') {
        const updatedBooking = await updateBooking(bookingId, { bookingStatus: 'CONFIRMED' });
        bookingStatus = String(getValue(updatedBooking, ['booking_status', 'bookingStatus'], 'CONFIRMED')).toUpperCase();
      }

      const reservationLabel = isConcertBooking
        ? buildConcertTicketLabel(ticketSelection)
        : selectedSeats.map((seat) => `${getValue(seat, ['seat_row'])}-${getValue(seat, ['seat_number'])}`).join(', ');

      const successData = {
        booking_id: bookingId,
        booking_status: bookingStatus,
        booking_date: getValue(bookingResponse, ['booking_date', 'bookingDate']) || new Date().toISOString(),
        schedule_id: scheduleId,
        user_name: getValue(currentUser, ['name', 'user_name', 'userName'], authUserName),
        user_email: getValue(currentUser, ['email'], ''),
        user_mobile: getValue(currentUser, ['mobile_number', 'mobileNumber'], ''),
        event_name: summaryMeta.movieName || getValue(schedule, ['event_name', 'eventName', 'name'], '-'),
        event_image_url: summaryMeta.eventImageUrl || getValue(schedule, ['image_url', 'imageUrl'], ''),
        event_category: summaryMeta.eventCategory || getValue(schedule, ['category'], ''),
        event_genre: summaryMeta.eventGenre || getValue(schedule, ['genre'], ''),
        event_language: summaryMeta.eventLanguage || getValue(schedule, ['language'], ''),
        venue_name: summaryMeta.venueName || getValue(schedule, ['venue_name', 'venueName', 'name'], '-'),
        audi_name: getValue(schedule, ['audi_name', 'audiName'], 'Audi 1'),
        show_date: getValue(schedule, ['show_date', 'showDate']),
        show_time: getValue(schedule, ['show_time', 'showTime']),
        seat_labels: isConcertBooking
          ? []
          : selectedSeats.map((seat) => `${getValue(seat, ['seat_row'])}-${getValue(seat, ['seat_number'])}`),
        ticket_category_name: isConcertBooking
          ? getValue(ticketSelection, ['categoryName', 'category_name'])
          : getValue(bookingResponse, ['ticket_category_name', 'ticketCategoryName'], ''),
        ticket_quantity: isConcertBooking
          ? Number(getValue(ticketSelection, ['quantity'], 0))
          : Number(getValue(bookingResponse, ['ticket_quantity', 'ticketQuantity'], 0)),
        reservation_label: reservationLabel,
        seat_label_title: isConcertBooking ? 'Tickets' : 'Seats',
        payment_status: paymentStatus,
        payment_id: getValue(paymentResponse, ['payment_id', 'paymentId', 'id']),
        transaction_id: getValue(paymentResponse, ['transaction_id', 'transactionId'], ''),
        subtotal: paymentPricing.subtotal,
        convenience_fee: paymentPricing.convenienceFee,
        gst_percentage: paymentPricing.gstPercentage,
        gst_amount: paymentPricing.gstAmount,
        amount: paymentPricing.total,
        payment_method: formValues.payment_method,
        loyalty_points_available_before: loyalty.availablePoints,
        loyalty_points_used: loyaltyPointsToUse,
        loyalty_points_remaining: Math.max(0, Number(loyalty.availablePoints || 0) - loyaltyPointsToUse),
        loyalty_discount: paymentPricing.discount
      };

      setSelectedUserId(authUserId);
      clearCheckoutSelection();
      setLastBookingSuccess(successData);
      checkoutCompletedRef.current = true;

      toast.success('Booking confirmed successfully');
      navigate('/booking/success', { state: successData });
    } catch (err) {
      if (createdBookingId) {
        try {
          await deleteBooking(createdBookingId);
        } catch {
          // Ignore cleanup errors and still show the booking failure.
        }

        const paymentFailureMessage = isConcertBooking
          ? 'Payment failed. Please try your concert booking again.'
          : 'Payment failed. Your seats were released. Please select them again.';

        if (!isConcertBooking) {
          setHoldExpired(true);
          setHoldFailureMessage(paymentFailureMessage);
        }

        clearCheckoutSelection();
        toast.error(paymentFailureMessage);
        return;
      }

      if (!isConcertBooking && String(err.message || '').toLowerCase().includes('hold')) {
        const expiryMessage = 'Payment failed because your seat hold expired. Please select your seats again.';
        setHoldExpired(true);
        setHoldFailureMessage(expiryMessage);
        clearCheckoutSelection();
        toast.error(expiryMessage);
        return;
      }

      toast.error(err.message || 'Unable to complete booking');
    } finally {
      setProcessing(false);
    }
  };

  if ((!isConcertBooking && !selectedSeats.length) || (isConcertBooking && !ticketSelection) || !schedule) {
    return (
      <section className="container section">
        <div className="state-wrapper empty">
          <h2>{isConcertBooking ? 'No tickets selected' : 'No seats selected'}</h2>
          <p>{isConcertBooking ? 'Please go back and choose concert tickets before checkout.' : 'Please go back and select seats before checkout.'}</p>
          <Link to="/events" className="btn btn-primary">
            Browse Events
          </Link>
        </div>
      </section>
    );
  }

  if (isInactiveEvent) {
    return (
      <section className="container section">
        <div className="state-wrapper empty">
          <h2>Booking Unavailable</h2>
          <p>This event is inactive, so checkout has been disabled.</p>
          <Link to={eventId ? `/events/${eventId}` : '/events'} className="btn btn-primary">
            Back to Event
          </Link>
        </div>
      </section>
    );
  }

  if (!isConcertBooking && holdExpired) {
    return (
      <section className="container section">
        <div className="state-wrapper empty">
          <h2>Payment Failed</h2>
          <p>{holdFailureMessage || 'Your seat hold expired. Please select your seats again.'}</p>
          <Link to={eventId ? `/events/${eventId}` : '/events'} className="btn btn-primary">
            Select Seats Again
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="container section">
      <div className="section-head">
        <div>
          <h1>Booking Checkout</h1>
          <p>{isConcertBooking ? 'Review selected tickets and complete payment.' : 'Review selected seats and complete payment.'}</p>
        </div>
      </div>

      <div className="checkout-layout">
        <form className="checkout-form" onSubmit={handleCheckout}>
          <h3>Customer & Payment Details</h3>
          {!isConcertBooking ? (
            <div className="checkout-timer">
              <span className="checkout-timer-label">Complete payment within</span>
              <strong>{formatCountdown(secondsRemaining)}</strong>
              <p>Your seats stay locked for 3 minutes. If the timer ends, payment will fail and the seats will be released.</p>
            </div>
          ) : null}
          <FormInput
            label="User Name"
            name="user_id"
            value={authUserName || ''}
            disabled
            required
            error={errors.user_id}
          />
          <SelectInput
            label="Payment Method"
            name="payment_method"
            value={formValues.payment_method}
            onChange={handleInputChange}
            required
            error={errors.payment_method}
            options={paymentMethodOptions}
          />
          <div className="loyalty-box">
            <label className={`loyalty-toggle ${loyalty.loading || !loyalty.availablePoints ? 'disabled' : ''}`}>
              <input
                type="checkbox"
                checked={useLoyaltyPoints}
                onChange={(inputEvent) => setUseLoyaltyPoints(inputEvent.target.checked)}
                disabled={loyalty.loading || !loyalty.availablePoints || processing}
              />
              <span>Use loyalty points for this booking</span>
            </label>
            <p className="loyalty-note">
              {loyalty.loading
                ? 'Loading loyalty details...'
                : `Available ${loyalty.availablePoints} pts (earned ${loyalty.earnedPoints}, used ${loyalty.redeemedPoints})`}
            </p>
          </div>
          <div className="summary-totals">
            <div>
              <span>Seat / Ticket Subtotal</span>
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
            <div>
              <span>Loyalty Points Available</span>
              <strong>{loyalty.loading ? 'Loading...' : loyalty.availablePoints}</strong>
            </div>
            <div>
              <span>Points Used This Booking</span>
              <strong>{useLoyaltyPoints ? loyaltyPointsToUse : 0}</strong>
            </div>
            <div>
              <span>Loyalty Discount</span>
              <strong>- {formatCurrency(pricing.discount)}</strong>
            </div>
            <div>
              <span>Payable Amount</span>
              <strong>{formatCurrency(total)}</strong>
            </div>
          </div>
          <button
            type="submit"
            className="btn btn-primary full-width-btn"
            disabled={processing || isInactiveEvent || (!isConcertBooking && secondsRemaining <= 0)}
          >
            {processing ? 'Processing Booking...' : 'Confirm Booking & Pay'}
          </button>
        </form>

        <BookingSummary
          schedule={schedule}
          selectedSeats={selectedSeats}
          ticketSelection={ticketSelection}
          discountAmount={discount}
          movieName={summaryMeta.movieName}
          venueName={summaryMeta.venueName}
        />
      </div>
    </section>
  );
};

export default CheckoutPage;
