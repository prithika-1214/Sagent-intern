import { useEffect, useMemo, useState } from 'react';
import Loader from '../../components/common/Loader';
import ErrorState from '../../components/common/ErrorState';
import EmptyState from '../../components/common/EmptyState';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import AdminEntityForm from '../../components/admin/AdminEntityForm';
import { createSchedule, deleteSchedule, getSchedules, updateSchedule } from '../../api/schedulesApi';
import { getEvents } from '../../api/eventsApi';
import { getVenues } from '../../api/venuesApi';
import { getBookings } from '../../api/bookingsApi';
import { formatDate, formatTime } from '../../utils/format';
import { getStatusClassName } from '../../utils/status';
import { getEntityId, getValue, normalizeArray } from '../../utils/entity';
import { useToast } from '../../components/common/ToastProvider';

const DEFAULT_AUDI_NAME = 'Audi 1';
const CONCERT_AUDI_NAME = 'Open Ground';
const DEFAULT_SHOW_TIME = '09:00';
const EVENT_CATEGORY_MOVIE = 'MOVIE';
const EVENT_CATEGORY_CONCERT = 'CONCERT';
const EVENT_CATEGORY_STANDUP_SHOW = 'STANDUP_SHOW';
const VENUE_TYPE_MOVIE_VENUE = 'MOVIE_VENUE';
const VENUE_TYPE_CONCERT_VENUE = 'CONCERT_VENUE';
const VENUE_TYPE_HALL_VENUE = 'HALL_VENUE';

const normalizeText = (value) => String(value ?? '').trim();
const normalizeNumber = (value) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : NaN;
};
const getTodayDateInputValue = () => {
  const now = new Date();
  const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 10);
};
const parseDateTimeValue = (showDate, showTime) => {
  const dateValue = normalizeText(showDate);
  const timeValue = normalizeText(showTime);
  if (!dateValue || !timeValue) {
    return Number.MAX_SAFE_INTEGER;
  }

  const parsed = new Date(`${dateValue}T${timeValue}`);
  return Number.isNaN(parsed.getTime()) ? Number.MAX_SAFE_INTEGER : parsed.getTime();
};
const normalizeEventCategory = (value) => {
  const normalized = normalizeText(value).toUpperCase().replace(/-/g, '_').replace(/\s+/g, '_');
  if (normalized === 'SHOW' || normalized === 'STANDUP') {
    return EVENT_CATEGORY_STANDUP_SHOW;
  }
  return normalized;
};
const normalizeVenueType = (value) => normalizeText(value).toUpperCase().replace(/-/g, '_').replace(/\s+/g, '_');
const requiredVenueTypeForEventCategory = (eventCategory) => {
  if (eventCategory === EVENT_CATEGORY_CONCERT) {
    return VENUE_TYPE_CONCERT_VENUE;
  }
  if (eventCategory === EVENT_CATEGORY_STANDUP_SHOW) {
    return VENUE_TYPE_HALL_VENUE;
  }
  return VENUE_TYPE_MOVIE_VENUE;
};
const isConcertEventCategory = (eventCategory) => normalizeEventCategory(eventCategory) === EVENT_CATEGORY_CONCERT;
const getAudiFieldDefaultValue = (eventCategory) =>
  isConcertEventCategory(eventCategory) ? CONCERT_AUDI_NAME : DEFAULT_AUDI_NAME;
const getSlotAreaFieldLabel = (eventCategory) =>
  isConcertEventCategory(eventCategory) ? 'Open Ground / Area Name' : 'Audi / Screen Name';
const getSlotAreaFieldHelperText = (eventCategory) =>
  isConcertEventCategory(eventCategory)
    ? 'Use the open ground, lawn, or area name for this concert slot.'
    : 'Use the screen or audi name for this slot.';
const resolveAudiName = (value, eventCategory) => normalizeText(value) || getAudiFieldDefaultValue(eventCategory);

