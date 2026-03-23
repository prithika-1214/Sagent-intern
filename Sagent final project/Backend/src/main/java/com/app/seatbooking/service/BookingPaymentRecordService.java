package com.app.seatbooking.service;

import com.app.seatbooking.entity.BookedSeat;
import com.app.seatbooking.entity.Booking;
import com.app.seatbooking.entity.EventSeat;
import com.app.seatbooking.entity.Payment;
import com.app.seatbooking.repository.PaymentRepository;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import org.springframework.stereotype.Service;

@Service
public class BookingPaymentRecordService {

    private static final BigDecimal ZERO_AMOUNT = BigDecimal.ZERO;
    private static final BigDecimal DEFAULT_GST_PERCENTAGE = BigDecimal.valueOf(18);

    private final PaymentRepository paymentRepository;

    public BookingPaymentRecordService(PaymentRepository paymentRepository) {
        this.paymentRepository = paymentRepository;
    }

    public Payment ensureCancellationPaymentRecord(Booking booking, List<BookedSeat> bookedSeats, String paymentStatus) {
        if (booking == null || booking.getBookingId() == null) {
            return null;
        }

        Payment payment = paymentRepository.findByBookingBookingId(booking.getBookingId()).orElseGet(Payment::new);
        payment.setBooking(booking);

        if (!hasText(payment.getPaymentMethod())) {
            payment.setPaymentMethod("SYSTEM");
        }
        if (payment.getPaymentDate() == null) {
            payment.setPaymentDate(resolvePaymentDate(booking));
        }
        if (payment.getAmount() == null) {
            payment.setAmount(resolvePaymentAmount(booking, bookedSeats));
        }
        if (payment.getDiscountAmount() == null) {
            payment.setDiscountAmount(ZERO_AMOUNT);
        }
        if (payment.getConvenienceFee() == null) {
            payment.setConvenienceFee(ZERO_AMOUNT);
        }
        if (payment.getGstPercentage() == null) {
            payment.setGstPercentage(DEFAULT_GST_PERCENTAGE);
        }
        if (payment.getGstAmount() == null) {
            payment.setGstAmount(ZERO_AMOUNT);
        }

        payment.setPaymentStatus(normalizePaymentStatus(paymentStatus));

        if (!hasText(payment.getTransactionId())) {
            payment.setTransactionId(buildFallbackTransactionId(booking.getBookingId()));
        }

        return paymentRepository.save(payment);
    }

    private BigDecimal resolvePaymentAmount(Booking booking, List<BookedSeat> bookedSeats) {
        if (booking == null) {
            return ZERO_AMOUNT;
        }

        Integer ticketQuantity = booking.getTicketQuantity();
        if (ticketQuantity != null && ticketQuantity > 0 && booking.getTicketUnitPrice() != null) {
            return booking.getTicketUnitPrice().multiply(BigDecimal.valueOf(ticketQuantity.longValue()));
        }

        if (bookedSeats == null || bookedSeats.isEmpty()) {
            return ZERO_AMOUNT;
        }

        return bookedSeats.stream()
                .map(BookedSeat::getEventSeat)
                .filter(Objects::nonNull)
                .map(EventSeat::getSeatPrice)
                .filter(Objects::nonNull)
                .reduce(ZERO_AMOUNT, BigDecimal::add);
    }

    private LocalDateTime resolvePaymentDate(Booking booking) {
        if (booking != null && booking.getBookingDate() != null) {
            return booking.getBookingDate();
        }
        return LocalDateTime.now();
    }

    private String buildFallbackTransactionId(Long bookingId) {
        String baseTransactionId = "AUTO_CANCELLED_" + bookingId;
        if (!paymentRepository.existsByTransactionId(baseTransactionId)) {
            return baseTransactionId;
        }

        return baseTransactionId + "_" + System.currentTimeMillis();
    }

    private String normalizePaymentStatus(String paymentStatus) {
        String normalized = paymentStatus == null ? "" : paymentStatus.trim().toUpperCase();
        return normalized.isEmpty() ? "PENDING" : normalized;
    }

    private boolean hasText(String value) {
        return value != null && !value.trim().isEmpty();
    }
}
