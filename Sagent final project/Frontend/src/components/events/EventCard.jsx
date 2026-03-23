import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getValue } from '../../utils/entity';
import { getStatusClassName } from '../../utils/status';
import { limitWords } from '../../utils/format';
import { getEventImageCandidates } from '../../utils/eventImage';

const EventCard = ({ event, selectedVenueId = '' }) => {
  const eventId = getValue(event, ['event_id', 'id']);
  const name = getValue(event, ['event_name', 'name'], 'Untitled Event');
  const genre = getValue(event, ['genre']);
  const language = getValue(event, ['language']);
  const category = getValue(event, ['category']);
  const synopsis = limitWords(getValue(event, ['synopsis']), 4);
  const status = getValue(event, ['event_status', 'status'], 'UNKNOWN');
  const [imageIndex, setImageIndex] = useState(0);
  const imageCandidates = useMemo(() => getEventImageCandidates(event), [event]);
  const eventLink = selectedVenueId
    ? `/events/${eventId}?venueId=${encodeURIComponent(String(selectedVenueId))}`
    : `/events/${eventId}`;
  const imageUrl = imageCandidates[imageIndex] || '';
  const showImage = Boolean(imageUrl);

  useEffect(() => {
    setImageIndex(0);
  }, [imageCandidates]);

  return (
    <article className="event-card">
      <div className={`event-card-media ${showImage ? '' : 'is-fallback'}`}>
        {showImage ? (
          <img
            key={imageUrl}
            src={imageUrl}
            alt={`${name} poster`}
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setImageIndex((current) => current + 1)}
          />
        ) : (
          <div className="event-card-fallback">
            <div className="event-card-fallback-content">
              <span>{category || 'Featured Event'}</span>
              <strong>{name}</strong>
              <small>{genre || language || 'Now booking'}</small>
            </div>
          </div>
        )}
      </div>
      <div className="event-meta-row">
        <span className="pill">{category || 'General'}</span>
        <span className={getStatusClassName(status)}>{status}</span>
      </div>
      <h3>{name}</h3>
      <p>{synopsis || 'No synopsis available.'}</p>
      <div className="event-tags">
        <span>{genre || '-'}</span>
        <span>{language || '-'}</span>
      </div>
      <Link className="btn btn-primary" to={eventLink}>
        Select Event
      </Link>
    </article>
  );
};

export default EventCard;
