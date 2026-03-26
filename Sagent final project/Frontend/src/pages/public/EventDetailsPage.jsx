import { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import Loader from '../../components/common/Loader';
import ErrorState from '../../components/common/ErrorState';
import EmptyState from '../../components/common/EmptyState';
import ScheduleCard from '../../components/events/ScheduleCard';
import { getEventById } from '../../api/eventsApi';
import { getSchedulesByEventId } from '../../api/schedulesApi';
import { getVenues } from '../../api/venuesApi';
import { getCastFallbackStyle, getCastInitials, getEventCastMembers } from '../../utils/eventCast';
import { getValue, normalizeArray } from '../../utils/entity';
import { formatDate, formatDuration, limitWords } from '../../utils/format';
import { getEventImageCandidates } from '../../utils/eventImage';
import { getEventTrailerMedia } from '../../utils/trailerEmbed';

const normalizeId = (value) => String(value ?? '').trim();
const MAX_SHOW_DATES_PER_VENUE = 3;
const MAX_TIME_SLOTS_PER_DATE = 2;
const DEFAULT_AUDI_NAME = 'Audi 1';
const normalizeText = (value) => String(value ?? '').trim();
const normalizeDateKey = (value) => {
  const text = normalizeText(value);
  if (!text) {
    return '';
  }

  const [dateFromT] = text.split('T');
  const [dateFromSpace] = dateFromT.split(' ');
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateFromSpace)) {
    return dateFromSpace;
  }

  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) {
    return dateFromSpace;
  }

  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const day = String(parsed.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const toSlotTimestamp = (schedule) => {
  const showDate = getValue(schedule, ['show_date']);
  const showTime = getValue(schedule, ['show_time']);

  if (!showDate) {
    return Number.MAX_SAFE_INTEGER;
  }

  const combined = showTime ? `${showDate}T${showTime}` : showDate;
  const parsed = new Date(combined);
  return Number.isNaN(parsed.getTime()) ? Number.MAX_SAFE_INTEGER : parsed.getTime();
};

const toTimeKey = (value) => {
  const text = normalizeText(value);
  if (!text) {
    return '';
  }

  const [timePart] = text.split('T');
  const [hour = '00', minute = '00', second = '00'] = timePart.split(':');
  return `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}:${second.padStart(2, '0')}`;
};

const getAudiName = (schedule) =>
  normalizeText(getValue(schedule, ['audi_name', 'audiName'], DEFAULT_AUDI_NAME)) || DEFAULT_AUDI_NAME;

const isVisibleSchedule = (schedule) => {
  const status = normalizeText(getValue(schedule, ['schedule_status', 'scheduleStatus', 'status']));
  const normalizedStatus = status.toUpperCase();
  return !normalizedStatus || normalizedStatus === 'OPEN' || normalizedStatus === 'CLOSED';
};

const getBookableSlotsForDate = (dateSchedules = []) => {
  const uniqueByTime = [];
  const seenTimes = new Set();

  dateSchedules
    .slice()
    .sort((first, second) => toSlotTimestamp(first) - toSlotTimestamp(second))
    .forEach((schedule) => {
      const timeKey = toTimeKey(getValue(schedule, ['show_time', 'showTime']));
      const audiName = getAudiName(schedule);
      const scheduleKey = `${timeKey}|${audiName.toUpperCase()}`;
      if (!timeKey || seenTimes.has(scheduleKey)) {
        return;
      }
      seenTimes.add(scheduleKey);
      uniqueByTime.push(schedule);
    });

  return uniqueByTime.slice(0, MAX_TIME_SLOTS_PER_DATE);
};

const toDateChipMeta = (value) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return {
      weekday: '',
      day: '--',
      month: ''
    };
  }

  return {
    weekday: new Intl.DateTimeFormat('en-IN', { weekday: 'short' }).format(parsed).toUpperCase(),
    day: new Intl.DateTimeFormat('en-IN', { day: '2-digit' }).format(parsed),
    month: new Intl.DateTimeFormat('en-IN', { month: 'short' }).format(parsed).toUpperCase()
  };
};

