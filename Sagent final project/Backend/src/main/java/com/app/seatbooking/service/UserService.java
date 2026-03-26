package com.app.seatbooking.service;

import com.app.seatbooking.entity.BookedSeat;
import com.app.seatbooking.entity.Booking;
import com.app.seatbooking.entity.EventSchedule;
import com.app.seatbooking.entity.EventSeat;
import com.app.seatbooking.dto.UserDto;
import com.app.seatbooking.entity.User;
import com.app.seatbooking.exception.DuplicateResourceException;
import com.app.seatbooking.exception.ResourceNotFoundException;
import com.app.seatbooking.repository.BookedSeatRepository;
import com.app.seatbooking.repository.BookingRepository;
import com.app.seatbooking.repository.CancellationRepository;
import com.app.seatbooking.repository.EventScheduleRepository;
import com.app.seatbooking.repository.EventSeatRepository;
import com.app.seatbooking.repository.PaymentRepository;
import com.app.seatbooking.repository.UserOtpRepository;
import com.app.seatbooking.repository.UserRepository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final BookingRepository bookingRepository;
    private final BookedSeatRepository bookedSeatRepository;
    private final EventSeatRepository eventSeatRepository;
    private final EventScheduleRepository scheduleRepository;
    private final PaymentRepository paymentRepository;
    private final CancellationRepository cancellationRepository;
    private final UserOtpRepository userOtpRepository;
    private final ConcertInventoryService concertInventoryService;

    public UserService(UserRepository userRepository,
                           BookingRepository bookingRepository,
                           BookedSeatRepository bookedSeatRepository,
                           EventSeatRepository eventSeatRepository,
                           EventScheduleRepository scheduleRepository,
                           PaymentRepository paymentRepository,
                           CancellationRepository cancellationRepository,
                           UserOtpRepository userOtpRepository,
                           ConcertInventoryService concertInventoryService) {
        this.userRepository = userRepository;
        this.bookingRepository = bookingRepository;
        this.bookedSeatRepository = bookedSeatRepository;
        this.eventSeatRepository = eventSeatRepository;
        this.scheduleRepository = scheduleRepository;
        this.paymentRepository = paymentRepository;
        this.cancellationRepository = cancellationRepository;
        this.userOtpRepository = userOtpRepository;
        this.concertInventoryService = concertInventoryService;
    }

    public UserDto createUser(UserDto request) {
        if (request.getPassword() == null || request.getPassword().isBlank()) {
            throw new IllegalArgumentException("Password is required");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("Email already exists");
        }
        if (userRepository.existsByMobileNumber(request.getMobileNumber())) {
            throw new DuplicateResourceException("Mobile number already exists");
        }
        User user = UserDto.toEntity(request);
        user.setCreatedAt(LocalDateTime.now());
        User saved = userRepository.save(user);
        return UserDto.toResponse(saved);
    }

    public UserDto updateUser(Long userId, UserDto request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));
        if (!user.getEmail().equals(request.getEmail()) && userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("Email already exists");
        }
        if (!Objects.equals(user.getMobileNumber(), request.getMobileNumber())
                && userRepository.existsByMobileNumber(request.getMobileNumber())) {
            throw new DuplicateResourceException("Mobile number already exists");
        }
        UserDto.updateEntity(user, request);
        User saved = userRepository.save(user);
        return UserDto.toResponse(saved);
    }

    public UserDto getUserById(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));
        return UserDto.toResponse(user);
    }

    public List<UserDto> getAllUsers() {
        return userRepository.findAll().stream()
                .map(UserDto::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public void deleteUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));

        List<Booking> bookings = bookingRepository.findByUserUserId(userId);
        if (!bookings.isEmpty()) {
            List<Long> bookingIds = bookings.stream()
                    .map(Booking::getBookingId)
                    .collect(Collectors.toList());

            Map<Long, List<BookedSeat>> bookedSeatsByBookingId = bookedSeatRepository.findByBookingBookingIdIn(bookingIds).stream()
                    .filter(bookedSeat -> bookedSeat.getBooking() != null && bookedSeat.getBooking().getBookingId() != null)
                    .collect(Collectors.groupingBy((bookedSeat) -> bookedSeat.getBooking().getBookingId()));

            for (Booking booking : bookings) {
                if (isCancelledBooking(booking)) {
                    continue;
                }

                releaseBookingInventory(
                        booking,
                        bookedSeatsByBookingId.getOrDefault(booking.getBookingId(), List.of())
                );
            }

            cancellationRepository.deleteByBookingBookingIdIn(bookingIds);
            paymentRepository.deleteByBookingBookingIdIn(bookingIds);
            bookedSeatRepository.deleteByBookingBookingIdIn(bookingIds);
            bookingRepository.deleteAll(bookings);
        }

        cancellationRepository.deleteByUserUserId(userId);
        userOtpRepository.deleteByUserUserId(userId);
        userRepository.delete(user);
    }

    private boolean isCancelledBooking(Booking booking) {
        return booking != null && "CANCELLED".equalsIgnoreCase(booking.getBookingStatus());
    }

    private void releaseBookingInventory(Booking booking, List<BookedSeat> bookedSeats) {
        if (booking == null) {
            return;
        }

        Integer ticketQuantity = booking.getTicketQuantity();
        if (ticketQuantity != null && ticketQuantity > 0) {
            releaseConcertTickets(booking, ticketQuantity);
            return;
        }

        releaseBookedSeats(booking, bookedSeats);
    }

    private void releaseConcertTickets(Booking booking, int ticketQuantity) {
        EventSchedule schedule = booking.getSchedule();
        if (schedule == null) {
            return;
        }

        concertInventoryService.restoreTickets(schedule, booking.resolveConcertTicketReferenceId(), ticketQuantity);
        concertInventoryService.synchronizeScheduleAvailability(schedule);
        scheduleRepository.save(schedule);
    }

    private void releaseBookedSeats(Booking booking, List<BookedSeat> bookedSeats) {
        List<EventSeat> eventSeatsToUpdate = bookedSeats.stream()
                .map(BookedSeat::getEventSeat)
                .filter(Objects::nonNull)
                .filter((eventSeat) -> !"AVAILABLE".equalsIgnoreCase(eventSeat.getSeatStatus()))
                .peek((eventSeat) -> {
                    eventSeat.setSeatStatus("AVAILABLE");
                    eventSeat.setHoldToken(null);
                    eventSeat.setHoldExpiresAt(null);
                })
                .collect(Collectors.toList());

        if (!eventSeatsToUpdate.isEmpty()) {
            eventSeatRepository.saveAll(eventSeatsToUpdate);
        }

        EventSchedule schedule = booking.getSchedule();
        if (schedule == null || eventSeatsToUpdate.isEmpty()) {
            return;
        }

        Integer availableSeats = schedule.getAvailableSeats();
        schedule.setAvailableSeats((availableSeats == null ? 0 : availableSeats) + eventSeatsToUpdate.size());
        scheduleRepository.save(schedule);
    }
}



