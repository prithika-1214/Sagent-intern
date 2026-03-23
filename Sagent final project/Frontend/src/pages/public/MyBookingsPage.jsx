import { useEffect, useMemo, useState } from 'react';
import DataTable from '../../components/common/DataTable';
import Loader from '../../components/common/Loader';
import ErrorState from '../../components/common/ErrorState';
import EmptyState from '../../components/common/EmptyState';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { getBookings } from '../../api/bookingsApi';
import { getBookedSeatsByBookingId } from '../../api/bookedSeatsApi';
import { getPayments } from '../../api/paymentsApi';
import { createCancellation } from '../../api/cancellationsApi';
import { getEventSeats } from '../../api/eventSeatsApi';
import { getSeats } from '../../api/seatsApi';
import { getEvents } from '../../api/eventsApi';
import { getSchedules } from '../../api/schedulesApi';
import { getVenues } from '../../api/venuesApi';
import { formatCurrency, formatDate, formatDateTime, formatTime } from '../../utils/format';
import { getValue, normalizeArray } from '../../utils/entity';
import { calculateUserLoyalty } from '../../utils/loyalty';
import { calculatePersistedPaymentPricing } from '../../utils/pricing';
import { getStatusClassName } from '../../utils/status';
import { useToast } from '../../components/common/ToastProvider';
import { useAuth } from '../../context/AuthContext';
import { downloadTicketPdf } from '../../utils/ticketPdf';

