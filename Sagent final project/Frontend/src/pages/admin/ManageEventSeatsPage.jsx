import { useCallback, useEffect, useMemo, useState } from 'react';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import DataTable from '../../components/common/DataTable';
import ErrorState from '../../components/common/ErrorState';
import Loader from '../../components/common/Loader';
import { useToast } from '../../components/common/ToastProvider';
import { deleteEventSeat, getEventSeats } from '../../api/eventSeatsApi';
import { getSchedules } from '../../api/schedulesApi';
import { getEvents } from '../../api/eventsApi';
import { getConcertInventoryByScheduleId, getSeats } from '../../api/seatsApi';
import { formatCurrency, formatDate, formatTime } from '../../utils/format';
import { getStatusClassName } from '../../utils/status';
import { getValue, normalizeArray } from '../../utils/entity';

const EVENT_CATEGORY_CONCERT = 'CONCERT';

const toId = (value) => String(value ?? '').trim();

const toLookup = (items, keys) =>
  normalizeArray(items).reduce((acc, item) => {
    const id = toId(getValue(item, keys));
    if (id) {
      acc[id] = item;
    }
    return acc;
  }, {});

const toPositiveCount = (value) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric > 0 ? Math.floor(numeric) : 0;
};

const normalizeCategory = (value) => String(value ?? '').trim().toUpperCase().replace(/-/g, '_').replace(/\s+/g, '_');
const normalizeSearchText = (value) => String(value ?? '').trim().toLowerCase();
const buildSearchText = (...values) => values.map((value) => normalizeSearchText(value)).filter(Boolean).join(' ');

const formatSeatLabel = (seat) => {
  const seatRow = String(getValue(seat, ['seat_row', 'seatRow'], '')).trim();
  const seatNumber = String(getValue(seat, ['seat_number', 'seatNumber'], '')).trim();

  if (seatRow && seatNumber) {
    return `${seatRow}-${seatNumber}`;
  }

  return seatNumber || seatRow || '-';
};

const getConcertInventoryTotals = (categories = []) =>
  normalizeArray(categories).reduce(
    (acc, category) => {
      const totalTickets = toPositiveCount(getValue(category, ['total_tickets', 'totalTickets'], 0));
      const soldTicketsFallback = Math.max(0, totalTickets - toPositiveCount(getValue(category, ['available_tickets', 'availableTickets'], 0)));
      const soldTickets = toPositiveCount(getValue(category, ['sold_tickets', 'soldTickets'], soldTicketsFallback));
      const availableTickets = toPositiveCount(
        getValue(category, ['available_tickets', 'availableTickets'], Math.max(0, totalTickets - soldTickets))
      );

      acc.totalTickets += totalTickets;
      acc.availableTickets += availableTickets;
      acc.soldTickets += soldTickets;
      return acc;
    },
    { totalTickets: 0, availableTickets: 0, soldTickets: 0 }
  );

const seatColumns = [
  { key: 'event_name_display', label: 'Event Name' },
  { key: 'show_date_time_display', label: 'Event Date & Time' },
  { key: 'seat_number_display', label: 'Seat Number' },
  { key: 'seat_price', label: 'Seat Price', render: (row) => formatCurrency(getValue(row, ['seat_price', 'seatPrice'], 0)) },
  {
    key: 'seat_status',
    label: 'Seat Status',
    render: (row) => {
      const status = getValue(row, ['seat_status', 'seatStatus'], 'UNKNOWN');
      return <span className={getStatusClassName(status)}>{status}</span>;
    }
  }
];

const concertColumns = [
  { key: 'concert_name_display', label: 'Concert Name' },
  { key: 'show_date_display', label: 'Date' },
  { key: 'show_time_display', label: 'Time' },
  { key: 'total_tickets_display', label: 'Total Tickets' },
  { key: 'available_tickets_display', label: 'Available' },
  { key: 'sold_tickets_display', label: 'Sold Out' }
];

