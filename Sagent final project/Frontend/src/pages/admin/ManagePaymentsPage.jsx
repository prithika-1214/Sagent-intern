import { useEffect, useMemo, useState } from 'react';
import StatCard from '../../components/common/StatCard';
import DataTable from '../../components/common/DataTable';
import Loader from '../../components/common/Loader';
import ErrorState from '../../components/common/ErrorState';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { deletePayment, getPayments } from '../../api/paymentsApi';
import { getBookings } from '../../api/bookingsApi';
import { getCancellations } from '../../api/cancellationsApi';
import { getEventSeats } from '../../api/eventSeatsApi';
import { getSchedules } from '../../api/schedulesApi';
import { formatCurrency } from '../../utils/format';
import { getValue, normalizeArray } from '../../utils/entity';
import { buildPricingBreakdown } from '../../utils/pricing';
import { getStatusClassName } from '../../utils/status';
import { useToast } from '../../components/common/ToastProvider';

const SUCCESS_PAYMENT_STATUS = 'SUCCESS';

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

const toMoney = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return 0;
  }

  return Math.round(Math.max(0, parsed) * 100) / 100;
};

const toQuantity = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 0;
  }

  return Math.floor(parsed);
};

const isStatusMatch = (value, expected) => String(value || '').trim().toUpperCase() === expected;

const getCancelledByLabel = ({ schedule, booking, cancellation }) => {
  const scheduleStatus = String(getValue(schedule, ['schedule_status', 'scheduleStatus'], '')).toUpperCase();
  if (scheduleStatus === 'CANCELLED') {
    return 'Schedule Cancelled';
  }

  const cancellationType = String(getValue(cancellation, ['cancellation_type', 'cancellationType'], '')).toUpperCase();
  if (cancellationType === 'USER_CANCELLED') {
    return 'User';
  }
  if (cancellationType === 'ADMIN_CANCELLED') {
    return 'Admin';
  }

  const bookingStatus = String(getValue(booking, ['booking_status', 'bookingStatus'], '')).toUpperCase();
  if (bookingStatus === 'CANCELLED') {
    // Treat cancelled bookings without a cancellation row as admin-cancelled.
    return 'Admin';
  }

  return '-';
};

const getStoredAdminRevenue = (payment) =>
  toMoney(getValue(payment, ['convenience_fee', 'convenienceFee'], 0)) +
  toMoney(getValue(payment, ['gst_amount', 'gstAmount'], 0));

const calculateFallbackPaymentAmountForBooking = ({ booking, eventSeatsById }) => {
  const ticketQuantity = toQuantity(getValue(booking, ['ticket_quantity', 'ticketQuantity'], 0));

  if (ticketQuantity > 0) {
    const unitPrice = toMoney(getValue(booking, ['ticket_unit_price', 'ticketUnitPrice'], 0));
    const pricing = buildPricingBreakdown({
      subtotal: unitPrice * ticketQuantity,
      quantity: ticketQuantity
    });

    return toMoney(pricing.total);
  }

  const eventSeatIds = getValue(booking, ['event_seat_ids', 'eventSeatIds'], []);
  if (Array.isArray(eventSeatIds) && eventSeatIds.length) {
    const subtotal = eventSeatIds.reduce((sum, eventSeatId) => {
      const eventSeat = eventSeatsById[toId(eventSeatId)];
      return sum + toMoney(getValue(eventSeat, ['seat_price', 'seatPrice'], 0));
    }, 0);

    const pricing = buildPricingBreakdown({
      subtotal,
      quantity: eventSeatIds.length
    });

    return toMoney(pricing.total);
  }

  return 0;
};

const calculateAdminRevenueForBooking = ({ booking, payment, eventSeatsById }) => {
  const ticketQuantity = toQuantity(getValue(booking, ['ticket_quantity', 'ticketQuantity'], 0));

  if (ticketQuantity > 0) {
    const unitPrice = toMoney(getValue(booking, ['ticket_unit_price', 'ticketUnitPrice'], 0));
    const pricing = buildPricingBreakdown({
      subtotal: unitPrice * ticketQuantity,
      quantity: ticketQuantity
    });

    return toMoney(pricing.convenienceFee + pricing.gstAmount);
  }

  const eventSeatIds = getValue(booking, ['event_seat_ids', 'eventSeatIds'], []);
  if (Array.isArray(eventSeatIds) && eventSeatIds.length) {
    const subtotal = eventSeatIds.reduce((sum, eventSeatId) => {
      const eventSeat = eventSeatsById[toId(eventSeatId)];
      return sum + toMoney(getValue(eventSeat, ['seat_price', 'seatPrice'], 0));
    }, 0);

    const pricing = buildPricingBreakdown({
      subtotal,
      quantity: eventSeatIds.length
    });

    return toMoney(pricing.convenienceFee + pricing.gstAmount);
  }

  return getStoredAdminRevenue(payment);
};