const toId = (value) => String(value ?? '').trim();
const toDateTime = (dateValue, timeValue) => {
  if (!dateValue || !timeValue) {
    return null;
  }

  const normalizedDate = String(dateValue).trim();
  const normalizedTime = String(timeValue).trim();
  if (!normalizedDate || !normalizedTime) {
    return null;
  }

  const parsed = new Date(`${normalizedDate}T${normalizedTime}`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const MyBookingsPage = () => {
  const toast = useToast();
  const { currentUser } = useAuth();

  const [bookings, setBookings] = useState([]);
  const [bookedSeatsMap, setBookedSeatsMap] = useState({});
  const [paymentsMap, setPaymentsMap] = useState({});
  const [eventSeatsMap, setEventSeatsMap] = useState({});
  const [seatsMap, setSeatsMap] = useState({});
  const [eventsMap, setEventsMap] = useState({});
  const [schedulesMap, setSchedulesMap] = useState({});
  const [venuesMap, setVenuesMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [generatingTicketId, setGeneratingTicketId] = useState('');
  const [cancelLoading, setCancelLoading] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      const [bookingsResponse, paymentsResponse, eventSeatsResponse, seatsResponse, eventsResponse, schedulesResponse, venuesResponse] = await Promise.all([
        getBookings(),
        getPayments(),
        getEventSeats(),
        getSeats(),
        getEvents(),
        getSchedules(),
        getVenues()
      ]);

      const bookingList = normalizeArray(bookingsResponse);
      const paymentList = normalizeArray(paymentsResponse);
      const eventSeatsList = normalizeArray(eventSeatsResponse);
      const seatsList = normalizeArray(seatsResponse);
      const eventsList = normalizeArray(eventsResponse);
      const schedulesList = normalizeArray(schedulesResponse);
      const venuesList = normalizeArray(venuesResponse);

      const bookingSeatEntries = await Promise.all(
        bookingList.map(async (booking) => {
          const bookingId = getValue(booking, ['booking_id', 'id']);
          try {
            const response = await getBookedSeatsByBookingId(bookingId);
            return [bookingId, normalizeArray(response)];
          } catch (err) {
            return [bookingId, []];
          }
        })
      );

      const paymentByBooking = paymentList.reduce((acc, payment) => {
        const bookingId = getValue(payment, ['booking_id']);
        if (bookingId !== undefined && bookingId !== null && bookingId !== '') {
          acc[bookingId] = payment;
        }
        return acc;
      }, {});

      const eventSeatById = eventSeatsList.reduce((acc, seat) => {
        const id = getValue(seat, ['event_seat_id', 'id']);
        if (id !== undefined && id !== null && id !== '') {
          acc[id] = seat;
        }
        return acc;
      }, {});

      const seatById = seatsList.reduce((acc, seat) => {
        const id = getValue(seat, ['seat_id', 'id']);
        if (id !== undefined && id !== null && id !== '') {
          acc[id] = seat;
        }
        return acc;
      }, {});

      const eventById = eventsList.reduce((acc, event) => {
        const id = toId(getValue(event, ['event_id', 'eventId', 'id']));
        if (id) {
          acc[id] = event;
        }
        return acc;
      }, {});

      const scheduleById = schedulesList.reduce((acc, schedule) => {
        const id = toId(getValue(schedule, ['schedule_id', 'scheduleId', 'id']));
        if (id) {
          acc[id] = schedule;
        }
        return acc;
      }, {});

      const venueById = venuesList.reduce((acc, venue) => {
        const id = toId(getValue(venue, ['venue_id', 'venueId', 'id']));
        if (id) {
          acc[id] = venue;
        }
        return acc;
      }, {});

      setBookings(bookingList);
      setBookedSeatsMap(Object.fromEntries(bookingSeatEntries));
      setPaymentsMap(paymentByBooking);
      setEventSeatsMap(eventSeatById);
      setSeatsMap(seatById);
      setEventsMap(eventById);
      setSchedulesMap(scheduleById);
      setVenuesMap(venueById);
    } catch (err) {
      setError(err.message || 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentUserId = String(getValue(currentUser, ['id', 'user_id', 'userId'], ''));
  const filteredBookings = useMemo(
    () =>
      bookings
        .filter((booking) => String(getValue(booking, ['user_id'])) === currentUserId)
        .sort((left, right) => {
          const leftDate = Date.parse(getValue(left, ['booking_date', 'bookingDate'], '')) || 0;
          const rightDate = Date.parse(getValue(right, ['booking_date', 'bookingDate'], '')) || 0;

          if (rightDate !== leftDate) {
            return rightDate - leftDate;
          }

          const leftId = Number(getValue(left, ['booking_id', 'bookingId', 'id'], 0)) || 0;
          const rightId = Number(getValue(right, ['booking_id', 'bookingId', 'id'], 0)) || 0;
          return rightId - leftId;
        }),
    [bookings, currentUserId]
  );
  const loyaltyStats = useMemo(
    () =>
      calculateUserLoyalty({
        bookings: filteredBookings,
        payments: Object.values(paymentsMap),
        userId: currentUserId
      }),
    [filteredBookings, paymentsMap, currentUserId]
  );

  const getReservationLabelsByBooking = (booking) => {
    const ticketCategoryName = getValue(booking, ['ticket_category_name', 'ticketCategoryName'], '');
    const ticketQuantity = Number(getValue(booking, ['ticket_quantity', 'ticketQuantity'], 0));
    if (ticketCategoryName && ticketQuantity > 0) {
      return [`${ticketCategoryName} x${ticketQuantity}`];
    }

    const bookingId = getValue(booking, ['booking_id', 'id']);
    const bookedSeatRows = bookedSeatsMap[bookingId] || [];

    if (!bookedSeatRows.length) {
      return ['-'];
    }

    return bookedSeatRows.map((bookedSeat) => {
      const eventSeatId = getValue(bookedSeat, ['event_seat_id']);
      const eventSeat = eventSeatsMap[eventSeatId];
      const seat = seatsMap[getValue(eventSeat, ['seat_id'])];

      if (!eventSeat || !seat) {
        return `EventSeat#${eventSeatId}`;
      }

      return `${getValue(seat, ['seat_row'], 'R')}-${getValue(seat, ['seat_number'], eventSeatId)}`;
    });
  };

  const getReservationLabelTitle = (booking) =>
    getValue(booking, ['ticket_category_name', 'ticketCategoryName']) ? 'Tickets' : 'Seats';

  const getScheduleByBooking = (booking) => {
    const scheduleId = toId(getValue(booking, ['schedule_id', 'scheduleId']));
    return schedulesMap[scheduleId] || null;
  };

  const getEventNameByBooking = (booking) => {
    const event = getEventByBooking(booking);
    return getValue(event, ['event_name', 'name'], '-');
  };

  const getEventByBooking = (booking) => {
    const schedule = getScheduleByBooking(booking);
    if (!schedule) {
      return null;
    }

    const eventId = toId(getValue(schedule, ['event_id', 'eventId']));
    return eventsMap[eventId] || null;
  };

  const getVenueNameByBooking = (booking) => {
    const schedule = getScheduleByBooking(booking);
    if (!schedule) {
      return '-';
    }

    const venueId = toId(getValue(schedule, ['venue_id', 'venueId']));
    const venue = venuesMap[venueId];
    return getValue(venue, ['venue_name', 'name'], '-');
  };

  const getShowTimeByBooking = (booking, includeAudi = true) => {
    const schedule = getScheduleByBooking(booking);
    if (!schedule) {
      return '-';
    }

    const showDate = getValue(schedule, ['show_date', 'showDate']);
    const showTime = getValue(schedule, ['show_time', 'showTime']);
    const audiName = getValue(schedule, ['audi_name', 'audiName'], '');
    const audiSuffix = includeAudi && audiName ? ` | ${audiName}` : '';

    if (showDate && showTime) {
      return `${formatDate(showDate)} ${formatTime(showTime)}${audiSuffix}`;
    }
    if (showDate) {
      return `${formatDate(showDate)}${audiSuffix}`;
    }
    if (showTime) {
      return `${formatTime(showTime)}${audiSuffix}`;
    }
    return '-';
  };

  const isScheduleCancelledByAdmin = (booking) => {
    const schedule = getScheduleByBooking(booking);
    const scheduleStatus = String(getValue(schedule, ['schedule_status', 'scheduleStatus'], '')).toUpperCase();
    return scheduleStatus === 'CANCELLED';
  };

  const isShowOver = (booking) => {
    const schedule = getScheduleByBooking(booking);
    if (!schedule) {
      return false;
    }

    const showDate = getValue(schedule, ['show_date', 'showDate']);
    const endTime = getValue(schedule, ['end_time', 'endTime']);
    const showTime = getValue(schedule, ['show_time', 'showTime']);
    const showEndDateTime = toDateTime(showDate, endTime || showTime);

    if (!showEndDateTime) {
      return false;
    }

    return Date.now() > showEndDateTime.getTime();
  };

  const getEffectiveBookingStatus = (booking) => {
    const bookingStatus = String(getValue(booking, ['booking_status', 'bookingStatus'], 'UNKNOWN')).toUpperCase();
    if (bookingStatus !== 'BOOKED') {
      return bookingStatus === 'CONFIRMED' && isShowOver(booking) ? 'ENJOYED' : bookingStatus;
    }

    const bookingId = getValue(booking, ['booking_id', 'id']);
    const payment = paymentsMap[bookingId];
    const paymentStatus = String(getValue(payment, ['payment_status', 'paymentStatus'], '')).toUpperCase();
    if (paymentStatus === 'SUCCESS') {
      return isShowOver(booking) ? 'ENJOYED' : 'CONFIRMED';
    }

    return bookingStatus;
  };

  const getDisplayBookingStatus = (booking) =>
    isScheduleCancelledByAdmin(booking) ? 'SCHEDULE CANCELLED' : getEffectiveBookingStatus(booking);

  const getPaymentByBooking = (booking) => paymentsMap[getValue(booking, ['booking_id', 'id'])];

  const getTicketUserDetails = () => ({
    name: getValue(currentUser, ['name', 'user_name', 'userName'], '-'),
    email: getValue(currentUser, ['email'], '-'),
    mobile: getValue(currentUser, ['mobile_number', 'mobileNumber'], '-')
  });

  const handleGenerateTicket = async (booking) => {
    const bookingId = getValue(booking, ['booking_id', 'id']);
    const payment = getPaymentByBooking(booking);
    const paymentStatus = String(getValue(payment, ['payment_status', 'paymentStatus'], '')).toUpperCase();

    if (paymentStatus !== 'SUCCESS') {
      toast.error('Ticket can be generated only for successful payments');
      return;
    }

    try {
      setGeneratingTicketId(String(bookingId));
      const userDetails = getTicketUserDetails();
      const event = getEventByBooking(booking);
      const reservationLabels = getReservationLabelsByBooking(booking);
      const reservationQuantity = getValue(booking, ['ticket_category_name', 'ticketCategoryName'])
        ? Number(getValue(booking, ['ticket_quantity', 'ticketQuantity'], 0))
        : reservationLabels.length;
      const paymentPricing = calculatePersistedPaymentPricing({
        payment,
        quantity: reservationQuantity
      });
      await downloadTicketPdf({
        bookingId,
        bookingDate: formatDateTime(getValue(booking, ['booking_date', 'bookingDate'])),
        bookingStatus: getEffectiveBookingStatus(booking),
        userName: userDetails.name,
        userEmail: userDetails.email,
        userMobile: userDetails.mobile,
        eventName: getEventNameByBooking(booking),
        eventImageUrl: getValue(event, ['image_url', 'imageUrl']),
        eventCategory: getValue(event, ['category']),
        eventGenre: getValue(event, ['genre']),
        eventLanguage: getValue(event, ['language']),
        venueName: getVenueNameByBooking(booking),
        showTime: getShowTimeByBooking(booking),
        seatLabels: reservationLabels.join(', '),
        seatLabelTitle: getReservationLabelTitle(booking),
        paymentStatus,
        paymentMethod: getValue(payment, ['payment_method', 'paymentMethod'], '-'),
        subtotal: formatCurrency(paymentPricing.subtotal),
        convenienceFee: formatCurrency(paymentPricing.convenienceFee),
        gstPercentage: paymentPricing.gstPercentage,
        gstAmount: formatCurrency(paymentPricing.gstAmount),
        discount: formatCurrency(paymentPricing.discount),
        amount: formatCurrency(paymentPricing.total),
        transactionId: getValue(payment, ['transaction_id', 'transactionId'], '-')
      });
      toast.success('Ticket downloaded');
    } catch (error) {
      toast.error(error.message || 'Unable to generate ticket');
    } finally {
      setGeneratingTicketId('');
    }
  };

  const openCancelModal = (booking) => {
    setSelectedBooking(booking);
  };

  const closeCancelDialog = () => {
    if (cancelLoading) {
      return;
    }

    setSelectedBooking(null);
  };

  const handleCancellationConfirm = async () => {
    if (!selectedBooking) {
      return;
    }

    const bookingId = getValue(selectedBooking, ['booking_id', 'id']);
    const userId = getValue(selectedBooking, ['user_id', 'userId']);
    const payment = paymentsMap[bookingId];

    try {
      setCancelLoading(true);
      await createCancellation({
        booking_id: Number(bookingId) || bookingId,
        user_id: Number(userId) || userId,
        cancellation_reason: 'Cancellation requested by user',
        cancellation_type: 'USER_CANCELLED',
        refund_amount: Number(getValue(payment, ['amount'], 0)),
        refund_status: 'PENDING'
      });

      toast.success(`Booking ${bookingId} cancelled. Refund is pending.`);
      setSelectedBooking(null);
      await loadData();
    } catch (err) {
      toast.error(err.message || 'Unable to cancel booking');
    } finally {
      setCancelLoading(false);
    }
  };

  const columns = [
    {
      key: 'booking_id',
      label: 'Booking ID',
      render: (row) => getValue(row, ['booking_id', 'id'])
    },
    {
      key: 'booking_date',
      label: 'Booking Date',
      render: (row) => formatDateTime(getValue(row, ['booking_date']))
    },
    {
      key: 'booking_status',
      label: 'Status',
      render: (row) => {
        const displayStatus = getDisplayBookingStatus(row);
        const className = isScheduleCancelledByAdmin(row) ? getStatusClassName('CANCELLED') : getStatusClassName(displayStatus);
        return <span className={className}>{displayStatus}</span>;
      }
    },
    {
      key: 'event_name',
      label: 'Event',
      render: (row) => getEventNameByBooking(row)
    },
    {
      key: 'show_time',
      label: 'Show Time',
      render: (row) => {
        const value = getShowTimeByBooking(row);
        return isScheduleCancelledByAdmin(row) ? `${value} | Schedule Cancelled` : value;
      }
    },
    {
      key: 'venue_name',
      label: 'Venue',
      render: (row) => getVenueNameByBooking(row)
    },
    {
      key: 'seats',
      label: 'Seats / Tickets',
      render: (row) => {
        return getReservationLabelsByBooking(row).join(', ');
      }
    },
    {
      key: 'payment_amount',
      label: 'Payment Amount',
      render: (row) => {
        const payment = getPaymentByBooking(row);
        return payment ? formatCurrency(getValue(payment, ['amount'], 0)) : '-';
      }
    },
    {
      key: 'payment_status',
      label: 'Payment Status',
      render: (row) => {
        const payment = getPaymentByBooking(row);
        const status = getValue(payment, ['payment_status']);
        if (!status) {
          return '-';
        }
        return <span className={getStatusClassName(status)}>{status}</span>;
      }
    }
  ];

  if (loading) {
    return <Loader text="Loading bookings..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadData} />;
  }

  return (
    <section className="container section">
      <div className="section-head">
        <div>
          <h1>My Bookings</h1>
          <p>Track seats or concert tickets, payment status, and cancellation details.</p>
        </div>
      </div>

      <div className="loyalty-overview">
        <div>
          <span>Loyalty Points Available</span>
              <strong>{loyaltyStats.availablePoints}</strong>
            </div>
        <div>
          <span>Loyalty Points Earned</span>
          <strong>{loyaltyStats.earnedPoints}</strong>
        </div>
        <div>
          <span>Loyalty Points Used</span>
          <strong>{loyaltyStats.redeemedPoints}</strong>
        </div>
      </div>

      {!filteredBookings.length ? (
        <EmptyState title="No bookings found" description="You do not have any bookings yet." />
      ) : (
        <DataTable
          columns={columns}
          rows={filteredBookings}
          rowKey={(row, index) => `${getValue(row, ['booking_id', 'bookingId', 'id'], 'booking')}-${index}`}
          actions={(row) => {
            const effectiveStatus = getEffectiveBookingStatus(row);
            const disabled = isScheduleCancelledByAdmin(row) || effectiveStatus === 'CANCELLED' || effectiveStatus === 'ENJOYED';
            const bookingId = String(getValue(row, ['booking_id', 'id']));
            const payment = getPaymentByBooking(row);
            const paymentStatus = String(getValue(payment, ['payment_status', 'paymentStatus'], '')).toUpperCase();
            const canGenerateTicket = paymentStatus === 'SUCCESS';
            const isGeneratingThisRow = generatingTicketId === bookingId;
            const cancelButtonLabel =
              effectiveStatus === 'ENJOYED'
                ? 'Enjoyed'
                : disabled
                  ? 'Cancelled'
                  : 'Cancel Booking';
            return (
              <>
                <button
                  type="button"
                  className="btn btn-small btn-outline"
                  onClick={() => handleGenerateTicket(row)}
                  disabled={!canGenerateTicket || isGeneratingThisRow}
                >
                  {isGeneratingThisRow ? 'Generating...' : 'Generate Ticket'}
                </button>
                <button
                  type="button"
                  className="btn btn-small btn-danger"
                  onClick={() => openCancelModal(row)}
                  disabled={disabled}
                >
                  {cancelButtonLabel}
                </button>
              </>
            );
          }}
        />
      )}

      <ConfirmDialog
        isOpen={Boolean(selectedBooking)}
        title="Cancel Booking"
        message={
          selectedBooking
            ? `Cancel booking for ${getEventNameByBooking(selectedBooking)} at ${getShowTimeByBooking(selectedBooking, false)}?`
            : 'Cancel this booking?'
        }
        confirmText="Confirm Cancellation"
        onConfirm={handleCancellationConfirm}
        onCancel={closeCancelDialog}
        loading={cancelLoading}
      />
    </section>
  );
};

export default MyBookingsPage;