const limitSchedulesForVenue = (venueSchedules = []) => {
  const groupedByDate = new Map();

  venueSchedules.forEach((schedule) => {
    const showDate = normalizeDateKey(getValue(schedule, ['show_date', 'showDate']));
    if (!showDate) {
      return;
    }

    if (!groupedByDate.has(showDate)) {
      groupedByDate.set(showDate, []);
    }
    groupedByDate.get(showDate).push(schedule);
  });

  const sortedDates = Array.from(groupedByDate.keys()).sort(
    (first, second) => new Date(first).getTime() - new Date(second).getTime()
  );
  const limited = [];
  let selectedDateCount = 0;

  sortedDates.forEach((showDate) => {
    if (selectedDateCount >= MAX_SHOW_DATES_PER_VENUE) {
      return;
    }

    const schedulesForDate = (groupedByDate.get(showDate) || []).slice().sort((first, second) => {
      const firstTime = normalizeText(getValue(first, ['show_time', 'showTime']));
      const secondTime = normalizeText(getValue(second, ['show_time', 'showTime']));
      if (firstTime && secondTime) {
        return firstTime.localeCompare(secondTime);
      }
      return toSlotTimestamp(first) - toSlotTimestamp(second);
    });
    const uniqueSchedules = [];
    const seenTimes = new Set();

    schedulesForDate.forEach((schedule) => {
      const showTime = normalizeText(getValue(schedule, ['show_time', 'showTime']));
      const audiName = getAudiName(schedule);
      const key = `${showTime || String(toSlotTimestamp(schedule))}|${audiName.toUpperCase()}`;
      if (seenTimes.has(key)) {
        return;
      }
      seenTimes.add(key);
      uniqueSchedules.push(schedule);
    });

    limited.push(...uniqueSchedules.slice(0, MAX_TIME_SLOTS_PER_DATE));
    selectedDateCount += 1;
  });

  return limited;
};

