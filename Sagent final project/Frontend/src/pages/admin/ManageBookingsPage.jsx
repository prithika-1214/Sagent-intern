import { useCallback, useMemo, useState } from 'react';
import AdminCrudPage from '../../components/admin/AdminCrudPage';
import { deleteBooking, getBookings, updateBooking } from '../../api/bookingsApi';
import { getUsers } from '../../api/usersApi';
import { getSchedules } from '../../api/schedulesApi';
import { getEvents } from '../../api/eventsApi';
import { getVenues } from '../../api/venuesApi';
import { getEventSeats } from '../../api/eventSeatsApi';
import { getSeats } from '../../api/seatsApi';
import { getStatusClassName } from '../../utils/status';
import { formatDate, formatDateTime, formatTime } from '../../utils/format';
import { getValue, normalizeArray } from '../../utils/entity';

const toId = (value) => String(value ?? '').trim();
const toTimestamp = (value) => {
  const parsed = Date.parse(value || '');
  return Number.isNaN(parsed) ? 0 : parsed;
};

const toLookup = (items, keys) =>
  normalizeArray(items).reduce((acc, item) => {
    const id = toId(getValue(item, keys));
    if (id) {
      acc[id] = item;
    }
    return acc;
  }, {});

const formatSeatLabel = (seat) => {
  const seatRow = String(getValue(seat, ['seat_row', 'seatRow'], '')).trim();
  const seatNumber = String(getValue(seat, ['seat_number', 'seatNumber'], '')).trim();

  if (seatRow && seatNumber) {
    return `${seatRow}-${seatNumber}`;
  }

  return seatNumber || seatRow || '-';
};

const formatShowDateTime = (schedule) => {
  const showDate = getValue(schedule, ['show_date', 'showDate']);
  const showTime = getValue(schedule, ['show_time', 'showTime']);

  if (!showDate && !showTime) {
    return '-';
  }

  return `${formatDate(showDate)} | ${formatTime(showTime)}`;
};

const normalizeBookingStatus = (value) => {
  const normalized = String(value || 'CONFIRMED').trim().toUpperCase();
  if (normalized === 'BOOKED') {
    return 'CONFIRMED';
  }
  return normalized || 'CONFIRMED';
};

const loadBookingsTable = async () => {
  const [bookingsResponse, usersResponse, schedulesResponse, eventsResponse, venuesResponse, eventSeatsResponse, seatsResponse] =
    await Promise.all([getBookings(), getUsers(), getSchedules(), getEvents(), getVenues(), getEventSeats(), getSeats()]);

  const usersById = toLookup(usersResponse, ['user_id', 'userId', 'id']);
  const schedulesById = toLookup(schedulesResponse, ['schedule_id', 'scheduleId', 'id']);
  const eventsById = toLookup(eventsResponse, ['event_id', 'eventId', 'id']);
  const venuesById = toLookup(venuesResponse, ['venue_id', 'venueId', 'id']);
  const eventSeatsById = toLookup(eventSeatsResponse, ['event_seat_id', 'eventSeatId', 'id']);
  const seatsById = toLookup(seatsResponse, ['seat_id', 'seatId', 'id']);

  return normalizeArray(bookingsResponse)
    .map((booking) => {
      const userId = toId(getValue(booking, ['user_id', 'userId']));
      const scheduleId = toId(getValue(booking, ['schedule_id', 'scheduleId']));
      const eventSeatIds = getValue(booking, ['event_seat_ids', 'eventSeatIds'], []);
      const ticketCategoryName = getValue(booking, ['ticket_category_name', 'ticketCategoryName'], '');
      const ticketQuantity = Number(getValue(booking, ['ticket_quantity', 'ticketQuantity'], 0));
      const user = usersById[userId];
      const schedule = schedulesById[scheduleId];
      const event = eventsById[toId(getValue(schedule, ['event_id', 'eventId']))];
      const venue = venuesById[toId(getValue(schedule, ['venue_id', 'venueId']))];
      const isConcertBooking = ticketQuantity > 0;
      const seatLabels =
        ticketCategoryName && ticketQuantity > 0
          ? [`${ticketCategoryName} x${ticketQuantity}`]
          : isConcertBooking
            ? [`Concert Tickets x${ticketQuantity}`]
          : (Array.isArray(eventSeatIds) ? eventSeatIds : [])
              .map((eventSeatId) => eventSeatsById[toId(eventSeatId)])
              .map((eventSeat) => seatsById[toId(getValue(eventSeat, ['seat_id', 'seatId']))] || eventSeat)
              .map((seat) => formatSeatLabel(seat))
              .filter(Boolean);

      return {
        ...booking,
        user_name_display: getValue(user, ['user_name', 'userName', 'name'], userId ? `User #${userId}` : '-'),
        event_name_display: getValue(
          event,
          ['event_name', 'eventName', 'name'],
          isConcertBooking ? 'Concert Booking' : '-'
        ),
        venue_name_display: getValue(
          venue,
          ['venue_name', 'venueName', 'name'],
          getValue(schedule, ['venue_name', 'venueName'], '-')
        ),
        show_date_time_display: formatShowDateTime(schedule),
        seat_labels_display: seatLabels.join(', ') || '-'
      };
    })
    .sort((first, second) => {
      const bookingDateDifference =
        toTimestamp(getValue(second, ['booking_date', 'bookingDate'])) -
        toTimestamp(getValue(first, ['booking_date', 'bookingDate']));

      if (bookingDateDifference !== 0) {
        return bookingDateDifference;
      }

      return toId(getValue(second, ['booking_id', 'bookingId', 'id'])).localeCompare(
        toId(getValue(first, ['booking_id', 'bookingId', 'id'])),
        undefined,
        { numeric: true, sensitivity: 'base' }
      );
    });
};