const getSyntheticPaymentStatus = (cancellation) => {
  const refundStatus = String(getValue(cancellation, ['refund_status', 'refundStatus'], '')).trim().toUpperCase();
  if (!refundStatus) {
    return 'REFUNDED';
  }

  return refundStatus === 'COMPLETED' ? 'REFUNDED' : 'PENDING';
};

const getPaymentRowTimestamp = (row) =>
  toTimestamp(getValue(row, ['payment_date', 'paymentDate'])) ||
  toTimestamp(getValue(row, ['cancellation_date_fallback', 'cancellationDateFallback'])) ||
  toTimestamp(getValue(row, ['booking_date_fallback', 'bookingDateFallback'])) ||
  toTimestamp(getValue(row, ['updated_at', 'updatedAt'])) ||
  toTimestamp(getValue(row, ['created_at', 'createdAt']));

const sortPaymentsRecentFirst = (first, second) => {
  const timestampDifference = getPaymentRowTimestamp(second) - getPaymentRowTimestamp(first);
  if (timestampDifference !== 0) {
    return timestampDifference;
  }

  return toId(getValue(second, ['payment_id', 'paymentId', 'booking_id', 'bookingId', 'id'])).localeCompare(
    toId(getValue(first, ['payment_id', 'paymentId', 'booking_id', 'bookingId', 'id'])),
    undefined,
    { numeric: true, sensitivity: 'base' }
  );
};

const columns = [
  {
    key: 'payment_id',
    label: 'Payment ID',
    render: (row) => getValue(row, ['payment_id', 'paymentId', 'id'])
  },
  {
    key: 'booking_id',
    label: 'Booking ID',
    render: (row) => getValue(row, ['booking_id', 'bookingId'])
  },
  {
    key: 'amount',
    label: 'Amount Paid',
    render: (row) => formatCurrency(getValue(row, ['amount', 'amount_paid', 'amountPaid'], 0))
  },
  {
    key: 'payment_status',
    label: 'Status',
    render: (row) => {
      const status = getValue(row, ['payment_status', 'paymentStatus', 'status'], 'UNKNOWN');
      return <span className={getStatusClassName(status)}>{status}</span>;
    }
  },
  { key: 'cancelled_by_display', label: 'Canceled By' },
  {
    key: 'transaction_id',
    label: 'Transaction ID',
    render: (row) => getValue(row, ['transaction_id', 'transactionId'], '-')
  }
];