const EventDetailsPage = () => {
  const { eventId } = useParams();
  const [searchParams] = useSearchParams();
  const [event, setEvent] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [venuesMap, setVenuesMap] = useState({});
  const [selectedVenueId, setSelectedVenueId] = useState('');
  const [selectedShowDate, setSelectedShowDate] = useState('');
  const [posterIndex, setPosterIndex] = useState(0);
  const [castImageErrors, setCastImageErrors] = useState({});
  const [isTrailerOpen, setIsTrailerOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const preselectedVenueId = normalizeId(searchParams.get('venueId'));

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const [eventResponse, schedulesResponse, venuesResponse] = await Promise.all([
        getEventById(eventId),
        getSchedulesByEventId(eventId),
        getVenues()
      ]);

      const venueLookup = normalizeArray(venuesResponse).reduce((acc, venue) => {
        const venueId = normalizeId(getValue(venue, ['venue_id', 'id']));
        if (venueId) {
          acc[venueId] = venue;
        }
        return acc;
      }, {});
      const normalizedEventId = normalizeId(eventId);
      const eventSchedules = normalizeArray(schedulesResponse).filter(
        (schedule) =>
          normalizeId(getValue(schedule, ['event_id', 'eventId'])) === normalizedEventId && isVisibleSchedule(schedule)
      );

      setEvent(eventResponse);
      setSchedules(eventSchedules);
      setVenuesMap(venueLookup);
      setSelectedVenueId('');
    } catch (err) {
      setError(err.message || 'Failed to load event details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [eventId]);

  useEffect(() => {
    setPosterIndex(0);
    setCastImageErrors({});
    setIsTrailerOpen(false);
  }, [event]);

  useEffect(() => {
    if (!isTrailerOpen) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsTrailerOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isTrailerOpen]);

  const schedulesByVenue = useMemo(() => {
    const grouped = {};

    schedules.forEach((schedule) => {
      const venueId = normalizeId(getValue(schedule, ['venue_id', 'venueId']));
      if (!venueId) {
        return;
      }

      if (!grouped[venueId]) {
        grouped[venueId] = [];
      }
      grouped[venueId].push(schedule);
    });

    Object.values(grouped).forEach((venueSchedules) => {
      venueSchedules.sort((first, second) => toSlotTimestamp(first) - toSlotTimestamp(second));
    });

    return grouped;
  }, [schedules]);
  const limitedSchedulesByVenue = useMemo(
    () =>
      Object.entries(schedulesByVenue).reduce((acc, [venueId, venueSchedules]) => {
        acc[venueId] = limitSchedulesForVenue(venueSchedules);
        return acc;
      }, {}),
    [schedulesByVenue]
  );

  const venueOptions = useMemo(
    () =>
      Object.entries(limitedSchedulesByVenue)
        .map(([venueId, venueSchedules]) => {
          const venue = venuesMap[venueId] || {};
          const venueName = getValue(venue, ['venue_name', 'name'], `Venue #${venueId}`);
          const city = getValue(venue, ['city']);
          const state = getValue(venue, ['state']);

          return {
            venueId,
            venueName,
            locationText: [city, state].filter(Boolean).join(', '),
            address: getValue(venue, ['address'], '')
          };
        })
        .sort((first, second) => first.venueName.localeCompare(second.venueName)),
    [limitedSchedulesByVenue, venuesMap]
  );

  useEffect(() => {
    if (!selectedVenueId) {
      return;
    }

    const stillAvailable = venueOptions.some((venue) => venue.venueId === selectedVenueId);
    if (!stillAvailable) {
      setSelectedVenueId('');
    }
  }, [selectedVenueId, venueOptions]);

  const selectedVenue = useMemo(
    () => venueOptions.find((venue) => venue.venueId === selectedVenueId) || null,
    [selectedVenueId, venueOptions]
  );
  const isVenuePreselected = useMemo(
    () => Boolean(preselectedVenueId) && venueOptions.some((venue) => venue.venueId === preselectedVenueId),
    [preselectedVenueId, venueOptions]
  );

  useEffect(() => {
    if (!isVenuePreselected) {
      return;
    }
    if (selectedVenueId !== preselectedVenueId) {
      setSelectedVenueId(preselectedVenueId);
    }
  }, [isVenuePreselected, preselectedVenueId, selectedVenueId]);

  const selectedVenueSchedules = useMemo(
    () => (selectedVenueId ? limitedSchedulesByVenue[selectedVenueId] || [] : []),
    [selectedVenueId, limitedSchedulesByVenue]
  );
  const availableDateOptions = useMemo(() => {
    const seen = new Set();
    const options = [];

    selectedVenueSchedules.forEach((schedule) => {
      const showDate = normalizeDateKey(getValue(schedule, ['show_date', 'showDate'], ''));
      if (!showDate || seen.has(showDate)) {
        return;
      }
      seen.add(showDate);
      options.push({
        value: showDate,
        label: formatDate(showDate)
      });
    });

    options.sort((first, second) => {
      const firstTime = new Date(first.value).getTime();
      const secondTime = new Date(second.value).getTime();
      return firstTime - secondTime;
    });

    return options;
  }, [selectedVenueSchedules]);
  const selectedDateSchedules = useMemo(
    () => {
      const matches = selectedVenueSchedules.filter(
        (schedule) => normalizeDateKey(getValue(schedule, ['show_date', 'showDate'], '')) === selectedShowDate
      );
      return getBookableSlotsForDate(matches);
    },
    [selectedShowDate, selectedVenueSchedules]
  );
  const castMembers = useMemo(() => getEventCastMembers(event), [event]);
  const trailerMedia = useMemo(() => getEventTrailerMedia(event), [event]);
  const slotStepNumber = isVenuePreselected ? 2 : 3;
  const dateStepNumber = isVenuePreselected ? 1 : 2;

  useEffect(() => {
    setSelectedShowDate('');
  }, [selectedVenueId]);
  useEffect(() => {
    if (!selectedShowDate) {
      return;
    }

    const stillAvailable = availableDateOptions.some((option) => option.value === selectedShowDate);
    if (!stillAvailable) {
      setSelectedShowDate('');
    }
  }, [availableDateOptions, selectedShowDate]);

  if (loading) {
    return <Loader text="Loading event details..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadData} />;
  }

  if (!event) {
    return <EmptyState title="Event not found" description="This event may have been removed." />;
  }

  const eventTitle = getValue(event, ['event_name', 'name'], 'Untitled Event');
  const eventSynopsis = limitWords(getValue(event, ['synopsis']), 4) || 'No synopsis available.';
  const posterCandidates = getEventImageCandidates(event);
  const posterUrl = posterCandidates[posterIndex] || '';
  const isInactiveEvent =
    normalizeText(getValue(event, ['event_status', 'eventStatus', 'status'])).toUpperCase() === 'INACTIVE';
  const handleOpenTrailer = () => {
    if (!trailerMedia) {
      return;
    }

    if (trailerMedia.kind === 'external') {
      window.open(trailerMedia.sourceUrl, '_blank', 'noopener,noreferrer');
      return;
    }

    setIsTrailerOpen(true);
  };

  return (
    <section className="container section">
      <div className="detail-card">
        <div className="detail-card-top">
          <div className={`detail-poster ${posterUrl ? '' : 'is-fallback'}`}>
            {posterUrl ? (
              <img
                src={posterUrl}
                alt={`${eventTitle} poster`}
                referrerPolicy="no-referrer"
                onError={() => setPosterIndex((current) => current + 1)}
              />
            ) : (
              <div className="event-card-fallback">
                <div className="event-card-fallback-content">
                  <span>{getValue(event, ['category'], 'Featured Event')}</span>
                  <strong>{eventTitle}</strong>
                  <small>{getValue(event, ['genre'], getValue(event, ['language'], 'Now booking'))}</small>
                </div>
              </div>
            )}

            {trailerMedia ? (
              <div className="detail-poster-overlay">
                <button type="button" className="trailer-pill" onClick={handleOpenTrailer}>
                  <span className="trailer-pill-play" aria-hidden="true" />
                  Trailer
                </button>
              </div>
            ) : null}
          </div>

          <div className="detail-card-copy">
            <h1>{eventTitle}</h1>
            <p>{eventSynopsis}</p>
            <div className="detail-grid">
              <div>
                <span>Genre</span>
                <strong>{getValue(event, ['genre'], '-')}</strong>
              </div>
              <div>
                <span>Duration</span>
                <strong>{formatDuration(getValue(event, ['duration']))}</strong>
              </div>
              <div>
                <span>Language</span>
                <strong>{getValue(event, ['language'], '-')}</strong>
              </div>
              <div>
                <span>Category</span>
                <strong>{getValue(event, ['category'], '-')}</strong>
              </div>
              <div>
                <span>Status</span>
                <strong>{getValue(event, ['event_status', 'status'], '-')}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {castMembers.length ? (
        <div className="cast-section">
          <div className="section-head">
            <div>
              <h2>Cast/Crew</h2>
              <p>Featured cast members for this event.</p>
            </div>
          </div>

          <div className="cast-strip" role="list" aria-label={`${eventTitle} cast members`}>
            {castMembers.map((member) => {
              const showImage = member.imageUrl && !castImageErrors[member.id];

              return (
                <article key={member.id} className="cast-card" role="listitem">
                  <div className={`cast-photo ${showImage ? '' : 'is-fallback'}`}>
                    {showImage ? (
                      <img
                        src={member.imageUrl}
                        alt={member.name}
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        onError={() =>
                          setCastImageErrors((current) => ({
                            ...current,
                            [member.id]: true
                          }))
                        }
                      />
                    ) : (
                      <div className="cast-photo-fallback" style={getCastFallbackStyle(member.name)}>
                        <span>{getCastInitials(member.name)}</span>
                      </div>
                    )}
                  </div>
                  <strong>{member.name}</strong>
                  <p>{member.role ? `as ${member.role}` : 'Cast member'}</p>
                </article>
              );
            })}
          </div>
        </div>
      ) : null}

      {trailerMedia && isTrailerOpen ? (
        <div className="trailer-pip" role="dialog" aria-modal="false" aria-label={`${eventTitle} trailer`}>
          <div className="trailer-pip-head">
            <div>
              <span className="trailer-pip-eyebrow">Now Playing</span>
              <strong>{eventTitle} Trailer</strong>
            </div>
            <div className="trailer-pip-actions">
              <a
                className="btn btn-small btn-outline"
                href={trailerMedia.sourceUrl}
                target="_blank"
                rel="noreferrer"
              >
                Open Link
              </a>
              <button type="button" className="icon-btn" onClick={() => setIsTrailerOpen(false)} aria-label="Close trailer">
                x
              </button>
            </div>
          </div>
          <div className="trailer-pip-body">
            {trailerMedia.kind === 'file' ? (
              <video src={trailerMedia.sourceUrl} controls autoPlay playsInline />
            ) : (
              <iframe
                src={trailerMedia.autoplayUrl || trailerMedia.embedUrl}
                title={`${eventTitle} trailer`}
                allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
              />
            )}
          </div>
        </div>
      ) : null}

      {isInactiveEvent ? (
        <div className="state-wrapper">
          <h3>Booking unavailable</h3>
          <p>This event is inactive, so venue, date, and seat selection are disabled.</p>
        </div>
      ) : null}

      {!isInactiveEvent && !isVenuePreselected ? (
        <>
          <div className="section-head">
            <div>
              <h2>Step 1: Select Venue</h2>
              <p>Choose your preferred venue for this event.</p>
            </div>
          </div>

          {!venueOptions.length ? (
            <EmptyState title="No venues available" description="No schedules are available for this event yet." />
          ) : (
            <div className="venue-grid">
              {venueOptions.map((venue) => (
                <button
                  key={venue.venueId}
                  type="button"
                  className={`venue-option ${selectedVenueId === venue.venueId ? 'active' : ''}`}
                  onClick={() => setSelectedVenueId(venue.venueId)}
                >
                  <div className="venue-option-head">
                    <h4>{venue.venueName}</h4>
                  </div>
                  <p>{venue.locationText || 'Location not available'}</p>
                  <p>{venue.address || `Venue ID: ${venue.venueId}`}</p>
                </button>
              ))}
            </div>
          )}
        </>
      ) : null}

      {!isInactiveEvent ? (
        <>
          <div className="section-head">
            <div>
              <h2>Step {dateStepNumber}: Select Date</h2>
              <p>
                {selectedVenue ? `Choose show date at ${selectedVenue.venueName}.` : 'Select a venue first to view dates.'}
              </p>
            </div>
          </div>

          {!selectedVenueId ? (
            <EmptyState title="Select a venue first" description="Choose a venue above to continue booking." />
          ) : !availableDateOptions.length ? (
            <EmptyState title="No dates available" description="No show dates found for the selected venue." />
          ) : (
            <div className="show-date-strip" role="tablist" aria-label="Show date options">
              {availableDateOptions.map((option) => {
                const meta = toDateChipMeta(option.value);
                const isActive = selectedShowDate === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    className={`show-date-chip ${isActive ? 'active' : ''}`}
                    onClick={() => setSelectedShowDate(option.value)}
                  >
                    <span className="weekday">{meta.weekday}</span>
                    <strong className="day">{meta.day}</strong>
                    <small className="month">{meta.month}</small>
                  </button>
                );
              })}
            </div>
          )}

          <div className="section-head">
            <div>
              <h2>Step {slotStepNumber}: Select Showtime / Slot</h2>
              <p>
                {selectedVenue && selectedShowDate
                  ? `Slots at ${selectedVenue.venueName} on ${formatDate(selectedShowDate)}.`
                  : 'Select venue and date to view slots.'}
              </p>
            </div>
          </div>

          {!selectedVenueId ? (
            <EmptyState title="Select a venue first" description="Choose a venue above to continue booking." />
          ) : !selectedShowDate ? (
            <EmptyState title="Select a date first" description="Choose a show date above to view slots." />
          ) : !selectedDateSchedules.length ? (
            <EmptyState title="No slots available" description="No showtime slots found for the selected date." />
          ) : (
            <div className="schedule-grid">
              {selectedDateSchedules.map((schedule, index) => (
                <ScheduleCard
                  key={`${getValue(schedule, ['schedule_id', 'id'], 'schedule')}-${index}`}
                  schedule={schedule}
                  venueName={selectedVenue?.venueName}
                  hideVenue
                  eventCategory={getValue(event, ['category'])}
                />
              ))}
            </div>
          )}
        </>
      ) : null}
    </section>
  );
};

export default EventDetailsPage;
