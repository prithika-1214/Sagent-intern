import { useEffect, useMemo, useState } from 'react';
import EventCard from '../../components/events/EventCard';
import Loader from '../../components/common/Loader';
import ErrorState from '../../components/common/ErrorState';
import EmptyState from '../../components/common/EmptyState';
import FormInput from '../../components/common/FormInput';
import SelectInput from '../../components/common/SelectInput';
import { getEvents } from '../../api/eventsApi';
import { getSchedules } from '../../api/schedulesApi';
import { getVenues } from '../../api/venuesApi';
import { getEntityId, getValue, normalizeArray } from '../../utils/entity';
import useDebounce from '../../hooks/useDebounce';

const toId = (value) => String(value ?? '').trim();

const EventsPage = () => {
  const [events, setEvents] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [venuesMap, setVenuesMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('');
  const [language, setLanguage] = useState('');
  const [genre, setGenre] = useState('');
  const [venue, setVenue] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');
  const debouncedSearch = useDebounce(searchTerm, 300);

  const loadEvents = async () => {
    try {
      setLoading(true);
      setError('');
      const [eventsResponse, schedulesResponse, venuesResponse] = await Promise.all([
        getEvents(),
        getSchedules(),
        getVenues()
      ]);

      const venuesLookup = normalizeArray(venuesResponse).reduce((acc, item) => {
        const venueId = toId(getValue(item, ['venue_id', 'venueId', 'id']));
        if (venueId) {
          acc[venueId] = item;
        }
        return acc;
      }, {});

      setEvents(normalizeArray(eventsResponse));
      setSchedules(normalizeArray(schedulesResponse));
      setVenuesMap(venuesLookup);
    } catch (err) {
      setError(err.message || 'Failed to fetch events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const eventVenueMap = useMemo(() => {
    const map = new Map();

    schedules.forEach((schedule) => {
      const eventId = toId(getValue(schedule, ['event_id', 'eventId']));
      const venueId = toId(getValue(schedule, ['venue_id', 'venueId']));
      if (!eventId || !venueId) {
        return;
      }

      if (!map.has(eventId)) {
        map.set(eventId, new Set());
      }
      map.get(eventId).add(venueId);
    });

    return map;
  }, [schedules]);

  const filterOptions = useMemo(() => {
    const categories = new Set();
    const languages = new Set();
    const genres = new Set();
    const venueIds = new Set();

    events.forEach((event) => {
      const eventCategory = getValue(event, ['category']);
      const eventLanguage = getValue(event, ['language']);
      const eventGenre = getValue(event, ['genre']);
      if (eventCategory) {
        categories.add(eventCategory);
      }
      if (eventLanguage) {
        languages.add(eventLanguage);
      }
      if (eventGenre) {
        genres.add(eventGenre);
      }
    });

    schedules.forEach((schedule) => {
      const venueId = toId(getValue(schedule, ['venue_id', 'venueId']));
      if (venueId) {
        venueIds.add(venueId);
      }
    });

    const venues = Array.from(venueIds)
      .map((venueId) => ({
        value: venueId,
        label: getValue(venuesMap[venueId], ['venue_name', 'name'], `Venue #${venueId}`)
      }))
      .sort((first, second) => first.label.localeCompare(second.label));

    return {
      categories: Array.from(categories),
      languages: Array.from(languages),
      genres: Array.from(genres),
      venues
    };
  }, [events, schedules, venuesMap]);

  useEffect(() => {
    if (!venue) {
      return;
    }

    const hasVenueOption = filterOptions.venues.some((item) => item.value === venue);
    if (!hasVenueOption) {
      setVenue('');
    }
  }, [filterOptions.venues, venue]);

  const filteredEvents = useMemo(() => {
    const list = events.filter((event) => {
      const eventName = getValue(event, ['event_name', 'name'], '').toLowerCase();
      const eventCategory = getValue(event, ['category'], '').toLowerCase();
      const eventLanguage = getValue(event, ['language'], '').toLowerCase();
      const eventGenre = getValue(event, ['genre'], '').toLowerCase();
      const eventId = toId(getValue(event, ['event_id', 'eventId', 'id']));
      const eventVenueIds = eventVenueMap.get(eventId);
      const matchVenue = !venue || eventVenueIds?.has(venue);

      return (
        (!debouncedSearch || eventName.includes(debouncedSearch.toLowerCase())) &&
        (!category || eventCategory === category.toLowerCase()) &&
        (!language || eventLanguage === language.toLowerCase()) &&
        (!genre || eventGenre === genre.toLowerCase()) &&
        matchVenue
      );
    });

    list.sort((a, b) => {
      const first = getValue(a, ['event_name', 'name'], '').toLowerCase();
      const second = getValue(b, ['event_name', 'name'], '').toLowerCase();
      if (sortOrder === 'desc') {
        return second.localeCompare(first);
      }
      return first.localeCompare(second);
    });

    return list;
  }, [category, debouncedSearch, eventVenueMap, events, genre, language, sortOrder, venue]);

  return (
    <section className="container section events-page">
      <div className="section-head">
        <div>
          <h1>Discover Events</h1>
          <p>Search, filter, and book your next show.</p>
        </div>
      </div>

      <div className="events-filter-panel">
        <div className="filter-grid">
          <FormInput
            label="Search by Event Name"
            name="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Type event name"
          />
          <SelectInput
            label="Category"
            name="category"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            options={filterOptions.categories.map((item) => ({ value: item, label: item }))}
            placeholder="All categories"
          />
          <SelectInput
            label="Language"
            name="language"
            value={language}
            onChange={(event) => setLanguage(event.target.value)}
            options={filterOptions.languages.map((item) => ({ value: item, label: item }))}
            placeholder="All languages"
          />
          <SelectInput
            label="Genre"
            name="genre"
            value={genre}
            onChange={(event) => setGenre(event.target.value)}
            options={filterOptions.genres.map((item) => ({ value: item, label: item }))}
            placeholder="All genres"
          />
          <SelectInput
            label="Venue"
            name="venue"
            value={venue}
            onChange={(event) => setVenue(event.target.value)}
            options={filterOptions.venues}
            placeholder="All venues"
          />
          <SelectInput
            label="Sort"
            name="sort"
            value={sortOrder}
            onChange={(event) => setSortOrder(event.target.value)}
            options={[
              { value: 'asc', label: 'A to Z' },
              { value: 'desc', label: 'Z to A' }
            ]}
          />
        </div>
      </div>

      {loading ? <Loader text="Loading events..." /> : null}
      {error ? <ErrorState message={error} onRetry={loadEvents} /> : null}
      {!loading && !error && !filteredEvents.length ? (
        <EmptyState title="No events found" description="Change filters and try again." />
      ) : null}

      {!loading && !error && filteredEvents.length ? (
        <div className="card-grid">
          {filteredEvents.map((event, index) => (
            <EventCard key={String(getEntityId(event) || `event-${index}`)} event={event} selectedVenueId={venue} />
          ))}
        </div>
      ) : null}
    </section>
  );
};

export default EventsPage;