const scheduleStatusOptions = [
  { value: 'OPEN', label: 'OPEN' },
  { value: 'CLOSED', label: 'CLOSED' },
  { value: 'CANCELLED', label: 'CANCELLED' }
];

const normalizeScheduleRow = (schedule, eventCategory) => ({
  ...schedule,
  schedule_id: getValue(schedule, ['schedule_id', 'scheduleId', 'id']),
  event_id: getValue(schedule, ['event_id', 'eventId']),
  venue_id: getValue(schedule, ['venue_id', 'venueId']),
  audi_id: getValue(schedule, ['audi_id', 'audiId']),
  audi_name: resolveAudiName(getValue(schedule, ['audi_name', 'audiName']), eventCategory),
  show_date: getValue(schedule, ['show_date', 'showDate']),
  show_time: getValue(schedule, ['show_time', 'showTime']),
  end_time: getValue(schedule, ['end_time', 'endTime']),
  available_seats: getValue(schedule, ['available_seats', 'availableSeats']),
  schedule_status: getValue(schedule, ['schedule_status', 'scheduleStatus'])
});

const getInitialValues = (fields) =>
  fields.reduce((acc, field) => {
    acc[field.name] = field.defaultValue ?? '';
    return acc;
  }, {});

const validateForm = (fields, values) => {
  const errors = {};

  fields.forEach((field) => {
    if (!field.required) {
      return;
    }

    const value = values[field.name];
    if (value === undefined || value === null || value === '') {
      errors[field.name] = `${field.label} is required`;
    }
  });

  return errors;
};

const toFormFieldValue = (fieldName, value) => {
  if (value === undefined || value === null) {
    return '';
  }
  if (fieldName === 'event_id' || fieldName === 'venue_id') {
    return String(value);
  }
  return value;
};
const resolveScheduleId = (item) => getValue(item, ['schedule_id', 'id']) || getEntityId(item);
const getScheduleUpdatePayload = (currentItem, values = {}, preserveLockedFields = false, eventCategory = '') => {
  const immutableSource = preserveLockedFields && currentItem ? currentItem : values;
  const payload = {
    event_id: getValue(immutableSource, ['event_id', 'eventId']),
    venue_id: getValue(immutableSource, ['venue_id', 'venueId']),
    audi_name: getValue(immutableSource, ['audi_name', 'audiName']),
    show_date: getValue(values, ['show_date']),
    show_time: getValue(values, ['show_time']),
    schedule_status: getValue(values, ['schedule_status'])
  };
  const audiId = getValue(immutableSource, ['audi_id', 'audiId']);

  if (!isConcertEventCategory(eventCategory) && audiId !== undefined && audiId !== null && audiId !== '') {
    payload.audi_id = audiId;
  }

  return payload;
};

