import { useCallback, useMemo, useState } from 'react';
import AdminCrudPage from '../../components/admin/AdminCrudPage';
import { createEventSeat, deleteEventSeat, getEventSeats, updateEventSeat } from '../../api/eventSeatsApi';
import { getSchedules } from '../../api/schedulesApi';
import { getEvents } from '../../api/eventsApi';
import { getSeats } from '../../api/seatsApi';
import { formatCurrency, formatDate, formatTime } from '../../utils/format';
import { getStatusClassName } from '../../utils/status';
import { getValue, normalizeArray } from '../../utils/entity';

const toId = (value) => String(value ?? '').trim();

const toLookup = (items, keys) =>
  normalizeArray(items).reduce((acc, item) => {
    const id = toId(getValue(item, keys));
    if (id) {
      acc[id] = item;
    }
    return acc;
  }, {});

const formatShowDateTime = (schedule) => {
  const showDate = getValue(schedule, ['show_date', 'showDate']);
  const showTime = getValue(schedule, ['show_time', 'showTime']);

  if (!showDate && !showTime) {
    return '-';
  }

  return `${formatDate(showDate)} | ${formatTime(showTime)}`;
};

const formatSeatLabel = (seat) => {
  const seatRow = String(getValue(seat, ['seat_row', 'seatRow'], '')).trim();
  const seatNumber = String(getValue(seat, ['seat_number', 'seatNumber'], '')).trim();

  if (seatRow && seatNumber) {
    return `${seatRow}-${seatNumber}`;
  }

  return seatNumber || seatRow || '-';
};

const loadEventSeatsTable = async () => {
  const [eventSeatsResponse, schedulesResponse, eventsResponse, seatsResponse] = await Promise.all([
    getEventSeats(),
    getSchedules(),
    getEvents(),
    getSeats()
  ]);

  const schedulesById = toLookup(schedulesResponse, ['schedule_id', 'scheduleId', 'id']);
  const eventsById = toLookup(eventsResponse, ['event_id', 'eventId', 'id']);
  const seatsById = toLookup(seatsResponse, ['seat_id', 'seatId', 'id']);

  return normalizeArray(eventSeatsResponse).map((eventSeat) => {
    const schedule = schedulesById[toId(getValue(eventSeat, ['schedule_id', 'scheduleId']))];
    const event = eventsById[toId(getValue(schedule, ['event_id', 'eventId']))];
    const seat = seatsById[toId(getValue(eventSeat, ['seat_id', 'seatId']))];

    return {
      ...eventSeat,
      event_name_display: getValue(event, ['event_name', 'eventName', 'name'], '-'),
      show_date_time_display: formatShowDateTime(schedule),
      seat_number_display: formatSeatLabel(seat)
    };
  });
};

const columns = [
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

const fields = [
  { name: 'schedule_id', label: 'Schedule ID', type: 'number', required: true },
  { name: 'seat_id', label: 'Seat ID', type: 'number', required: true },
  { name: 'seat_price', label: 'Seat Price', type: 'number', min: 0, step: 0.01, required: true },
  {
    name: 'seat_status',
    label: 'Seat Status',
    type: 'select',
    required: true,
    options: [
      { value: 'AVAILABLE', label: 'AVAILABLE' },
      { value: 'BOOKED', label: 'BOOKED' }
    ]
  }
];

const ManageEventSeatsPage = () => {
  const [eventNameQuery, setEventNameQuery] = useState('');
  const normalizedEventNameQuery = useMemo(() => eventNameQuery.trim().toLowerCase(), [eventNameQuery]);

  const filterRows = useCallback(
    (rows = []) => {
      if (!normalizedEventNameQuery) {
        return rows;
      }

      return rows.filter((row) =>
        String(getValue(row, ['event_name_display', 'event_name', 'eventName', 'name'], ''))
          .trim()
          .toLowerCase()
          .includes(normalizedEventNameQuery)
      );
    },
    [normalizedEventNameQuery]
  );

  const renderFilters = useCallback(
    () => (
      <div className="filter-grid single">
        <label className="field-group">
          <span className="field-label">Search Event Name</span>
          <input
            className="field-input"
            value={eventNameQuery}
            onChange={(event) => setEventNameQuery(event.target.value)}
            placeholder="Enter event name"
          />
        </label>
      </div>
    ),
    [eventNameQuery]
  );

  return (
    <AdminCrudPage
      title="Manage Event Seats"
      columns={columns}
      fields={fields}
      fetchAll={loadEventSeatsTable}
      createItem={createEventSeat}
      updateItem={updateEventSeat}
      deleteItem={deleteEventSeat}
      idKeys={['event_seat_id', 'eventSeatId', 'id']}
      showCreateButton={false}
      showEditAction={false}
      renderFilters={renderFilters}
      filterRows={filterRows}
      filterEmptyTitle="No event seats found"
      filterEmptyDescription={
        normalizedEventNameQuery ? `No event seats match "${eventNameQuery.trim()}".` : undefined
      }
      pageSize={10}
    />
  );
};

export default ManageEventSeatsPage;
