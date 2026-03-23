package com.app.seatbooking.service;

import com.app.seatbooking.dto.PaymentDto;
import com.app.seatbooking.entity.BookedSeat;
import com.app.seatbooking.entity.Booking;
import com.app.seatbooking.entity.Payment;
import com.app.seatbooking.exception.DuplicateResourceException;
import com.app.seatbooking.exception.ResourceNotFoundException;
import com.app.seatbooking.repository.BookedSeatRepository;
import com.app.seatbooking.repository.BookingRepository;
import com.app.seatbooking.repository.PaymentRepository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;
import org.hibernate.Hibernate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final BookingRepository bookingRepository;
    private final BookedSeatRepository bookedSeatRepository;
    private final EmailService emailService;

    public PaymentService(PaymentRepository paymentRepository,
                          BookingRepository bookingRepository,
                          BookedSeatRepository bookedSeatRepository,
                          EmailService emailService) {
        this.paymentRepository = paymentRepository;
        this.bookingRepository = bookingRepository;
        this.bookedSeatRepository = bookedSeatRepository;
        this.emailService = emailService;
    }

    @Transactional
    public PaymentDto createPayment(PaymentDto request) {
        if (paymentRepository.existsByTransactionId(request.getTransactionId())) {
            throw new DuplicateResourceException("Transaction ID already exists");
        }
        Booking booking = bookingRepository.findById(request.getBookingId())
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found: " + request.getBookingId()));
        Payment payment = PaymentDto.toEntity(request, booking);
        payment.setPaymentDate(LocalDateTime.now());
        Payment saved = paymentRepository.save(payment);
        confirmBookingIfEligible(booking, saved);
        return PaymentDto.toResponse(saved);
    }

    @Transactional
    public PaymentDto updatePayment(Long paymentId, PaymentDto request) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found: " + paymentId));
        if (!payment.getTransactionId().equals(request.getTransactionId())
                && paymentRepository.existsByTransactionId(request.getTransactionId())) {
            throw new DuplicateResourceException("Transaction ID already exists");
        }
        Booking booking = bookingRepository.findById(request.getBookingId())
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found: " + request.getBookingId()));
        payment.setBooking(booking);
        payment.setPaymentMethod(request.getPaymentMethod());
        payment.setAmount(request.getAmount());
        payment.setDiscountAmount(request.getDiscountAmount());
        payment.setConvenienceFee(request.getConvenienceFee());
        payment.setGstPercentage(request.getGstPercentage());
        payment.setGstAmount(request.getGstAmount());
        payment.setPaymentStatus(request.getPaymentStatus());
        payment.setTransactionId(request.getTransactionId());
        payment.setPaymentDate(LocalDateTime.now());
        Payment saved = paymentRepository.save(payment);
        confirmBookingIfEligible(booking, saved);
        return PaymentDto.toResponse(saved);
    }

    public PaymentDto getPaymentById(Long paymentId) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found: " + paymentId));
        return PaymentDto.toResponse(payment);
    }

    public List<PaymentDto> getAllPayments() {
        return paymentRepository.findAll().stream()
                .map(PaymentDto::toResponse)
                .collect(Collectors.toList());
    }

    public void deletePayment(Long paymentId) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found: " + paymentId));
        paymentRepository.delete(payment);
    }

    private void confirmBookingIfEligible(Booking booking, Payment payment) {
        if (!isStatusMatch(payment.getPaymentStatus(), "SUCCESS")) {
            return;
        }

        if (isStatusMatch(booking.getBookingStatus(), "CANCELLED")) {
            return;
        }

        boolean shouldSendConfirmationEmail = !isStatusMatch(booking.getBookingStatus(), "CONFIRMED");
        if (shouldSendConfirmationEmail) {
            booking.setBookingStatus("CONFIRMED");
            bookingRepository.save(booking);
            sendConfirmationEmail(booking);
        }
    }

    private void sendConfirmationEmail(Booking booking) {
        List<BookedSeat> bookedSeats = bookedSeatRepository.findByBookingBookingId(booking.getBookingId());
        if (booking.getSchedule() != null) {
            Hibernate.initialize(booking.getSchedule().getEvent());
            Hibernate.initialize(booking.getSchedule().getVenue());
        }
        Hibernate.initialize(booking.getPayments());
        for (BookedSeat bookedSeat : bookedSeats) {
            if (bookedSeat.getEventSeat() != null) {
                Hibernate.initialize(bookedSeat.getEventSeat().getSeat());
            }
        }
        emailService.sendBookingConfirmationEmail(booking, bookedSeats);
    }

    private boolean isStatusMatch(String status, String expected) {
        if (status == null || expected == null) {
            return false;
        }
        return expected.equalsIgnoreCase(status.trim());
    }
}



