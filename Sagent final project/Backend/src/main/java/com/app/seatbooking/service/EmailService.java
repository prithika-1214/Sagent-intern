package com.app.seatbooking.service;

import com.app.seatbooking.entity.BookedSeat;
import com.app.seatbooking.entity.Booking;
import com.app.seatbooking.entity.Event;
import com.app.seatbooking.entity.EventSchedule;
import com.app.seatbooking.entity.EventSeat;
import com.app.seatbooking.entity.Payment;
import com.app.seatbooking.entity.Seat;
import com.app.seatbooking.entity.User;
import com.app.seatbooking.entity.Venue;
import jakarta.mail.internet.MimeMessage;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);
    private static final String FROM_EMAIL = "seatbookingapp@gmail.com";
    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd MMM yyyy");
    private static final DateTimeFormatter TIME_FMT = DateTimeFormatter.ofPattern("hh:mm a");
    private static final DateTimeFormatter DATETIME_FMT = DateTimeFormatter.ofPattern("dd MMM yyyy, hh:mm a");

    private final JavaMailSender mailSender;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    /**
     * Sends a booking confirmation email asynchronously so it doesn't block the API response.
     */
    @Async
    public void sendBookingConfirmationEmail(Booking booking, List<BookedSeat> bookedSeats) {
        User user = booking.getUser();
        if (user == null || user.getEmail() == null || user.getEmail().isBlank()) {
            log.warn("Cannot send confirmation email — user or user email is null for booking {}", booking.getBookingId());
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(FROM_EMAIL);
            helper.setTo(user.getEmail());
            helper.setSubject("🎫 Booking Confirmed — #" + booking.getBookingId());
            helper.setText(buildHtmlContent(booking, bookedSeats), true);
            mailSender.send(message);
            log.info("Booking confirmation email sent to {} for booking #{}", user.getEmail(), booking.getBookingId());
        } catch (Exception e) {
            log.error("Failed to send booking confirmation email for booking #{}: {}", booking.getBookingId(), e.getMessage(), e);
        }
    }

    // ────────────────────────────────────────────────────────────────────────────
    //  HTML template builder
    // ────────────────────────────────────────────────────────────────────────────

    private String buildHtmlContent(Booking booking, List<BookedSeat> bookedSeats) {
        User user = booking.getUser();
        EventSchedule schedule = booking.getSchedule();
        Event event = schedule != null ? schedule.getEvent() : null;
        Venue venue = schedule != null ? schedule.getVenue() : null;
        List<Payment> payments = booking.getPayments();

        StringBuilder html = new StringBuilder();

        // ── opening + styles ──
        html.append("<!DOCTYPE html>")
            .append("<html lang='en'><head><meta charset='UTF-8'/>")
            .append("<meta name='viewport' content='width=device-width,initial-scale=1.0'/>")
            .append("<title>Booking Confirmation</title>")
            .append("<style>")
            .append("body{margin:0;padding:0;background:#f4f6f9;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;}")
            .append(".wrapper{max-width:600px;margin:30px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08);}")
            .append(".header{background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;padding:32px 28px;text-align:center;}")
            .append(".header h1{margin:0;font-size:24px;font-weight:700;letter-spacing:.5px;}")
            .append(".header p{margin:8px 0 0;font-size:14px;opacity:.9;}")
            .append(".badge{display:inline-block;margin-top:14px;background:rgba(255,255,255,.2);color:#fff;padding:6px 16px;border-radius:30px;font-size:13px;font-weight:600;letter-spacing:.5px;}")
            .append(".content{padding:28px;}")
            .append(".section-title{font-size:15px;font-weight:700;color:#6366f1;text-transform:uppercase;letter-spacing:1px;margin:24px 0 10px;border-bottom:2px solid #e5e7eb;padding-bottom:6px;}")
            .append(".info-table{width:100%;border-collapse:collapse;margin-bottom:10px;}")
            .append(".info-table td{padding:8px 4px;font-size:14px;color:#374151;vertical-align:top;}")
            .append(".info-table td:first-child{font-weight:600;color:#4b5563;width:40%;}")
            .append(".seat-list{margin:6px 0 0;padding:0;list-style:none;}")
            .append(".seat-list li{display:inline-block;background:#ede9fe;color:#6366f1;padding:5px 12px;border-radius:6px;font-size:13px;font-weight:600;margin:3px 4px 3px 0;}")
            .append(".total-row{background:#f9fafb;border-radius:8px;padding:14px 16px;margin-top:12px;font-size:16px;font-weight:700;color:#111827;}")
            .append(".footer{text-align:center;padding:20px 28px;font-size:12px;color:#9ca3af;background:#f9fafb;}")
            .append(".footer a{color:#6366f1;text-decoration:none;}")
            .append("</style></head><body><div class='wrapper'>");

        // ── header section ──
        html.append("<div class='header'>")
            .append("<h1>🎉 Booking Confirmed!</h1>")
            .append("<p>Thank you for your booking. Here are your details.</p>")
            .append("<span class='badge'>Booking #").append(booking.getBookingId()).append("</span>")
            .append("</div>");

        // ── content section ──
        html.append("<div class='content'>");

        // ── USER DETAILS ──
        html.append("<div class='section-title'>👤 User Details</div>");
        html.append("<table class='info-table'>");
        html.append(row("Name", safe(user.getUserName())));
        html.append(row("Email", safe(user.getEmail())));
        html.append(row("Mobile", user.getMobileNumber() != null ? String.valueOf(user.getMobileNumber()) : "—"));
        html.append("</table>");

        // ── EVENT DETAILS ──
        html.append("<div class='section-title'>🎬 Event Details</div>");
        html.append("<table class='info-table'>");
        if (event != null) {
            html.append(row("Event", safe(event.getEventName())));
            html.append(row("Category", safe(event.getCategory())));
            html.append(row("Genre", safe(event.getGenre())));
            html.append(row("Language", safe(event.getLanguage())));
            html.append(row("Duration", event.getDuration() != null ? event.getDuration() + " hrs" : "—"));
        }
        if (venue != null) {
            html.append(row("Venue", safe(venue.getVenueName())));
            html.append(row("Address", safe(venue.getAddress()) + ", " + safe(venue.getCity()) + ", " + safe(venue.getState())));
        }
        if (schedule != null) {
            html.append(row("Audi / Screen", safe(schedule.getAudiName())));
            html.append(row("Show Date", schedule.getShowDate() != null ? schedule.getShowDate().format(DATE_FMT) : "—"));
            html.append(row("Show Time", schedule.getShowTime() != null ? schedule.getShowTime().format(TIME_FMT) : "—"));
        }
        html.append("</table>");

        // ── BOOKING DETAILS ──
        html.append("<div class='section-title'>📋 Booking Details</div>");
        html.append("<table class='info-table'>");
        html.append(row("Booking ID", "#" + booking.getBookingId()));
        html.append(row("Booking Date", booking.getBookingDate() != null ? booking.getBookingDate().format(DATETIME_FMT) : "—"));
        html.append(row("Status", safe(booking.getBookingStatus())));
        int reservationCount = booking.getTicketQuantity() != null && booking.getTicketQuantity() > 0
                ? booking.getTicketQuantity()
                : bookedSeats.size();
        html.append(row(
                booking.getTicketQuantity() != null && booking.getTicketQuantity() > 0 ? "Number of Tickets" : "Number of Seats",
                String.valueOf(reservationCount)
        ));
        html.append("</table>");

        // ── SEAT INFO ──
        if (booking.getTicketQuantity() != null && booking.getTicketQuantity() > 0) {
            html.append("<table class='info-table'>");
            html.append(row("Tickets", safe(booking.getTicketCategoryName()) + " x " + booking.getTicketQuantity()));
            html.append("</table>");
        } else if (!bookedSeats.isEmpty()) {
            String seatLabels = bookedSeats.stream()
                    .map(bs -> {
                        EventSeat es = bs.getEventSeat();
                        if (es == null || es.getSeat() == null) return "—";
                        Seat seat = es.getSeat();
                        return safe(seat.getSeatRow()) + " - " + safe(seat.getSeatNumber());
                    })
                    .map(label -> "<li>" + label + "</li>")
                    .collect(Collectors.joining());

            html.append("<table class='info-table'><tr><td>Seats</td><td><ul class='seat-list'>")
                .append(seatLabels)
                .append("</ul></td></tr></table>");
        }

        // ── PAYMENT DETAILS ──
        html.append("<div class='section-title'>💳 Payment Details</div>");
        if (payments != null && !payments.isEmpty()) {
            BigDecimal totalPaid = BigDecimal.ZERO;
            for (Payment payment : payments) {
                html.append("<table class='info-table'>");
                html.append(row("Transaction ID", safe(payment.getTransactionId())));
                html.append(row("Payment Method", safe(payment.getPaymentMethod())));
                html.append(row("Amount", "₹ " + formatAmount(payment.getAmount())));
                if (payment.getDiscountAmount() != null && payment.getDiscountAmount().compareTo(BigDecimal.ZERO) > 0) {
                    html.append(row("Discount", "- ₹ " + formatAmount(payment.getDiscountAmount())));
                }
                html.append(row("Payment Date", payment.getPaymentDate() != null ? payment.getPaymentDate().format(DATETIME_FMT) : "—"));
                html.append(row("Payment Status", safe(payment.getPaymentStatus())));
                html.append("</table>");
                if (payment.getAmount() != null) {
                    totalPaid = totalPaid.add(payment.getAmount());
                    if (payment.getDiscountAmount() != null) {
                        totalPaid = totalPaid.subtract(payment.getDiscountAmount());
                    }
                }
            }
            html.append("<div class='total-row'>Total Amount Paid - ₹ ")
                .append(formatAmount(totalPaid))
                .append("</div>");
        } else {
            html.append("<table class='info-table'>");
            html.append(row("Status", "Payment pending"));
            html.append(row("Total Amount Paid", "₹ " + formatAmount(BigDecimal.ZERO)));
            html.append("</table>");
        }

        html.append("</div>"); // content

        // ── footer ──
        html.append("<div class='footer'>")
            .append("<p>This is an auto-generated email. Please do not reply.</p>")
            .append("<p>&copy; 2026 Seat Booking App. All rights reserved.</p>")
            .append("</div>");

        html.append("</div></body></html>");
        return html.toString();
    }

    // ── helper ──
    private String row(String label, String value) {
        return "<tr><td>" + label + "</td><td>" + value + "</td></tr>";
    }

    private String safe(String value) {
        return value != null && !value.isBlank() ? value : "—";
    }

    private String formatAmount(BigDecimal amount) {
        return (amount == null ? BigDecimal.ZERO : amount).setScale(2, RoundingMode.HALF_UP).toPlainString();
    }
}
