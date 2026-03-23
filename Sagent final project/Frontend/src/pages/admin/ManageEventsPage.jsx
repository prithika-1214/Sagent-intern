import { useCallback, useMemo, useState } from 'react';
import AdminCrudPage from '../../components/admin/AdminCrudPage';
import { createEvent, deleteEvent, getEvents, updateEvent } from '../../api/eventsApi';
import { getStatusClassName } from '../../utils/status';
import { getValue } from '../../utils/entity';
import { formatDuration } from '../../utils/format';

const limitSynopsisWords = (value) =>
  String(value || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 4)
    .join(' ');

const withShortSynopsis = (payload = {}) => ({
  ...payload,
  synopsis: limitSynopsisWords(getValue(payload, ['synopsis']))
});

const LANGUAGE_OPTIONS = [
  { value: 'Tamil', label: 'Tamil' },
  { value: 'English', label: 'English' },
  { value: 'Telugu', label: 'Telugu' },
  { value: 'Malayalam', label: 'Malayalam' },
  { value: 'Hindi', label: 'Hindi' }
];

const CATEGORY_OPTIONS = [
  { value: 'MOVIE', label: 'MOVIE' },
  { value: 'CONCERT', label: 'CONCERT' },
  { value: 'STANDUP_SHOW', label: 'STANDUP_SHOW' }
];

const normalizeEventStatus = (value) => {
  const normalizedValue = String(value || '').trim().toUpperCase();
  if (normalizedValue === 'OPEN') {
    return 'ACTIVE';
  }

  return normalizedValue || 'ACTIVE';
};

const normalizeEventName = (value) => String(value || '').trim().toLowerCase();

const toEventPayload = (payload = {}) => {
  const durationValue = Number(getValue(payload, ['duration']));

  return {
    eventName: getValue(payload, ['event_name', 'eventName']),
    genre: getValue(payload, ['genre']),
    synopsis: limitSynopsisWords(getValue(payload, ['synopsis'])),
    duration: Number.isFinite(durationValue) ? durationValue : getValue(payload, ['duration']),
    language: getValue(payload, ['language']),
    category: getValue(payload, ['category']),
    eventStatus: normalizeEventStatus(getValue(payload, ['event_status', 'eventStatus'])),
    imageUrl: getValue(payload, ['image_url', 'imageUrl'])
  };
};

const columns = [
  { key: 'event_id', label: 'Event ID', render: (row) => getValue(row, ['event_id', 'id']) },
  { key: 'event_name', label: 'Event Name' },
  { key: 'genre', label: 'Genre' },
  { key: 'language', label: 'Language' },
  { key: 'category', label: 'Category' },
  { key: 'duration', label: 'Duration', render: (row) => formatDuration(getValue(row, ['duration'])) },
  {
    key: 'event_status',
    label: 'Status',
    render: (row) => {
      const status = normalizeEventStatus(getValue(row, ['event_status'], 'UNKNOWN'));
      return <span className={getStatusClassName(status)}>{status}</span>;
    }
  }
];

const fields = [
  { name: 'event_name', label: 'Event Name', required: true },
  { name: 'genre', label: 'Genre', required: true },
  { name: 'synopsis', label: 'Synopsis (3-4 words)', type: 'textarea', required: true },
  { name: 'duration', label: 'Duration (Hours)', type: 'number', required: true, min: 0.25, step: 0.25, placeholder: '2.5' },
  {
    name: 'image_url',
    label: 'Event Poster',
    type: 'file',
    accept: 'image/png,image/jpeg,image/webp',
    helperText: 'Upload a poster image for customers. JPG, PNG, or WEBP recommended.'
  },
  {
    name: 'language',
    label: 'Language',
    type: 'select',
    required: true,
    options: LANGUAGE_OPTIONS,
    placeholder: 'Select language'
  },
  {
    name: 'category',
    label: 'Category',
    type: 'select',
    required: true,
    options: CATEGORY_OPTIONS,
    placeholder: 'Select category'
  },
  {
    name: 'event_status',
    label: 'Event Status',
    type: 'select',
    required: true,
    defaultValue: 'ACTIVE',
    toFormValue: (value) => normalizeEventStatus(value),
    options: [
      { value: 'ACTIVE', label: 'ACTIVE' },
      { value: 'INACTIVE', label: 'INACTIVE' }
    ]
  }
];

const ManageEventsPage = () => {
  const [eventNameQuery, setEventNameQuery] = useState('');
  const normalizedEventNameQuery = useMemo(() => eventNameQuery.trim().toLowerCase(), [eventNameQuery]);

  const validateUniqueEventName = useCallback(async (payload, currentEventId = '') => {
    const requestedEventName = normalizeEventName(getValue(payload, ['event_name', 'eventName']));
    if (!requestedEventName) {
      return;
    }

    const existingEvents = await getEvents();
    const normalizedCurrentEventId = String(currentEventId || '').trim();
    const duplicateExists = existingEvents.some((event) => {
      const eventId = String(getValue(event, ['event_id', 'eventId', 'id']) || '').trim();
      const existingEventName = normalizeEventName(getValue(event, ['event_name', 'eventName', 'name']));
      return eventId !== normalizedCurrentEventId && existingEventName === requestedEventName;
    });

    if (duplicateExists) {
      throw new Error('An event with this name already exists');
    }
  }, []);

  const createEventWithShortSynopsis = useCallback(
    async (payload) => {
      const normalizedPayload = toEventPayload(withShortSynopsis(payload));
      await validateUniqueEventName(normalizedPayload);
      return createEvent(normalizedPayload);
    },
    [validateUniqueEventName]
  );

  const updateEventWithShortSynopsis = useCallback(
    async (id, payload) => {
      const normalizedPayload = toEventPayload(withShortSynopsis(payload));
      await validateUniqueEventName(normalizedPayload, id);
      return updateEvent(id, normalizedPayload);
    },
    [validateUniqueEventName]
  );

  const filterRows = useCallback(
    (rows = []) => {
      if (!normalizedEventNameQuery) {
        return rows;
      }

      return rows.filter((row) =>
        String(getValue(row, ['event_name', 'eventName', 'name'], '')).trim().toLowerCase().includes(normalizedEventNameQuery)
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
      title="Manage Events"
      columns={columns}
      fields={fields}
      fetchAll={getEvents}
      createItem={createEventWithShortSynopsis}
      updateItem={updateEventWithShortSynopsis}
      deleteItem={deleteEvent}
      idKeys={['event_id', 'id']}
      renderFilters={renderFilters}
      filterRows={filterRows}
      filterEmptyTitle="No events found"
      filterEmptyDescription={
        normalizedEventNameQuery ? `No events match "${eventNameQuery.trim()}".` : undefined
      }
      pageSize={10}
    />
  );
};

export default ManageEventsPage;
