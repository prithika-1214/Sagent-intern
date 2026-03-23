import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import EventCard from '../../components/events/EventCard';
import Loader from '../../components/common/Loader';
import ErrorState from '../../components/common/ErrorState';
import EmptyState from '../../components/common/EmptyState';
import { getEvents } from '../../api/eventsApi';
import { getBookings } from '../../api/bookingsApi';
import { getSchedules } from '../../api/schedulesApi';
import { getEntityId, normalizeArray, getValue } from '../../utils/entity';
import { useAuth } from '../../context/AuthContext';

const presetCategories = ['MOVIE', 'CONCERT', 'STANDUP_SHOW'];
const CATEGORY_LABELS = {
  MOVIE: 'Movie',
  CONCERT: 'Concert',
  STANDUP_SHOW: 'Show'
};

const toId = (value) => String(value ?? '').trim();
const normalizeCategory = (value) => {
  const normalized = String(value ?? '')
    .trim()
    .toUpperCase()
    .replace(/-/g, '_')
    .replace(/\s+/g, '_');

  if (normalized === 'SHOW' || normalized === 'STANDUP') {
    return 'STANDUP_SHOW';
  }

  return normalized;
};
const formatCategoryLabel = (category) =>
  CATEGORY_LABELS[normalizeCategory(category)] ||
  String(category ?? '')
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
const toTimestamp = (value) => {
  if (!value) {
    return 0;
  }
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
};

const LandingPage = () => {
  const { currentUser } = useAuth();
  const [events, setEvents] = useState([]);
  const [preferredGenres, setPreferredGenres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('');
  const currentUserId = toId(getValue(currentUser, ['id', 'user_id', 'userId']));

  const loadEvents = async () => {
    try {
      setLoading(true);
      setError('');
      const [eventsResponse, bookingsResponse, schedulesResponse] = await Promise.all([
        getEvents(),
        getBookings(),
        getSchedules()
      ]);

      const eventRows = normalizeArray(eventsResponse);
      const bookingRows = normalizeArray(bookingsResponse);
      const scheduleRows = normalizeArray(schedulesResponse);

      setEvents(eventRows);

      if (!currentUserId) {
        setPreferredGenres([]);
        return;
      }

      const eventById = new Map(
        eventRows.map((event) => [toId(getValue(event, ['event_id', 'eventId', 'id'])), event])
      );
      const scheduleById = new Map(
        scheduleRows.map((schedule) => [toId(getValue(schedule, ['schedule_id', 'scheduleId', 'id'])), schedule])
      );

      const genreStats = bookingRows.reduce((acc, booking) => {
        const bookingUserId = toId(getValue(booking, ['user_id', 'userId']));
        const bookingStatus = String(getValue(booking, ['booking_status', 'bookingStatus'], '')).toUpperCase();

        if (bookingUserId !== currentUserId || bookingStatus === 'CANCELLED') {
          return acc;
        }

        const scheduleId = toId(getValue(booking, ['schedule_id', 'scheduleId']));
        const schedule = scheduleById.get(scheduleId);
        if (!schedule) {
          return acc;
        }

        const eventId = toId(getValue(schedule, ['event_id', 'eventId']));
        const event = eventById.get(eventId);
        if (!event) {
          return acc;
        }

        const genreLabel = String(getValue(event, ['genre'], '')).trim();
        if (!genreLabel) {
          return acc;
        }

        const key = genreLabel.toLowerCase();
        const bookedAt = toTimestamp(getValue(booking, ['booking_date', 'bookingDate']));
        const current = acc[key] || { label: genreLabel, count: 0, lastBookedAt: 0 };
        current.count += 1;
        current.lastBookedAt = Math.max(current.lastBookedAt, bookedAt);
        acc[key] = current;
        return acc;
      }, {});

      const rankedGenres = Object.values(genreStats)
        .sort((first, second) => {
          if (second.count !== first.count) {
            return second.count - first.count;
          }
          if (second.lastBookedAt !== first.lastBookedAt) {
            return second.lastBookedAt - first.lastBookedAt;
          }
          return first.label.localeCompare(second.label);
        })
        .map((item) => item.label);

      setPreferredGenres(rankedGenres);
    } catch (err) {
      setError(err.message || 'Failed to load featured events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId]);

  const categories = useMemo(() => {
    const fromData = events.map((event) => normalizeCategory(getValue(event, ['category']))).filter(Boolean);
    return Array.from(new Set([...presetCategories, ...fromData]));
  }, [events]);

  const featuredEvents = useMemo(() => {
    const filtered = events.filter((event) => {
      const name = getValue(event, ['event_name', 'name'], '').toLowerCase();
      const category = normalizeCategory(getValue(event, ['category']));
      const matchSearch = !searchTerm || name.includes(searchTerm.toLowerCase());
      const matchCategory = !activeCategory || category === activeCategory;
      return matchSearch && matchCategory;
    });

    if (!preferredGenres.length) {
      return filtered.slice(0, 4);
    }

    const selectedIds = new Set();
    const prioritized = [];
    const pushEvent = (event) => {
      const id = toId(getValue(event, ['event_id', 'eventId', 'id']));
      if (!id || selectedIds.has(id)) {
        return;
      }
      selectedIds.add(id);
      prioritized.push(event);
    };

    preferredGenres.forEach((genre) => {
      const normalizedGenre = genre.toLowerCase();
      filtered
        .filter((event) => String(getValue(event, ['genre'], '')).toLowerCase() === normalizedGenre)
        .forEach(pushEvent);
    });

    filtered.forEach(pushEvent);

    return prioritized.slice(0, 4);
  }, [activeCategory, events, preferredGenres, searchTerm]);

  return (
    <div className="landing-page">
      <section className="hero">
        <div className="container hero-content">
          <div>
            <h1>Book Movies, Events, and Concerts in Minutes</h1>
            <p>
              Discover trending shows, compare schedules, choose your seats, and complete secure bookings in one
              smooth flow.
            </p>
            <div className="hero-actions">
              <Link className="btn btn-primary" to="/events">
                Explore Events
              </Link>
              <Link className="btn btn-outline" to="/my-bookings">
                View My Bookings
              </Link>
            </div>
          </div>
          <div className="hero-panel">
            <label htmlFor="landing-search">Search events by name</label>
            <input
              id="landing-search"
              type="text"
              className="hero-search"
              placeholder="Search for your next show..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
            <div className="chip-list">
              <button
                type="button"
                className={`chip ${!activeCategory ? 'active' : ''}`}
                onClick={() => setActiveCategory('')}
              >
                All
              </button>
              {categories.map((category, index) => (
                <button
                  key={`${String(category || 'category')}-${index}`}
                  type="button"
                  className={`chip ${activeCategory === category ? 'active' : ''}`}
                  onClick={() => setActiveCategory(category)}
                >
                  {formatCategoryLabel(category)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="container section">
        <div className="section-head">
          <div>
            <h2>Featured Events</h2>
          </div>
          <Link className="text-link" to="/events">
            See All Events
          </Link>
        </div>

        {loading ? <Loader text="Loading featured events..." /> : null}
        {error ? <ErrorState message={error} onRetry={loadEvents} /> : null}
        {!loading && !error && !featuredEvents.length ? (
          <EmptyState title="No featured events" description="Try a different search or category." />
        ) : null}

        {!loading && !error && featuredEvents.length ? (
          <div className="card-grid">
            {featuredEvents.map((event, index) => (
              <EventCard key={String(getEntityId(event) || `featured-event-${index}`)} event={event} />
            ))}
          </div>
        ) : null}
      </section>
    </div>
  );
};

export default LandingPage;
