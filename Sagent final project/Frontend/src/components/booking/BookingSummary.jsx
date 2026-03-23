import { formatCurrency, formatDate, formatTime } from '../../utils/format';
import { getValue } from '../../utils/entity';
import { calculateBookingPricing } from '../../utils/pricing';

const BookingSummary = ({
  schedule,
  selectedSeats = [],
  ticketSelection = null,
  discountAmount = 0,
  movieName = '-',
  venueName = '-'
}) => {
  const isConcertBooking = Boolean(ticketSelection);
  const pricing = calculateBookingPricing({
    selectedSeats,
    ticketSelection,
    discountAmount
  });
  const showDate = formatDate(getValue(schedule, ['show_date', 'showDate']));
  const showTime = formatTime(getValue(schedule, ['show_time', 'showTime']));
  const audiName = getValue(schedule, ['audi_name', 'audiName'], 'Audi 1');
  const reservationCount = pricing.quantity;

  return (
    <section className="summary-card">
      <h3>Booking Summary</h3>
      <p>Movie: {movieName || '-'}</p>
      <p>Venue: {venueName || '-'}</p>
      <p>Audi: {audiName}</p>
      <p>Date: {showDate}</p>
      <p>Time: {showTime}</p>
      <p>{isConcertBooking ? 'Tickets Selected' : 'Seats Selected'}: {reservationCount}</p>
      <div className="summary-seat-list">
        {isConcertBooking ? (
            <div className="summary-seat-item">
              <span>
                {getValue(ticketSelection, ['categoryName', 'category_name'], '-')} x
                {` ${getValue(ticketSelection, ['quantity'], 0)}`}
              </span>
              <span>{formatCurrency(pricing.subtotal)}</span>
            </div>
          ) : (
            selectedSeats.map((seat, index) => (
            <div key={`summary-seat-${index}`} className="summary-seat-item">
              <span>{getValue(seat, ['seat_number'], '-')}</span>
              <span>{formatCurrency(getValue(seat, ['seat_price'], 0))}</span>
            </div>
          ))
        )}
      </div>
      <div className="summary-totals">
        <div>
          <span>Subtotal</span>
          <strong>{formatCurrency(pricing.subtotal)}</strong>
        </div>
        <div>
          <span>Convenience Fee</span>
          <strong>{formatCurrency(pricing.convenienceFee)}</strong>
        </div>
        <div>
          <span>GST ({pricing.gstPercentage}%)</span>
          <strong>{formatCurrency(pricing.gstAmount)}</strong>
        </div>
        <div>
          <span>Discount</span>
          <strong>- {formatCurrency(pricing.discount)}</strong>
        </div>
        <div className="total">
          <span>Total</span>
          <strong>{formatCurrency(pricing.total)}</strong>
        </div>
      </div>
    </section>
  );
};

export default BookingSummary;