const columns = [
  { key: 'booking_id', label: 'Booking ID', render: (row) => getValue(row, ['booking_id', 'bookingId', 'id']) },
  { key: 'user_name_display', label: 'User Name' },
  { key: 'event_name_display', label: 'Event Name' },
  { key: 'venue_name_display', label: 'Venue' },
  { key: 'show_date_time_display', label: 'Event Date & Time' },
  { key: 'seat_labels_display', label: 'Seats / Tickets' },
  {
    key: 'booking_date',
    label: 'Booking Date',
    render: (row) => formatDateTime(getValue(row, ['booking_date', 'bookingDate']))
  },
  {
    key: 'booking_status',
    label: 'Booking Status',
    render: (row) => {
      const status = normalizeBookingStatus(getValue(row, ['booking_status', 'bookingStatus'], 'CONFIRMED'));
      return <span className={getStatusClassName(status)}>{status}</span>;
    }
  }
];

const bookingStatusOptions = [
  { value: 'CONFIRMED', label: 'CONFIRMED' },
  { value: 'CANCELLED', label: 'CANCELLED' }
];

const buildFields = ({ editingItem }) => {
  const currentStatus = normalizeBookingStatus(getValue(editingItem, ['booking_status', 'bookingStatus'], 'CONFIRMED'));
  const isCancelledBooking = currentStatus === 'CANCELLED';

  return [
    {
      name: 'booking_status',
      label: 'Booking Status',
      type: 'select',
      required: true,
      toFormValue: (value) => normalizeBookingStatus(value),
      options: isCancelledBooking ? [{ value: 'CANCELLED', label: 'CANCELLED' }] : bookingStatusOptions,
      helperText: isCancelledBooking ? 'Cancelled bookings cannot be changed back to confirmed.' : undefined
    }
  ];
};

const ManageBookingsPage = () => {
  const [bookingIdQuery, setBookingIdQuery] = useState('');

  const normalizedBookingIdQuery = useMemo(() => bookingIdQuery.trim(), [bookingIdQuery]);

  const filterRows = useCallback(
    (rows = []) => {
      if (!normalizedBookingIdQuery) {
        return rows;
      }

      return rows.filter((row) =>
        toId(getValue(row, ['booking_id', 'bookingId', 'id'])).includes(normalizedBookingIdQuery)
      );
    },
    [normalizedBookingIdQuery]
  );

  const renderFilters = useCallback(
    () => (
      <div className="filter-grid single">
        <label className="field-group">
          <span className="field-label">Search Booking ID</span>
          <input
            className="field-input"
            value={bookingIdQuery}
            onChange={(event) => setBookingIdQuery(event.target.value)}
            placeholder="Enter booking ID"
            inputMode="numeric"
          />
        </label>
      </div>
    ),
    [bookingIdQuery]
  );

  return (
    <AdminCrudPage
      title="Manage Bookings"
      columns={columns}
      fields={buildFields}
      fetchAll={loadBookingsTable}
      updateItem={updateBooking}
      deleteItem={deleteBooking}
      idKeys={['booking_id', 'bookingId', 'id']}
      showCreateButton={false}
      pageSize={10}
      renderFilters={renderFilters}
      filterRows={filterRows}
      filterEmptyTitle="No bookings found"
      filterEmptyDescription={
        normalizedBookingIdQuery ? `No bookings match booking ID "${normalizedBookingIdQuery}".` : undefined
      }
    />
  );
};

export default ManageBookingsPage;
