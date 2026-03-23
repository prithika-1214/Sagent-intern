import { Link } from 'react-router-dom';
import { formatDate, formatTime } from '../../utils/format';
import { getValue } from '../../utils/entity';
import { getStatusClassName } from '../../utils/status';

const ScheduleCard = ({ schedule, venueName = '', hideVenue = false, eventCategory = '' }) => {
  const scheduleId = getValue(schedule, ['schedule_id', 'id']);
  const showDate = getValue(schedule, ['show_date']);
  const showTime = getValue(schedule, ['show_time']);
  const venueId = getValue(schedule, ['venue_id']);
  const availableSeats = getValue(schedule, ['available_seats'], 0);
  const status = getValue(schedule, ['schedule_status', 'status'], 'UNKNOWN');
  const normalizedStatus = String(status || '').toUpperCase();
  const normalizedCategory = String(eventCategory || '').trim().toUpperCase();
  const isUnavailable = normalizedStatus === 'CANCELLED' || normalizedStatus === 'INACTIVE' || normalizedStatus === 'CLOSED';
  const hasNoSeats = Number(availableSeats || 0) <= 0;
  const canBook = !isUnavailable && !hasNoSeats;
  const isConcert = normalizedCategory === 'CONCERT';
  const bookingPath = isConcert ? `/schedules/${scheduleId}/concert-tickets` : `/schedules/${scheduleId}/seats`;
  const ctaLabel =
    normalizedStatus === 'CLOSED'
      ? 'Booking Closed'
      : normalizedStatus === 'CANCELLED'
        ? 'Cancelled'
        : hasNoSeats
          ? 'Sold Out'
          : 'Slot Unavailable';

  return (
    <article className="schedule-card">
      <div className="schedule-head">
        <h4>Slot: {formatDate(showDate)} | {formatTime(showTime)}</h4>
        <span className={getStatusClassName(status)}>{status}</span>
      </div>
      {!hideVenue ? <p>Venue: {venueName || `Venue #${venueId}`}</p> : null}
      {canBook ? (
        <Link to={bookingPath} className="btn btn-primary">
          {isConcert ? 'Select Tickets' : 'Select Seats'}
        </Link>
      ) : (
        <button type="button" className="btn btn-outline" disabled>
          {ctaLabel}
        </button>
      )}
    </article>
  );
};

export default ScheduleCard;