const ManageSchedulesPage = () => {
  const toast = useToast();
  const todayDateInputValue = useMemo(() => getTodayDateInputValue(), []);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [eventNameQuery, setEventNameQuery] = useState('');
  const [eventOptions, setEventOptions] = useState([]);
  const [venueOptions, setVenueOptions] = useState([]);
  const [eventCategoryMap, setEventCategoryMap] = useState({});
  const [venueTypeMap, setVenueTypeMap] = useState({});
  const [eventNameMap, setEventNameMap] = useState({});
  const [venueNameMap, setVenueNameMap] = useState({});
  const [lockedScheduleIds, setLockedScheduleIds] = useState(new Set());
  const [showModal, setShowModal] = useState(false);
  const [formValues, setFormValues] = useState({});
  const [formErrors, setFormErrors] = useState({});
  const [editingItem, setEditingItem] = useState(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const editingScheduleId = editingItem ? normalizeText(resolveScheduleId(editingItem)) : '';
  const editingItemHasBookings = Boolean(editingScheduleId && lockedScheduleIds.has(editingScheduleId));
  const selectedEventCategory = normalizeEventCategory(eventCategoryMap[normalizeText(formValues.event_id)]);
  const filteredVenueOptions = useMemo(() => {
    if (!selectedEventCategory) {
      return venueOptions;
    }

    const requiredVenueType = requiredVenueTypeForEventCategory(selectedEventCategory);
    return venueOptions.filter(
      (option) => normalizeVenueType(venueTypeMap[normalizeText(option.value)]) === requiredVenueType
    );
  }, [selectedEventCategory, venueOptions, venueTypeMap]);

  const fields = useMemo(
    () => [
      {
        name: 'event_id',
        label: 'Event',
        type: eventOptions.length ? 'select' : 'number',
        required: true,
        options: eventOptions,
        placeholder: 'Select event',
        disabled: editingItemHasBookings,
        helperText: editingItemHasBookings ? 'This cannot be changed after bookings exist for this schedule.' : undefined
      },
      {
        name: 'venue_id',
        label: 'Venue',
        type: filteredVenueOptions.length ? 'select' : 'number',
        required: true,
        options: filteredVenueOptions,
        placeholder: selectedEventCategory ? 'Select compatible venue' : 'Select venue',
        disabled: editingItemHasBookings,
        helperText: editingItemHasBookings ? 'This cannot be changed after bookings exist for this schedule.' : undefined
      },
      {
        name: 'audi_name',
        label: getSlotAreaFieldLabel(selectedEventCategory),
        type: 'text',
        required: true,
        defaultValue: getAudiFieldDefaultValue(selectedEventCategory),
        placeholder: getAudiFieldDefaultValue(selectedEventCategory),
        disabled: editingItemHasBookings,
        helperText: editingItemHasBookings
          ? 'This area cannot be changed after bookings exist for this schedule.'
          : getSlotAreaFieldHelperText(selectedEventCategory)
      },
      { name: 'show_date', label: 'Show Date', type: 'date', required: true, min: todayDateInputValue },
      { name: 'show_time', label: 'Show Time', type: 'time', required: true, defaultValue: DEFAULT_SHOW_TIME },
      {
        name: 'schedule_status',
        label: 'Schedule Status',
        type: 'select',
        required: true,
        defaultValue: 'OPEN',
        options: scheduleStatusOptions
      }
    ],
    [editingItemHasBookings, eventOptions, filteredVenueOptions, selectedEventCategory, todayDateInputValue]
  );
  const initialValues = useMemo(() => getInitialValues(fields), [fields]);

  useEffect(() => {
    setFormValues((current) => (Object.keys(current).length ? current : initialValues));
  }, [initialValues]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      const [eventsResponse, venuesResponse, schedulesResponse, bookingsResponse] = await Promise.all([
        getEvents(),
        getVenues(),
        getSchedules(),
        getBookings()
      ]);

      const events = normalizeArray(eventsResponse);
      const venues = normalizeArray(venuesResponse);
      const bookings = normalizeArray(bookingsResponse);
      const nextLockedScheduleIds = new Set(
        bookings.map((booking) => normalizeText(getValue(booking, ['schedule_id', 'scheduleId']))).filter(Boolean)
      );

      const nextEventNameMap = events.reduce((acc, event) => {
        const id = normalizeText(getValue(event, ['event_id', 'eventId', 'id']));
        if (id) {
          acc[id] = getValue(event, ['event_name', 'name'], `Event #${id}`);
        }
        return acc;
      }, {});
      const nextEventCategoryMap = events.reduce((acc, event) => {
        const id = normalizeText(getValue(event, ['event_id', 'eventId', 'id']));
        if (id) {
          acc[id] = normalizeEventCategory(getValue(event, ['category']));
        }
        return acc;
      }, {});
      const schedules = normalizeArray(schedulesResponse).map((schedule) => {
        const eventId = normalizeText(getValue(schedule, ['event_id', 'eventId']));
        return normalizeScheduleRow(schedule, nextEventCategoryMap[eventId]);
      });

      const nextVenueNameMap = venues.reduce((acc, venue) => {
        const id = normalizeText(getValue(venue, ['venue_id', 'venueId', 'id']));
        if (id) {
          acc[id] = getValue(venue, ['venue_name', 'name'], `Venue #${id}`);
        }
        return acc;
      }, {});
      const nextVenueTypeMap = venues.reduce((acc, venue) => {
        const id = normalizeText(getValue(venue, ['venue_id', 'venueId', 'id']));
        if (id) {
          acc[id] = normalizeVenueType(getValue(venue, ['venue_type', 'venueType']));
        }
        return acc;
      }, {});

      const nextEventOptions = events
        .map((event) => {
          const id = normalizeText(getValue(event, ['event_id', 'eventId', 'id']));
          if (!id) {
            return null;
          }
          const name = getValue(event, ['event_name', 'name'], `Event #${id}`);
          return { value: id, label: `${name} (ID: ${id})` };
        })
        .filter(Boolean)
        .sort((first, second) => first.label.localeCompare(second.label));

      const nextVenueOptions = venues
        .map((venue) => {
          const id = normalizeText(getValue(venue, ['venue_id', 'venueId', 'id']));
          if (!id) {
            return null;
          }
          const name = getValue(venue, ['venue_name', 'name'], `Venue #${id}`);
          return { value: id, label: `${name} (ID: ${id})` };
        })
        .filter(Boolean)
        .sort((first, second) => first.label.localeCompare(second.label));

      setRows(schedules);
      setEventCategoryMap(nextEventCategoryMap);
      setEventNameMap(nextEventNameMap);
      setVenueNameMap(nextVenueNameMap);
      setVenueTypeMap(nextVenueTypeMap);
      setEventOptions(nextEventOptions);
      setVenueOptions(nextVenueOptions);
      setLockedScheduleIds(nextLockedScheduleIds);
    } catch (loadError) {
      setError(loadError.message || 'Failed to load schedules');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const groupedEvents = useMemo(() => {
    const groupedMap = new Map();

    rows.forEach((row) => {
      const eventId = normalizeText(getValue(row, ['event_id']));
      const venueId = normalizeText(getValue(row, ['venue_id']));
      if (!eventId || !venueId) {
        return;
      }

      if (!groupedMap.has(eventId)) {
        groupedMap.set(eventId, {
          eventId,
          eventName: eventNameMap[eventId] || `Event #${eventId}`,
          venues: new Map()
        });
      }

      const eventGroup = groupedMap.get(eventId);
      if (!eventGroup.venues.has(venueId)) {
        eventGroup.venues.set(venueId, {
          venueId,
          venueName: venueNameMap[venueId] || `Venue #${venueId}`,
          audis: new Map()
        });
      }

      const venueGroup = eventGroup.venues.get(venueId);
      const audiName = resolveAudiName(getValue(row, ['audi_name', 'audiName']), eventCategoryMap[eventId]);

      if (!venueGroup.audis.has(audiName)) {
        venueGroup.audis.set(audiName, {
          audiName,
          schedules: []
        });
      }

      venueGroup.audis.get(audiName).schedules.push(row);
    });

    return Array.from(groupedMap.values())
      .map((eventGroup) => ({
        ...eventGroup,
        venues: Array.from(eventGroup.venues.values())
          .map((venueGroup) => ({
            ...venueGroup,
            audis: Array.from(venueGroup.audis.values())
              .map((audiGroup) => ({
                ...audiGroup,
                schedules: [...audiGroup.schedules].sort(
                  (first, second) =>
                    parseDateTimeValue(getValue(first, ['show_date']), getValue(first, ['show_time'])) -
                    parseDateTimeValue(getValue(second, ['show_date']), getValue(second, ['show_time']))
                )
              }))
              .sort((first, second) => first.audiName.localeCompare(second.audiName))
          }))
          .sort((first, second) => first.venueName.localeCompare(second.venueName))
      }))
      .sort((first, second) => first.eventName.localeCompare(second.eventName));
  }, [eventNameMap, rows, venueNameMap]);

  const normalizedEventNameQuery = useMemo(() => eventNameQuery.trim().toLowerCase(), [eventNameQuery]);
  const filteredGroupedEvents = useMemo(() => {
    if (!normalizedEventNameQuery) {
      return groupedEvents;
    }

    return groupedEvents.filter((eventGroup) => eventGroup.eventName.toLowerCase().includes(normalizedEventNameQuery));
  }, [groupedEvents, normalizedEventNameQuery]);

  const openCreateModal = (defaults = {}) => {
    const nextEventId = defaults.event_id ? String(defaults.event_id) : initialValues.event_id;
    const nextEventCategory = normalizeEventCategory(eventCategoryMap[normalizeText(nextEventId)]);

    setEditingItem(null);
    setFormErrors({});
    setFormValues({
      ...initialValues,
      event_id: nextEventId,
      venue_id: defaults.venue_id ? String(defaults.venue_id) : initialValues.venue_id,
      audi_name: defaults.audi_name ? String(defaults.audi_name) : getAudiFieldDefaultValue(nextEventCategory),
      show_time: defaults.show_time || initialValues.show_time || DEFAULT_SHOW_TIME
    });
    setShowModal(true);
  };

  const openEditModal = (item) => {
    const itemEventId = normalizeText(getValue(item, ['event_id']));
    const itemEventCategory = normalizeEventCategory(eventCategoryMap[itemEventId]);
    const nextValues = { ...initialValues };
    fields.forEach((field) => {
      if (field.name === 'audi_name') {
        nextValues[field.name] = resolveAudiName(getValue(item, [field.name]), itemEventCategory);
        return;
      }

      nextValues[field.name] = toFormFieldValue(field.name, getValue(item, [field.name], nextValues[field.name]));
    });

    setEditingItem(item);
    setFormErrors({});
    setFormValues(nextValues);
    setShowModal(true);
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setFormValues((current) => {
      const nextValues = { ...current, [name]: value };

      if (name === 'event_id') {
        const nextCategory = normalizeEventCategory(eventCategoryMap[normalizeText(value)]);
        const requiredVenueType = requiredVenueTypeForEventCategory(nextCategory);
        const currentVenueType = normalizeVenueType(venueTypeMap[normalizeText(current.venue_id)]);

        if (current.venue_id && nextCategory && currentVenueType !== requiredVenueType) {
          nextValues.venue_id = '';
        }

        nextValues.audi_name = getAudiFieldDefaultValue(nextCategory);
      }

      return nextValues;
    });
    setFormErrors((current) => ({ ...current, [name]: '' }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationErrors = validateForm(fields, formValues);
    setFormErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    try {
      setSaving(true);
      if (editingItem) {
        await updateSchedule(
          resolveScheduleId(editingItem),
          getScheduleUpdatePayload(
            editingItem,
            formValues,
            editingItemHasBookings,
            eventCategoryMap[normalizeText(getValue(editingItem, ['event_id']))]
          )
        );
        toast.success('Schedule updated');
      } else {
        await createSchedule(formValues);
        toast.success('Schedule created');
      }

      setShowModal(false);
      await loadData();
    } catch (submitError) {
      toast.error(submitError.message || 'Unable to save schedule');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) {
      return;
    }

    try {
      setDeleting(true);
      await deleteSchedule(resolveScheduleId(confirmDelete));
      toast.success('Slot deleted');
      setConfirmDelete(null);
      await loadData();
    } catch (deleteError) {
      toast.error(deleteError.message || 'Unable to delete slot');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return <Loader text="Loading schedules..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadData} />;
  }

  return (
    <section className="admin-page schedule-admin-page">
      <div className="section-head">
        <div>
          <h1>Manage Event Schedules</h1>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => openCreateModal()}>
          Add New
        </button>
      </div>

      <div className="schedule-filter-panel">
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
      </div>

      {!groupedEvents.length ? (
        <EmptyState
          title="No schedules configured"
          description="Add a schedule to start grouping venues under events."
        />
      ) : !filteredGroupedEvents.length ? (
        <EmptyState
          title="No schedules found"
          description={`No schedules match event name "${eventNameQuery.trim()}".`}
        />
      ) : (
        <div className="schedule-event-groups">
          {filteredGroupedEvents.map((eventGroup) => (
            <article key={eventGroup.eventId} className="schedule-event-group">
              <header className="schedule-event-header">
                <div>
                  <h3>{eventGroup.eventName}</h3>
                </div>
              </header>

              <div className="schedule-venue-groups">
                {eventGroup.venues.map((venueGroup) => (
                  <section key={venueGroup.venueId} className="schedule-venue-group">
                    <div className="schedule-venue-header">
                      <div>
                        <h4>{venueGroup.venueName}</h4>
                      </div>
                      <button
                        type="button"
                        className="btn btn-small btn-outline"
                        onClick={() =>
                          openCreateModal({
                            event_id: eventGroup.eventId,
                            venue_id: venueGroup.venueId
                          })
                        }
                      >
                        Add Slot
                      </button>
                    </div>

                    <div className="schedule-audi-groups">
                      {venueGroup.audis.map((audiGroup) => (
                        <section key={`${venueGroup.venueId}-${audiGroup.audiName}`} className="schedule-audi-group">
                          <div className="schedule-audi-header">
                            <div>
                              <h5>{audiGroup.audiName}</h5>
                              <p>{audiGroup.schedules.length} slots</p>
                            </div>
                          </div>

                          <div className="schedule-slot-list">
                            {audiGroup.schedules.map((schedule) => {
                              const status = getValue(schedule, ['schedule_status'], 'UNKNOWN');
                              const scheduleId = resolveScheduleId(schedule);
                              return (
                                <div key={scheduleId} className="schedule-slot-card">
                                  <div className="schedule-slot-main">
                                    <strong>{formatDate(getValue(schedule, ['show_date']))}</strong>
                                    <strong>{formatTime(getValue(schedule, ['show_time']))}</strong>
                                  </div>
                                  <div className="schedule-slot-meta">
                                    <span className={getStatusClassName(status)}>{status}</span>
                                  </div>
                                  <div className="table-actions">
                                    <button
                                      type="button"
                                      className="btn btn-small btn-outline"
                                      onClick={() => openEditModal(schedule)}
                                    >
                                      Edit
                                    </button>
                                    <button
                                      type="button"
                                      className="btn btn-small btn-danger"
                                      onClick={() => setConfirmDelete(schedule)}
                                    >
                                      Delete Slot
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </section>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            </article>
          ))}
        </div>
      )}

      <Modal isOpen={showModal} title={editingItem ? 'Edit Slot' : 'Create Slot'} onClose={() => setShowModal(false)}>
        <AdminEntityForm
          fields={fields}
          values={formValues}
          errors={formErrors}
          onChange={handleFormChange}
          onSubmit={handleSubmit}
          onCancel={() => setShowModal(false)}
          loading={saving}
          submitText={editingItem ? 'Update Slot' : 'Create Slot'}
        />
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(confirmDelete)}
        title="Delete Slot"
        message={
          confirmDelete
            ? `${lockedScheduleIds.has(normalizeText(resolveScheduleId(confirmDelete))) ? 'This slot has bookings. Deleting it will also remove those bookings, payments, cancellations, and booked seats. ' : ''}Delete the ${formatDate(getValue(confirmDelete, ['show_date']))} ${formatTime(getValue(confirmDelete, ['show_time']))} slot from ${venueNameMap[normalizeText(getValue(confirmDelete, ['venue_id']))] || 'this venue'} (${resolveAudiName(
                getValue(confirmDelete, ['audi_name', 'audiName']),
                eventCategoryMap[normalizeText(getValue(confirmDelete, ['event_id']))]
              )})?`
            : 'This will permanently remove the selected slot. Continue?'
        }
        confirmText="Delete Slot"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
        loading={deleting}
      />
    </section>
  );
};

export default ManageSchedulesPage;
