import AdminCrudPage from '../../components/admin/AdminCrudPage';
import { deleteCancellation, getCancellations, updateCancellation } from '../../api/cancellationsApi';
import { getUsers } from '../../api/usersApi';
import { getBookings } from '../../api/bookingsApi';
import { getPayments } from '../../api/paymentsApi';
import { getSchedules } from '../../api/schedulesApi';
import { getEvents } from '../../api/eventsApi';
import { formatCurrency } from '../../utils/format';
import { getStatusClassName } from '../../utils/status';
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

const normalizeBookingStatus = (value) => String(value || '').trim().toUpperCase();
const normalizePaymentStatus = (value) => String(value || '').trim().toUpperCase();

const getCancelledByDisplay = (value) => {
  const cancellationType = String(value || '').trim().toUpperCase();
  if (cancellationType === 'USER_CANCELLED') {
    return 'User';
  }
  if (cancellationType === 'ADMIN_CANCELLED') {
    return 'Admin';
  }
  return '-';
};

const getRefundStatusFallback = (payment) => {
  const paymentStatus = normalizePaymentStatus(getValue(payment, ['payment_status', 'paymentStatus']));
  if (paymentStatus === 'PENDING') {
    return 'PENDING';
  }
  return 'COMPLETED';
};

const getCancellationRowTimestamp = (row) =>
  toTimestamp(getValue(row, ['cancellation_date', 'cancellationDate'])) ||
  toTimestamp(getValue(row, ['booking_date_fallback', 'bookingDateFallback'])) ||
  toTimestamp(getValue(row, ['updated_at', 'updatedAt'])) ||
  toTimestamp(getValue(row, ['created_at', 'createdAt']));

const sortCancellationsRecentFirst = (first, second) => {
  const timestampDifference = getCancellationRowTimestamp(second) - getCancellationRowTimestamp(first);
  if (timestampDifference !== 0) {
    return timestampDifference;
  }

  return toId(getValue(second, ['cancellation_id', 'cancellationId', 'booking_id', 'bookingId', 'id'])).localeCompare(
    toId(getValue(first, ['cancellation_id', 'cancellationId', 'booking_id', 'bookingId', 'id'])),
    undefined,
    { numeric: true, sensitivity: 'base' }
  );
};

const buildCancellationRow = ({
  cancellation,
  isSynthetic = false,
  usersById,
  bookingsById,
  paymentsByBookingId,
  schedulesById,
  eventsById
}) => {
  const userId = toId(getValue(cancellation, ['user_id', 'userId']));
  const bookingId = toId(getValue(cancellation, ['booking_id', 'bookingId']));
  const booking = bookingsById[bookingId];
  const payment = paymentsByBookingId[bookingId];
  const scheduleId = toId(getValue(booking, ['schedule_id', 'scheduleId']));
  const schedule = schedulesById[scheduleId];
  const eventId = toId(getValue(schedule, ['event_id', 'eventId']));
  const user = usersById[userId];
  const event = eventsById[eventId];

  return {
    ...cancellation,
    user_name_display: getValue(user, ['user_name', 'userName', 'name'], '-'),
    event_name_display: getValue(event, ['event_name', 'eventName', 'name'], '-'),
    cancelled_by_display: getCancelledByDisplay(
      getValue(cancellation, ['cancellation_type', 'cancellationType'], 'ADMIN_CANCELLED')
    ),
    refund_amount: getValue(cancellation, ['refund_amount', 'refundAmount'], getValue(payment, ['amount'], 0)),
    refund_status: getValue(cancellation, ['refund_status', 'refundStatus'], getRefundStatusFallback(payment)),
    booking_date_fallback: getValue(booking, ['booking_date', 'bookingDate']),
    isSynthetic
  };
};

