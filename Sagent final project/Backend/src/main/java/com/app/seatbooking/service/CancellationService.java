package com.app.seatbooking.service;

import com.app.seatbooking.dto.CancellationDto;
import com.app.seatbooking.dto.CancellationUpdateDto;
import com.app.seatbooking.entity.BookedSeat;
import com.app.seatbooking.entity.Booking;
import com.app.seatbooking.entity.Cancellation;
import com.app.seatbooking.entity.EventSchedule;
import com.app.seatbooking.entity.EventSeat;
import com.app.seatbooking.entity.Payment;
import com.app.seatbooking.entity.User;
import com.app.seatbooking.exception.ResourceNotFoundException;
import com.app.seatbooking.repository.BookedSeatRepository;
import com.app.seatbooking.repository.BookingRepository;
import com.app.seatbooking.repository.CancellationRepository;
import com.app.seatbooking.repository.EventScheduleRepository;
import com.app.seatbooking.repository.EventSeatRepository;
import com.app.seatbooking.repository.UserRepository;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CancellationService {

    private final CancellationRepository cancellationRepository;
    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final BookedSeatRepository bookedSeatRepository;
    private final EventSeatRepository eventSeatRepository;
    private final EventScheduleRepository scheduleRepository;
    private final ConcertInventoryService concertInventoryService;
    private final BookingPaymentRecordService bookingPaymentRecordService;

    public CancellationService(CancellationRepository cancellationRepository,
                                   BookingRepository bookingRepository,
                                   UserRepository userRepository,
                                   BookedSeatRepository bookedSeatRepository,
                                   EventSeatRepository eventSeatRepository,
                                   EventScheduleRepository scheduleRepository,
                                   ConcertInventoryService concertInventoryService,
                                   BookingPaymentRecordService bookingPaymentRecordService) {
        this.cancellationRepository = cancellationRepository;
        this.bookingRepository = bookingRepository;
        this.userRepository = userRepository;
        this.bookedSeatRepository = bookedSeatRepository;
        this.eventSeatRepository = eventSeatRepository;
        this.scheduleRepository = scheduleRepository;
        this.concertInventoryService = concertInventoryService;
        this.bookingPaymentRecordService = bookingPaymentRecordService;
    }

    @Transactional
    public CancellationDto createCancellation(CancellationDto request) {
        Booking booking = bookingRepository.findById(request.getBookingId())
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found: " + request.getBookingId()));
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + request.getUserId()));
        if ("CANCELLED".equalsIgnoreCase(booking.getBookingStatus())) {
            throw new IllegalArgumentException("Booking already cancelled");
        }

        booking.setBookingStatus("CANCELLED");

        List<BookedSeat> bookedSeats = bookedSeatRepository.findByBookingBookingId(booking.getBookingId());
        EventSchedule schedule = booking.getSchedule();
        if (booking.getTicketQuantity() != null && booking.getTicketQuantity() > 0) {
            concertInventoryService.restoreTickets(schedule, booking.resolveConcertTicketReferenceId(), booking.getTicketQuantity());
            if (schedule != null) {
                concertInventoryService.synchronizeScheduleAvailability(schedule);
                scheduleRepository.save(schedule);
            }
        } else {
            for (BookedSeat bookedSeat : bookedSeats) {
                EventSeat eventSeat = bookedSeat.getEventSeat();
                if (eventSeat != null) {
                    eventSeat.setSeatStatus("AVAILABLE");
                    eventSeat.setHoldToken(null);
                    eventSeat.setHoldExpiresAt(null);
                }
            }
            if (schedule != null) {
                Integer availableSeats = schedule.getAvailableSeats();
                if (availableSeats == null) {
                    availableSeats = 0;
                }
                schedule.setAvailableSeats(availableSeats + bookedSeats.size());
                scheduleRepository.save(schedule);
            }

            List<EventSeat> updatedEventSeats = bookedSeats.stream()
                    .map(BookedSeat::getEventSeat)
                    .filter(seat -> seat != null)
                    .collect(Collectors.toList());
            if (!updatedEventSeats.isEmpty()) {
                eventSeatRepository.saveAll(updatedEventSeats);
            }
        }

        String normalizedRefundStatus = normalizeRefundStatus(request.getRefundStatus());
        Payment payment = bookingPaymentRecordService.ensureCancellationPaymentRecord(
                booking,
                bookedSeats,
                resolvePaymentStatus(normalizedRefundStatus)
        );

        Cancellation cancellation = new Cancellation();
        cancellation.setBooking(booking);
        cancellation.setUser(user);
        cancellation.setCancellationReason(request.getCancellationReason());
        cancellation.setCancellationType(request.getCancellationType());
        cancellation.setRefundAmount(resolveRefundAmount(request.getRefundAmount(), payment));
        cancellation.setRefundStatus(normalizedRefundStatus);
        cancellation.setCancellationDate(LocalDateTime.now());
        Cancellation saved = cancellationRepository.save(cancellation);

        return CancellationDto.toResponse(saved);
    }

    @Transactional
    public CancellationDto updateCancellation(Long cancellationId, CancellationUpdateDto request) {
        Cancellation cancellation = cancellationRepository.findById(cancellationId)
                .orElseThrow(() -> new ResourceNotFoundException("Cancellation not found: " + cancellationId));
        String normalizedRefundStatus = normalizeRefundStatus(request.getRefundStatus());
        cancellation.setRefundStatus(normalizedRefundStatus);
        List<BookedSeat> bookedSeats = bookedSeatRepository.findByBookingBookingId(cancellation.getBooking().getBookingId());
        Payment payment = bookingPaymentRecordService.ensureCancellationPaymentRecord(
                cancellation.getBooking(),
                bookedSeats,
                resolvePaymentStatus(normalizedRefundStatus)
        );
        cancellation.setRefundAmount(resolveRefundAmount(cancellation.getRefundAmount(), payment));
        Cancellation saved = cancellationRepository.save(cancellation);
        return CancellationDto.toResponse(saved);
    }

    public CancellationDto getCancellationById(Long cancellationId) {
        Cancellation cancellation = cancellationRepository.findById(cancellationId)
                .orElseThrow(() -> new ResourceNotFoundException("Cancellation not found: " + cancellationId));
        return CancellationDto.toResponse(cancellation);
    }

    public List<CancellationDto> getAllCancellations() {
        return cancellationRepository.findAll().stream()
                .map(CancellationDto::toResponse)
                .collect(Collectors.toList());
    }

    public void deleteCancellation(Long cancellationId) {
        Cancellation cancellation = cancellationRepository.findById(cancellationId)
                .orElseThrow(() -> new ResourceNotFoundException("Cancellation not found: " + cancellationId));
        cancellationRepository.delete(cancellation);
    }

    private String normalizeRefundStatus(String refundStatus) {
        String normalized = refundStatus == null ? "" : refundStatus.trim().toUpperCase();
        return normalized.isEmpty() ? "PENDING" : normalized;
    }

    private String resolvePaymentStatus(String refundStatus) {
        return "COMPLETED".equalsIgnoreCase(refundStatus) ? "REFUNDED" : "PENDING";
    }

    private BigDecimal resolveRefundAmount(BigDecimal requestedRefundAmount, Payment payment) {
        if (requestedRefundAmount != null && requestedRefundAmount.compareTo(BigDecimal.ZERO) > 0) {
            return requestedRefundAmount;
        }

        if (payment != null && payment.getAmount() != null) {
            return payment.getAmount();
        }

        return BigDecimal.ZERO;
    }
}



