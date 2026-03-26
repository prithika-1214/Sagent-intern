import { useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getLastBookingSuccess } from '../../utils/storage';
import { formatCurrency, formatDate, formatTime } from '../../utils/format';
import { calculatePersistedPaymentPricing } from '../../utils/pricing';
import { downloadTicketPdf } from '../../utils/ticketPdf';
import { useToast } from '../../components/common/ToastProvider';

const BookingSuccessPage = () => {
  const toast = useToast();
  const location = useLocation();
  const [generating, setGenerating] = useState(false);
  const data = location.state || getLastBookingSuccess();
  const eventName = data?.event_name || '-';
  const venueName = data?.venue_name || '-';
  const audiName = data?.audi_name || '-';
  const showDate = data?.show_date ? formatDate(data.show_date) : '-';
  const showTime = data?.show_time ? formatTime(data.show_time) : '-';
  const showDateTime = showDate !== '-' ? `${showDate} | ${showTime}` : showTime;
  const isConcertBooking = Boolean(data?.ticket_category_name && Number(data?.ticket_quantity || 0) > 0);
  const reservationQuantity = isConcertBooking ? Number(data?.ticket_quantity || 0) : (data?.seat_labels || []).length;
  const paymentPricing = useMemo(
    () =>
      calculatePersistedPaymentPricing({
        payment: data,
        quantity: reservationQuantity
      }),
    [data, reservationQuantity]
  );
  const reservationLabelTitle = data?.seat_label_title || (isConcertBooking ? 'Tickets' : 'Seat Labels');
  const reservationLabelValue =
    data?.reservation_label ||
    (isConcertBooking
      ? `${data?.ticket_category_name || '-'} x${data?.ticket_quantity || 0}`
      : (data?.seat_labels || []).join(', ') || '-');
  const reservationItems = useMemo(() => {
    if (isConcertBooking) {
      return [reservationLabelValue];
    }

    const explicitSeatLabels = Array.isArray(data?.seat_labels) ? data.seat_labels.filter((label) => String(label || '').trim()) : [];
    if (explicitSeatLabels.length) {
      return explicitSeatLabels;
    }

    return String(reservationLabelValue || '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }, [data?.seat_labels, isConcertBooking, reservationLabelValue]);
  const ticketDetails = useMemo(
    () => ({
      bookingId: data?.booking_id,
      bookingDate: data?.booking_date ? formatDate(data.booking_date) : formatDate(new Date().toISOString()),
      bookingStatus: data?.booking_status || 'CONFIRMED',
      userName: data?.user_name || '-',
      userEmail: data?.user_email || '-',
      userMobile: data?.user_mobile || '-',
      eventName,
      eventImageUrl: data?.event_image_url || '',
      eventCategory: data?.event_category || '',
      eventGenre: data?.event_genre || '',
      eventLanguage: data?.event_language || '',
      venueName,
      audiName,
      showTime: showDateTime,
      seatLabels: reservationLabelValue,
      seatLabelTitle: reservationLabelTitle,
      paymentStatus: data?.payment_status || '-',
      paymentMethod: data?.payment_method || '-',
      subtotal: formatCurrency(paymentPricing.subtotal),
      convenienceFee: formatCurrency(paymentPricing.convenienceFee),
      gstPercentage: paymentPricing.gstPercentage,
      gstAmount: formatCurrency(paymentPricing.gstAmount),
      discount: formatCurrency(paymentPricing.discount),
      amount: formatCurrency(paymentPricing.total),
      transactionId: data?.transaction_id || '-'
    }),
    [audiName, data, eventName, paymentPricing, reservationLabelTitle, reservationLabelValue, showDateTime, venueName]
  );

  const handleGenerateTicket = async () => {
    try {
      setGenerating(true);
      await downloadTicketPdf(ticketDetails);
      toast.success('Ticket downloaded');
    } catch (error) {
      toast.error(error.message || 'Unable to generate ticket');
    } finally {
      setGenerating(false);
    }
  };

  if (!data) {
    return (
      <section className="container section">
        <div className="state-wrapper empty">
          <h2>No recent booking data</h2>
          <p>Complete a booking to view success details here.</p>
          <Link to="/events" className="btn btn-primary">
            Browse Events
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="container section">
      <div className="success-card">
        <h1>Booking Confirmed</h1>
        <p>{isConcertBooking ? 'Your tickets are confirmed. Enjoy the concert.' : 'Your seats are reserved. Enjoy your show.'}</p>
        <div className="detail-grid">
          <div>
            <span>Booking ID</span>
            <strong>{data.booking_id}</strong>
          </div>
          <div>
            <span>Event</span>
            <strong>{eventName}</strong>
          </div>
          <div>
            <span>Venue</span>
            <strong>{venueName}</strong>
          </div>
          <div>
            <span>Audi</span>
            <strong>{audiName}</strong>
          </div>
          <div>
            <span>Showtime</span>
            <strong>{showDateTime}</strong>
          </div>
          <div>
            <span>Payment Status</span>
            <strong>{data.payment_status}</strong>
          </div>
          <div>
            <span>Amount</span>
            <strong>{formatCurrency(paymentPricing.total)}</strong>
          </div>
          <div>
            <span>Payment Method</span>
            <strong>{data.payment_method}</strong>
          </div>
          <div className="full-width ticket-focus-block">
            <span>{reservationLabelTitle}</span>
            <div className="ticket-focus-content">
              {reservationItems.length ? (
                reservationItems.map((item, index) => (
                  <strong key={`${item}-${index}`} className="ticket-focus-chip">
                    {item}
                  </strong>
                ))
              ) : (
                <strong className="ticket-focus-chip">-</strong>
              )}
            </div>
          </div>
        </div>
        <div className="hero-actions">
          <button type="button" className="btn btn-outline" onClick={handleGenerateTicket} disabled={generating}>
            {generating ? 'Generating Ticket...' : 'Generate Ticket'}
          </button>
          <Link to="/my-bookings" className="btn btn-primary">
            View My Bookings
          </Link>
          <Link to="/events" className="btn btn-outline">
            Browse More Events
          </Link>
        </div>
      </div>
    </section>
  );
};

export default BookingSuccessPage;