const loadCancellationsTable = async () => {
  const [cancellationsResponse, usersResponse, bookingsResponse, paymentsResponse, schedulesResponse, eventsResponse] =
    await Promise.all([
      getCancellations(),
      getUsers(),
      getBookings(),
      getPayments(),
      getSchedules(),
      getEvents()
    ]);

  const cancellations = normalizeArray(cancellationsResponse);
  const bookings = normalizeArray(bookingsResponse);
  const usersById = toLookup(usersResponse, ['user_id', 'userId', 'id']);
  const bookingsById = toLookup(bookings, ['booking_id', 'bookingId', 'id']);
  const paymentsByBookingId = toLookup(paymentsResponse, ['booking_id', 'bookingId']);
  const schedulesById = toLookup(schedulesResponse, ['schedule_id', 'scheduleId', 'id']);
  const eventsById = toLookup(eventsResponse, ['event_id', 'eventId', 'id']);
  const cancellationsByBookingId = toLookup(cancellations, ['booking_id', 'bookingId']);

  const persistedRows = cancellations.map((cancellation) =>
    buildCancellationRow({
      cancellation,
      usersById,
      bookingsById,
      paymentsByBookingId,
      schedulesById,
      eventsById
    })
  );

  const syntheticRows = bookings
    .filter((booking) => normalizeBookingStatus(getValue(booking, ['booking_status', 'bookingStatus'])) === 'CANCELLED')
    .filter((booking) => {
      const bookingId = toId(getValue(booking, ['booking_id', 'bookingId', 'id']));
      return bookingId && !cancellationsByBookingId[bookingId];
    })
    .map((booking) => {
      const bookingId = toId(getValue(booking, ['booking_id', 'bookingId', 'id']));
      const scheduleId = toId(getValue(booking, ['schedule_id', 'scheduleId']));
      const schedule = schedulesById[scheduleId];
      const scheduleStatus = String(getValue(schedule, ['schedule_status', 'scheduleStatus'], '')).toUpperCase();
      const payment = paymentsByBookingId[bookingId];

      return buildCancellationRow({
        cancellation: {
          id: `synthetic-cancellation-${bookingId}`,
          booking_id: getValue(booking, ['booking_id', 'bookingId', 'id']),
          user_id: getValue(booking, ['user_id', 'userId']),
          cancellation_reason:
            scheduleStatus === 'CANCELLED' ? 'Schedule cancelled by admin' : 'Booking cancelled by admin',
          cancellation_type: 'ADMIN_CANCELLED',
          refund_amount: getValue(payment, ['amount'], 0),
          refund_status: getRefundStatusFallback(payment)
        },
        isSynthetic: true,
        usersById,
        bookingsById,
        paymentsByBookingId,
        schedulesById,
        eventsById
      });
    });

  return [...persistedRows, ...syntheticRows].sort(sortCancellationsRecentFirst);
};

const columns = [
  {
    key: 'cancellation_id',
    label: 'Cancellation ID',
    render: (row) => getValue(row, ['cancellation_id', 'cancellationId'], '-')
  },
  {
    key: 'booking_id',
    label: 'Booking ID',
    render: (row) => getValue(row, ['booking_id', 'bookingId'])
  },
  { key: 'user_name_display', label: 'User Name' },
  { key: 'event_name_display', label: 'Event Name' },
  { key: 'cancelled_by_display', label: 'Canceled By' },
  {
    key: 'refund_amount',
    label: 'Refund Amount',
    render: (row) => formatCurrency(getValue(row, ['refund_amount', 'refundAmount'], 0))
  },
  {
    key: 'refund_status',
    label: 'Refund Status',
    render: (row) => {
      const status = getValue(row, ['refund_status', 'refundStatus'], 'UNKNOWN');
      return <span className={getStatusClassName(status)}>{status}</span>;
    }
  }
];

const fields = [
  {
    name: 'refund_status',
    label: 'Refund Status',
    type: 'select',
    required: true,
    options: [
      { value: 'PENDING', label: 'PENDING' },
      { value: 'COMPLETED', label: 'COMPLETED' }
    ]
  }
];

const renderActions = (row, { openEdit, openDelete, showEditAction, showDeleteAction }) => {
  if (row?.isSynthetic) {
    return null;
  }

  return (
    <>
      {showEditAction ? (
        <button type="button" className="btn btn-small btn-outline" onClick={openEdit}>
          Edit
        </button>
      ) : null}
      {showDeleteAction ? (
        <button type="button" className="btn btn-small btn-danger" onClick={openDelete}>
          Delete
        </button>
      ) : null}
    </>
  );
};

const ManageCancellationsPage = () => (
  <AdminCrudPage
    title="Manage Cancellations"
    columns={columns}
    fields={fields}
    fetchAll={loadCancellationsTable}
    updateItem={updateCancellation}
    deleteItem={deleteCancellation}
    idKeys={['cancellation_id', 'cancellationId', 'id']}
    showCreateButton={false}
    renderActions={renderActions}
    pageSize={10}
  />
);

export default ManageCancellationsPage;