const ManageEventSeatsPage = () => {
  const toast = useToast();

  const [eventSeatRows, setEventSeatRows] = useState([]);
  const [concertRows, setConcertRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [eventNameQuery, setEventNameQuery] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const [eventSeatsResponse, schedulesResponse, eventsResponse, seatsResponse] = await Promise.all([
        getEventSeats(),
        getSchedules(),
        getEvents(),
        getSeats()
      ]);

      const schedules = normalizeArray(schedulesResponse);
      const schedulesById = toLookup(schedules, ['schedule_id', 'scheduleId', 'id']);
      const eventsById = toLookup(eventsResponse, ['event_id', 'eventId', 'id']);
      const seatsById = toLookup(seatsResponse, ['seat_id', 'seatId', 'id']);

      const nextEventSeatRows = normalizeArray(eventSeatsResponse)
        .map((eventSeat) => {
          const schedule = schedulesById[toId(getValue(eventSeat, ['schedule_id', 'scheduleId']))];
          const event = eventsById[toId(getValue(schedule, ['event_id', 'eventId']))];

          if (normalizeCategory(getValue(event, ['category'])) === EVENT_CATEGORY_CONCERT) {
            return null;
          }

          const seat = seatsById[toId(getValue(eventSeat, ['seat_id', 'seatId']))];
          const eventNameDisplay = getValue(event, ['event_name', 'eventName', 'name'], '-');

          return {
            ...eventSeat,
            event_name_display: eventNameDisplay,
            show_date_time_display: `${formatDate(getValue(schedule, ['show_date', 'showDate']))} | ${formatTime(
              getValue(schedule, ['show_time', 'showTime'])
            )}`,
            seat_number_display: formatSeatLabel(seat),
            searchable_text: buildSearchText(eventNameDisplay)
          };
        })
        .filter(Boolean);

      const nextConcertRows = (
        await Promise.all(
          schedules.map(async (schedule) => {
            const event = eventsById[toId(getValue(schedule, ['event_id', 'eventId']))];

            if (normalizeCategory(getValue(event, ['category'])) !== EVENT_CATEGORY_CONCERT) {
              return null;
            }

            const scheduleId = toId(getValue(schedule, ['schedule_id', 'scheduleId', 'id']));
            const concertNameDisplay = getValue(event, ['event_name', 'eventName', 'name'], '-');
            let totalTicketsDisplay = '-';
            let availableTicketsDisplay = '-';
            let soldTicketsDisplay = '-';

            if (scheduleId) {
              try {
                const categories = await getConcertInventoryByScheduleId(scheduleId);
                const totals = getConcertInventoryTotals(categories);
                totalTicketsDisplay = String(totals.totalTickets);
                availableTicketsDisplay = String(totals.availableTickets);
                soldTicketsDisplay = String(totals.soldTickets);
              } catch {
                totalTicketsDisplay = '-';
                availableTicketsDisplay = '-';
                soldTicketsDisplay = '-';
              }
            }

            return {
              id: `concert-schedule-${scheduleId}`,
              event_name_display: concertNameDisplay,
              concert_name_display: concertNameDisplay,
              show_date_display: formatDate(getValue(schedule, ['show_date', 'showDate'])),
              show_time_display: formatTime(getValue(schedule, ['show_time', 'showTime'])),
              total_tickets_display: totalTicketsDisplay,
              available_tickets_display: availableTicketsDisplay,
              sold_tickets_display: soldTicketsDisplay,
              searchable_text: buildSearchText(concertNameDisplay, 'concert')
            };
          })
        )
      ).filter(Boolean);

      setEventSeatRows(nextEventSeatRows);
      setConcertRows(nextConcertRows);
    } catch (loadError) {
      setError(loadError.message || 'Failed to load event seats');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const normalizedEventNameQuery = useMemo(() => eventNameQuery.trim().toLowerCase(), [eventNameQuery]);

  const filteredEventSeatRows = useMemo(() => {
    if (!normalizedEventNameQuery) {
      return eventSeatRows;
    }

    return eventSeatRows.filter((row) => buildSearchText(getValue(row, ['searchable_text'])).includes(normalizedEventNameQuery));
  }, [eventSeatRows, normalizedEventNameQuery]);

  const filteredConcertRows = useMemo(() => {
    if (!normalizedEventNameQuery) {
      return concertRows;
    }

    return concertRows.filter((row) => buildSearchText(getValue(row, ['searchable_text'])).includes(normalizedEventNameQuery));
  }, [concertRows, normalizedEventNameQuery]);

  const handleDelete = useCallback(async () => {
    if (!confirmDelete) {
      return;
    }

    try {
      setDeleting(true);
      await deleteEventSeat(getValue(confirmDelete, ['event_seat_id', 'eventSeatId', 'id']));
      toast.success('Event seat deleted');
      setConfirmDelete(null);
      await loadData();
    } catch (deleteError) {
      toast.error(deleteError.message || 'Unable to delete record');
    } finally {
      setDeleting(false);
    }
  }, [confirmDelete, loadData, toast]);

  if (loading) {
    return <Loader text="Loading Manage Event Seats..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadData} />;
  }

  return (
    <section className="admin-page">
      <div className="section-head">
        <div>
          <h1>Manage Event Seats</h1>
        </div>
      </div>

      <div className="filter-grid single">
        <label className="field-group">
          <span className="field-label">Search Event or Concert Name</span>
          <input
            className="field-input"
            value={eventNameQuery}
            onChange={(event) => setEventNameQuery(event.target.value)}
            placeholder="Enter event or concert name"
          />
        </label>
      </div>

      <div className="section-head">
        <div>
          <h2>Movies & Shows</h2>
        </div>
      </div>

      <DataTable
        columns={seatColumns}
        rows={filteredEventSeatRows}
        rowKey={(row, index) => getValue(row, ['event_seat_id', 'eventSeatId', 'id']) || index}
        pageSize={10}
        emptyTitle={normalizedEventNameQuery ? 'No movie or show seats found' : 'No event seats found'}
        emptyDescription={normalizedEventNameQuery ? `No event seats match "${eventNameQuery.trim()}".` : undefined}
        actions={(row) => (
          <button type="button" className="btn btn-small btn-danger" onClick={() => setConfirmDelete(row)}>
            Delete
          </button>
        )}
      />

      <div className="section-head">
        <div>
          <h2>Concert</h2>
        </div>
      </div>

      <DataTable
        columns={concertColumns}
        rows={filteredConcertRows}
        rowKey={(row, index) => getValue(row, ['id']) || index}
        pageSize={10}
        emptyTitle={normalizedEventNameQuery ? 'No concert schedules found' : 'No concert schedules found'}
        emptyDescription={normalizedEventNameQuery ? `No concert schedules match "${eventNameQuery.trim()}".` : undefined}
      />

      <ConfirmDialog
        isOpen={Boolean(confirmDelete)}
        title="Delete Record"
        message="This will permanently remove the record. Continue?"
        confirmText="Delete"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
        loading={deleting}
      />
    </section>
  );
};

export default ManageEventSeatsPage;
