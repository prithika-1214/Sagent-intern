package com.app.seatbooking.service;

import com.app.seatbooking.domain.BookingDomainRules;
import com.app.seatbooking.dto.BookingDto;
import com.app.seatbooking.dto.BookingStatusUpdateDto;
import com.app.seatbooking.entity.BookedSeat;
import com.app.seatbooking.entity.Booking;
import com.app.seatbooking.entity.Cancellation;
import com.app.seatbooking.entity.ConcertScheduleInventory;
import com.app.seatbooking.entity.EventSchedule;
import com.app.seatbooking.entity.EventSeat;
import com.app.seatbooking.entity.Payment;
import com.app.seatbooking.entity.Seat;
import com.app.seatbooking.entity.User;
import java.math.BigDecimal;
import com.app.seatbooking.exception.ResourceNotFoundException;
import com.app.seatbooking.repository.BookedSeatRepository;
import com.app.seatbooking.repository.BookingRepository;
import com.app.seatbooking.repository.CancellationRepository;
import com.app.seatbooking.repository.EventScheduleRepository;
import com.app.seatbooking.repository.EventSeatRepository;
import com.app.seatbooking.repository.PaymentRepository;
import com.app.seatbooking.repository.SeatRepository;
import com.app.seatbooking.repository.UserRepository;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;
import org.hibernate.Hibernate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class BookingService {

    private final BookingRepository bookingRepository;
    private final BookedSeatRepository bookedSeatRepository;
    private final EventSeatRepository eventSeatRepository;
    private final EventScheduleRepository scheduleRepository;
    private final UserRepository userRepository;
    private final PaymentRepository paymentRepository;
    private final CancellationRepository cancellationRepository;
    private final SeatRepository seatRepository;
    private final ConcertInventoryService concertInventoryService;
    private final BookingPaymentRecordService bookingPaymentRecordService;

    public BookingService(BookingRepository bookingRepository,
                          BookedSeatRepository bookedSeatRepository,
                          EventSeatRepository eventSeatRepository,
                          EventScheduleRepository scheduleRepository,
                          UserRepository userRepository,
                          PaymentRepository paymentRepository,
                          CancellationRepository cancellationRepository,
                          SeatRepository seatRepository,
                          ConcertInventoryService concertInventoryService,
                          BookingPaymentRecordService bookingPaymentRecordService) {
        this.bookingRepository = bookingRepository;
        this.bookedSeatRepository = bookedSeatRepository;
        this.eventSeatRepository = eventSeatRepository;
        this.scheduleRepository = scheduleRepository;
        this.userRepository = userRepository;
        this.paymentRepository = paymentRepository;
        this.cancellationRepository = cancellationRepository;
        this.seatRepository = seatRepository;
        this.concertInventoryService = concertInventoryService;
        this.bookingPaymentRecordService = bookingPaymentRecordService;
    }

    @Transactional
    public BookingDto createBooking(BookingDto request) {
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + request.getUserId()));
        EventSchedule schedule = scheduleRepository.findById(request.getScheduleId())
                .orElseThrow(() -> new ResourceNotFoundException("Schedule not found: " + request.getScheduleId()));
        String scheduleStatus = normalizeScheduleStatus(schedule.getScheduleStatus());
        if (!"OPEN".equals(scheduleStatus)) {
            throw new IllegalArgumentException("This slot is not open for booking");
        }

        String eventCategory = schedule.getEvent() != null ? schedule.getEvent().getCategory() : null;
        if (BookingDomainRules.isConcertEvent(eventCategory)) {
            return createConcertBooking(request, user, schedule);
        }
        return createSeatBooking(request, user, schedule);
    }

    @Transactional
    public BookingDto updateBookingStatus(Long bookingId, BookingStatusUpdateDto request) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found: " + bookingId));
        String currentStatus = normalizeBookingStatus(booking.getBookingStatus());
        String requestedStatus = normalizeBookingStatus(request.getBookingStatus());
        List<BookedSeat> bookedSeats = bookedSeatRepository.findByBookingBookingId(bookingId);
        validateBookingStatusTransition(currentStatus, requestedStatus);

        if (shouldReleaseInventory(currentStatus, requestedStatus)) {
            releaseBookingInventory(booking, bookedSeats);
            syncAdminCancellationState(booking, bookedSeats);
        }

        booking.setBookingStatus(requestedStatus);
        Booking saved = bookingRepository.save(booking);
        return BookingDto.toResponse(saved, bookedSeats);
    }

    public BookingDto getBookingById(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found: " + bookingId));
        List<BookedSeat> bookedSeats = bookedSeatRepository.findByBookingBookingId(bookingId);
        return BookingDto.toResponse(booking, bookedSeats);
    }

    public List<BookingDto> getAllBookings() {
        return bookingRepository.findAll().stream()
                .map((booking) -> BookingDto.toResponse(
                        booking,
                        bookedSeatRepository.findByBookingBookingId(booking.getBookingId())
                ))
                .collect(Collectors.toList());
    }

    @Transactional
    public void deleteBooking(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found: " + bookingId));

        List<BookedSeat> bookedSeats = bookedSeatRepository.findByBookingBookingId(bookingId);
        releaseBookingInventory(booking, bookedSeats);

        cancellationRepository.deleteByBookingBookingIdIn(List.of(bookingId));
        paymentRepository.deleteByBookingBookingIdIn(List.of(bookingId));
        bookedSeatRepository.deleteByBookingBookingIdIn(List.of(bookingId));
        bookingRepository.delete(booking);
    }

    private BookingDto createSeatBooking(BookingDto request, User user, EventSchedule schedule) {
        List<Long> requestedEventSeatIds = normalizeEventSeatIds(request.getEventSeatIds());
        if (requestedEventSeatIds.isEmpty()) {
            throw new IllegalArgumentException("Seat-based bookings require at least one selected seat");
        }
        if (request.getTicketCategoryId() != null || request.getTicketQuantity() != null) {
            throw new IllegalArgumentException("Seat-based bookings must not use concert ticket category fields");
        }

        List<EventSeat> eventSeats = eventSeatRepository.findAllByEventSeatIdInForUpdate(requestedEventSeatIds);
        if (eventSeats.size() != requestedEventSeatIds.size()) {
            throw new ResourceNotFoundException("One or more event seats not found");
        }

        LocalDateTime now = LocalDateTime.now();
        boolean usesSeatHold = BookingDomainRules.text(request.getHoldToken()).length() > 0;
        validateCoupleSeatSelection(schedule, eventSeats);
        for (EventSeat eventSeat : eventSeats) {
            if (eventSeat.getSchedule() == null
                    || !Objects.equals(eventSeat.getSchedule().getScheduleId(), schedule.getScheduleId())) {
                throw new IllegalArgumentException("Event seat does not belong to the schedule");
            }

            releaseExpiredHoldIfNeeded(eventSeat, now);
            String seatStatus = normalizeSeatStatus(eventSeat.getSeatStatus());
            if (usesSeatHold) {
                if (!"HELD".equals(seatStatus) || !Objects.equals(request.getHoldToken(), eventSeat.getHoldToken())) {
                    throw new IllegalArgumentException("Seat hold expired. Please select seats again.");
                }
            } else if (!"AVAILABLE".equals(seatStatus)) {
                throw new IllegalArgumentException("One or more selected seats are not available");
            }
        }

        int requestedSeats = eventSeats.size();
        int availableSeats = schedule.getAvailableSeats() == null ? 0 : schedule.getAvailableSeats();
        if (availableSeats < requestedSeats) {
            throw new IllegalArgumentException("Not enough available seats");
        }

        Booking booking = buildBaseBooking(user, schedule);
        Booking savedBooking = bookingRepository.save(booking);

        List<BookedSeat> bookedSeats = new ArrayList<>();
        for (EventSeat eventSeat : eventSeats) {
            BookedSeat bookedSeat = new BookedSeat();
            bookedSeat.setBooking(savedBooking);
            bookedSeat.setEventSeat(eventSeat);
            bookedSeats.add(bookedSeat);
            eventSeat.setSeatStatus("BOOKED");
            clearSeatHold(eventSeat);
        }

        bookedSeatRepository.saveAll(bookedSeats);
        eventSeatRepository.saveAll(eventSeats);
        schedule.setAvailableSeats(availableSeats - requestedSeats);
        scheduleRepository.save(schedule);

        initializeBookingAssociations(savedBooking, bookedSeats);
        return BookingDto.toResponse(savedBooking, bookedSeats);
    }

    private BookingDto createConcertBooking(BookingDto request, User user, EventSchedule schedule) {
        if (!normalizeEventSeatIds(request.getEventSeatIds()).isEmpty()) {
            throw new IllegalArgumentException("Concert bookings must not use seat selection");
        }

        Long ticketCategoryId = request.getTicketCategoryId();
        int ticketQuantity = request.getTicketQuantity() == null ? 0 : request.getTicketQuantity();
        if (ticketCategoryId == null) {
            throw new IllegalArgumentException("Concert bookings require a ticket category");
        }
        if (ticketQuantity <= 0) {
            throw new IllegalArgumentException("Concert bookings require a positive ticket quantity");
        }

        ConcertScheduleInventory inventory = concertInventoryService.reserveTickets(schedule, ticketCategoryId, ticketQuantity);
        concertInventoryService.synchronizeScheduleAvailability(schedule);
        scheduleRepository.save(schedule);

        Booking booking = buildBaseBooking(user, schedule);
        booking.setTicketCategoryId(null);
        booking.setTicketSeatId(ticketCategoryId);
        booking.setTicketCategoryName(inventory.getCategoryName());
        booking.setTicketQuantity(ticketQuantity);
        booking.setTicketUnitPrice(inventory.getTicketPrice());
        Booking savedBooking = bookingRepository.save(booking);
        return BookingDto.toResponse(savedBooking, List.of());
    }

    private Booking buildBaseBooking(User user, EventSchedule schedule) {
        Booking booking = new Booking();
        booking.setUser(user);
        booking.setSchedule(schedule);
        booking.setBookingDate(LocalDateTime.now());
        booking.setBookingStatus("BOOKED");
        booking.setReminderSent(Boolean.FALSE);
        booking.setTicketCategoryId(null);
        booking.setTicketSeatId(null);
        booking.setTicketCategoryName(null);
        booking.setTicketQuantity(null);
        booking.setTicketUnitPrice(null);
        return booking;
    }

    private void initializeBookingAssociations(Booking booking, List<BookedSeat> bookedSeats) {
        Hibernate.initialize(booking.getPayments());
        if (booking.getSchedule() != null) {
            Hibernate.initialize(booking.getSchedule().getEvent());
            Hibernate.initialize(booking.getSchedule().getVenue());
        }
        for (BookedSeat bookedSeat : bookedSeats) {
            if (bookedSeat.getEventSeat() != null) {
                Hibernate.initialize(bookedSeat.getEventSeat().getSeat());
            }
        }
    }

    private List<Long> normalizeEventSeatIds(List<Long> eventSeatIds) {
        if (eventSeatIds == null) {
            return List.of();
        }
        return eventSeatIds.stream()
                .filter(Objects::nonNull)
                .distinct()
                .collect(Collectors.toList());
    }

    private void validateCoupleSeatSelection(EventSchedule schedule, List<EventSeat> selectedEventSeats) {
        if (schedule == null
                || schedule.getVenue() == null
                || schedule.getVenue().getVenueId() == null
                || selectedEventSeats == null
                || selectedEventSeats.isEmpty()) {
            return;
        }

        Map<Long, Long> couplePairMap = buildCouplePairMap(schedule);
        if (couplePairMap.isEmpty()) {
            return;
        }

        Set<Long> selectedSeatIds = selectedEventSeats.stream()
                .map(EventSeat::getSeat)
                .filter(Objects::nonNull)
                .map(Seat::getSeatId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        for (EventSeat eventSeat : selectedEventSeats) {
            Seat seat = eventSeat.getSeat();
            if (seat == null || !isCoupleSeat(seat)) {
                continue;
            }

            Long partnerSeatId = couplePairMap.get(seat.getSeatId());
            if (partnerSeatId != null && !selectedSeatIds.contains(partnerSeatId)) {
                throw new IllegalArgumentException("Couple seats must be booked as a pair");
            }
        }
    }

    private Map<Long, Long> buildCouplePairMap(EventSchedule schedule) {
        Long venueId = schedule.getVenue() != null ? schedule.getVenue().getVenueId() : null;
        if (venueId == null || BookingDomainRules.text(schedule.getAudiId()).isBlank()) {
            return Map.of();
        }

        Map<Long, Long> pairMap = new HashMap<>();
        Map<String, List<Seat>> seatsByRow = seatRepository
                .findByVenueVenueIdAndAudiIdIgnoreCaseAndConcertCategoryNameIsNull(venueId, schedule.getAudiId())
                .stream()
                .filter(this::isCoupleSeat)
                .filter((seat) -> seat.getSeatId() != null)
                .collect(Collectors.groupingBy((Seat seat) -> normalizeSeatRow(seat.getSeatRow())));

        seatsByRow.values().forEach((rowSeats) -> {
            rowSeats.sort(Comparator.comparingInt(this::extractSeatOrder));
            for (int index = 0; index + 1 < rowSeats.size(); index += 2) {
                Seat firstSeat = rowSeats.get(index);
                Seat secondSeat = rowSeats.get(index + 1);
                pairMap.put(firstSeat.getSeatId(), secondSeat.getSeatId());
                pairMap.put(secondSeat.getSeatId(), firstSeat.getSeatId());
            }
        });

        return pairMap;
    }

    private boolean isCoupleSeat(Seat seat) {
        return seat != null && "COUPLE".equalsIgnoreCase(BookingDomainRules.text(seat.getSeatType()));
    }

    private String normalizeSeatRow(String seatRow) {
        return BookingDomainRules.text(seatRow).toUpperCase();
    }

    private int extractSeatOrder(Seat seat) {
        if (seat == null || seat.getSeatNumber() == null) {
            return Integer.MAX_VALUE;
        }
        String digits = seat.getSeatNumber().replaceAll("\\D+", "");
        if (digits.isEmpty()) {
            return Integer.MAX_VALUE;
        }
        try {
            return Integer.parseInt(digits);
        } catch (NumberFormatException ex) {
            return Integer.MAX_VALUE;
        }
    }

    private boolean shouldReleaseInventory(String currentStatus, String requestedStatus) {
        return "CANCELLED".equals(requestedStatus) && !"CANCELLED".equals(currentStatus);
    }

    private void validateBookingStatusTransition(String currentStatus, String requestedStatus) {
        if ("CANCELLED".equals(currentStatus) && !"CANCELLED".equals(requestedStatus)) {
            throw new IllegalArgumentException("Cancelled bookings cannot be changed to another status");
        }
    }

    private void syncAdminCancellationState(Booking booking, List<BookedSeat> bookedSeats) {
        if (booking == null || booking.getBookingId() == null) {
            return;
        }

        Payment payment = bookingPaymentRecordService.ensureCancellationPaymentRecord(booking, bookedSeats, "REFUNDED");
        Cancellation cancellation = cancellationRepository.findByBookingBookingId(booking.getBookingId())
                .orElseGet(Cancellation::new);
        cancellation.setBooking(booking);
        cancellation.setUser(booking.getUser());
        cancellation.setCancellationReason("Booking cancelled by admin");
        cancellation.setCancellationType("ADMIN_CANCELLED");
        if (cancellation.getCancellationDate() == null) {
            cancellation.setCancellationDate(LocalDateTime.now());
        }
        cancellation.setRefundAmount(payment != null && payment.getAmount() != null ? payment.getAmount() : BigDecimal.ZERO);
        cancellation.setRefundStatus("COMPLETED");
        cancellationRepository.save(cancellation);
    }

    private String normalizeBookingStatus(String status) {
        return BookingDomainRules.text(status).toUpperCase();
    }

    private String normalizeScheduleStatus(String status) {
        String normalized = normalizeBookingStatus(status);
        return normalized.isBlank() ? "OPEN" : normalized;
    }

    private String normalizeSeatStatus(String status) {
        return normalizeBookingStatus(status);
    }

    private void releaseBookingInventory(Booking booking, List<BookedSeat> bookedSeats) {
        if (booking.getTicketQuantity() != null && booking.getTicketQuantity() > 0) {
            releaseConcertTickets(booking);
            return;
        }
        releaseBookedSeats(booking, bookedSeats);
    }

    private void releaseConcertTickets(Booking booking) {
        EventSchedule schedule = booking.getSchedule();
        if (schedule == null) {
            return;
        }

        concertInventoryService.restoreTickets(schedule, booking.resolveConcertTicketReferenceId(), booking.getTicketQuantity());
        concertInventoryService.synchronizeScheduleAvailability(schedule);
        scheduleRepository.save(schedule);
    }

    private void releaseBookedSeats(Booking booking, List<BookedSeat> bookedSeats) {
        List<EventSeat> eventSeatsToUpdate = new ArrayList<>();
        int seatsToRelease = 0;

        for (BookedSeat bookedSeat : bookedSeats) {
            EventSeat eventSeat = bookedSeat.getEventSeat();
            if (eventSeat == null) {
                continue;
            }
            if ("AVAILABLE".equalsIgnoreCase(eventSeat.getSeatStatus())) {
                continue;
            }
            eventSeat.setSeatStatus("AVAILABLE");
            clearSeatHold(eventSeat);
            eventSeatsToUpdate.add(eventSeat);
            seatsToRelease++;
        }

        if (!eventSeatsToUpdate.isEmpty()) {
            eventSeatRepository.saveAll(eventSeatsToUpdate);
        }

        EventSchedule schedule = booking.getSchedule();
        if (schedule != null && seatsToRelease > 0) {
            int availableSeats = schedule.getAvailableSeats() == null ? 0 : schedule.getAvailableSeats();
            schedule.setAvailableSeats(availableSeats + seatsToRelease);
            scheduleRepository.save(schedule);
        }
    }

    private void releaseExpiredHoldIfNeeded(EventSeat eventSeat, LocalDateTime now) {
        if (eventSeat == null || !"HELD".equals(normalizeSeatStatus(eventSeat.getSeatStatus()))) {
            return;
        }

        LocalDateTime holdExpiresAt = eventSeat.getHoldExpiresAt();
        if (holdExpiresAt != null && holdExpiresAt.isAfter(now)) {
            return;
        }

        eventSeat.setSeatStatus("AVAILABLE");
        clearSeatHold(eventSeat);
    }

    private void clearSeatHold(EventSeat eventSeat) {
        eventSeat.setHoldToken(null);
        eventSeat.setHoldExpiresAt(null);
    }
}