const ManagePaymentsPage = () => {
  const toast = useToast();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [bookingIdQuery, setBookingIdQuery] = useState('');

  const normalizedBookingIdQuery = useMemo(() => bookingIdQuery.trim().toLowerCase(), [bookingIdQuery]);

  const loadRows = async () => {
    try {
      setLoading(true);
      setError('');

      const [paymentsResponse, bookingsResponse, cancellationsResponse, schedulesResponse, eventSeatsResponse] = await Promise.all([
        getPayments(),
        getBookings(),
        getCancellations(),
        getSchedules(),
        getEventSeats()
      ]);

      const bookingsById = toLookup(bookingsResponse, ['booking_id', 'bookingId', 'id']);
      const paymentsByBookingId = toLookup(paymentsResponse, ['booking_id', 'bookingId']);
      const cancellationsByBookingId = toLookup(cancellationsResponse, ['booking_id', 'bookingId']);
      const schedulesById = toLookup(schedulesResponse, ['schedule_id', 'scheduleId', 'id']);
      const eventSeatsById = toLookup(eventSeatsResponse, ['event_seat_id', 'eventSeatId', 'id']);

      const paymentRows = normalizeArray(paymentsResponse).map((payment) => {
        const bookingId = toId(getValue(payment, ['booking_id', 'bookingId']));
        const booking = bookingsById[bookingId];
        const scheduleId = toId(getValue(booking, ['schedule_id', 'scheduleId']));
        const schedule = schedulesById[scheduleId];
        const cancellation = cancellationsByBookingId[bookingId];
        const adminRevenueAmount = calculateAdminRevenueForBooking({ booking, payment, eventSeatsById });

        return {
          ...payment,
          cancelled_by_display: getCancelledByLabel({ schedule, booking, cancellation }),
          admin_revenue_amount: adminRevenueAmount,
          cancellation_date_fallback: getValue(cancellation, ['cancellation_date', 'cancellationDate']),
          booking_date_fallback: getValue(booking, ['booking_date', 'bookingDate'])
        };
      });

      const syntheticCancelledPaymentRows = Object.values(bookingsById)
        .filter((booking) => String(getValue(booking, ['booking_status', 'bookingStatus'], '')).trim().toUpperCase() === 'CANCELLED')
        .filter((booking) => {
          const bookingId = toId(getValue(booking, ['booking_id', 'bookingId', 'id']));
          return bookingId && !paymentsByBookingId[bookingId];
        })
        .map((booking) => {
          const bookingId = toId(getValue(booking, ['booking_id', 'bookingId', 'id']));
          const scheduleId = toId(getValue(booking, ['schedule_id', 'scheduleId']));
          const schedule = schedulesById[scheduleId];
          const cancellation = cancellationsByBookingId[bookingId];
          const fallbackAmount = calculateFallbackPaymentAmountForBooking({ booking, eventSeatsById });

          return {
            id: `synthetic-payment-${bookingId}`,
            payment_id: '-',
            booking_id: getValue(booking, ['booking_id', 'bookingId', 'id']),
            amount: getValue(cancellation, ['refund_amount', 'refundAmount'], fallbackAmount),
            payment_status: getSyntheticPaymentStatus(cancellation),
            cancelled_by_display: getCancelledByLabel({ schedule, booking, cancellation }),
            transaction_id: getValue(cancellation, ['cancellation_id', 'cancellationId'])
              ? `AUTO_CANCELLED_${bookingId}`
              : '-',
            admin_revenue_amount: calculateAdminRevenueForBooking({ booking, payment: null, eventSeatsById }),
            cancellation_date_fallback: getValue(cancellation, ['cancellation_date', 'cancellationDate']),
            booking_date_fallback: getValue(booking, ['booking_date', 'bookingDate']),
            isSynthetic: true
          };
        });

      setRows([...paymentRows, ...syntheticCancelledPaymentRows].sort(sortPaymentsRecentFirst));
    } catch (err) {
      setError(err.message || 'Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const summary = useMemo(
    () =>
      rows.reduce(
        (acc, row) => {
          if (!isStatusMatch(getValue(row, ['payment_status', 'paymentStatus']), SUCCESS_PAYMENT_STATUS)) {
            return acc;
          }

          return {
            totalRevenue: toMoney(acc.totalRevenue + toMoney(getValue(row, ['amount', 'amount_paid', 'amountPaid'], 0))),
            adminRevenue: toMoney(
              acc.adminRevenue + toMoney(getValue(row, ['admin_revenue_amount', 'adminRevenueAmount'], 0))
            )
          };
        },
        { totalRevenue: 0, adminRevenue: 0 }
      ),
    [rows]
  );

  const filteredRows = useMemo(() => {
    if (!normalizedBookingIdQuery) {
      return rows;
    }

    return rows.filter((row) =>
      String(getValue(row, ['booking_id', 'bookingId'], '')).trim().toLowerCase().includes(normalizedBookingIdQuery)
    );
  }, [normalizedBookingIdQuery, rows]);

  const isFilterEmptyState = rows.length > 0 && filteredRows.length === 0;

  const handleDelete = async () => {
    if (!confirmDelete) {
      return;
    }

    try {
      setDeleting(true);
      await deletePayment(getValue(confirmDelete, ['payment_id', 'paymentId', 'id']));
      toast.success('Payment deleted');
      setConfirmDelete(null);
      await loadRows();
    } catch (err) {
      toast.error(err.message || 'Unable to delete payment');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return <Loader text="Loading payments..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadRows} />;
  }

  return (
    <section className="admin-page">
      <div className="section-head">
        <div>
          <h1>Manage Payments</h1>
        </div>
      </div>

      <div className="payments-summary-grid">
        <StatCard title="Total Revenue Collected" value={formatCurrency(summary.totalRevenue)} color="teal" />
        <StatCard title="Admin Revenue" value={formatCurrency(summary.adminRevenue)} color="orange" />
      </div>

      <div className="filter-grid single">
        <label className="field-group">
          <span className="field-label">Search Booking ID</span>
          <input
            className="field-input"
            value={bookingIdQuery}
            onChange={(event) => setBookingIdQuery(event.target.value)}
            placeholder="Enter booking id"
          />
        </label>
      </div>

      <DataTable
        columns={columns}
        rows={filteredRows}
        rowKey={(row, index) => `${getValue(row, ['payment_id', 'paymentId', 'id'], 'payment')}-${index}`}
        pageSize={10}
        emptyTitle={isFilterEmptyState ? 'No payments found' : undefined}
        emptyDescription={
          isFilterEmptyState && normalizedBookingIdQuery
            ? `No payments match booking ID "${bookingIdQuery.trim()}".`
            : undefined
        }
        actions={(row) =>
          row?.isSynthetic ? null : (
            <button type="button" className="btn btn-small btn-danger" onClick={() => setConfirmDelete(row)}>
              Delete
            </button>
          )
        }
      />

      <ConfirmDialog
        isOpen={Boolean(confirmDelete)}
        title="Delete Payment"
        message="This will permanently remove the payment record. Continue?"
        confirmText="Delete"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
        loading={deleting}
      />
    </section>
  );
};

export default ManagePaymentsPage;
