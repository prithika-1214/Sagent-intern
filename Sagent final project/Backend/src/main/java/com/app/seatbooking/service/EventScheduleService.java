package com.app.seatbooking.service;

import com.app.seatbooking.domain.BookingDomainRules;
import com.app.seatbooking.dto.EventScheduleDto;
import com.app.seatbooking.entity.BookedSeat;
import com.app.seatbooking.entity.Booking;
import com.app.seatbooking.entity.Cancellation;
import com.app.seatbooking.entity.Event;
import com.app.seatbooking.entity.EventSchedule;
import com.app.seatbooking.entity.EventSeat;
import com.app.seatbooking.entity.Payment;
import com.app.seatbooking.entity.Seat;
import com.app.seatbooking.entity.Venue;
import com.app.seatbooking.exception.ResourceNotFoundException;
import com.app.seatbooking.repository.BookedSeatRepository;
import com.app.seatbooking.repository.BookingRepository;
import com.app.seatbooking.repository.CancellationRepository;
import com.app.seatbooking.repository.EventRepository;
import com.app.seatbooking.repository.EventScheduleRepository;
import com.app.seatbooking.repository.EventSeatRepository;
import com.app.seatbooking.repository.PaymentRepository;
import com.app.seatbooking.repository.SeatRepository;
import com.app.seatbooking.repository.VenueRepository;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class EventScheduleService {

    private final EventScheduleRepository scheduleRepository;
    private final EventRepository eventRepository;
    private final VenueRepository venueRepository;
    private final BookingRepository bookingRepository;
    private final BookedSeatRepository bookedSeatRepository;
    private final PaymentRepository paymentRepository;
    private final CancellationRepository cancellationRepository;
    private final EventSeatRepository eventSeatRepository;
    private final SeatRepository seatRepository;
    private final ConcertInventoryService concertInventoryService;
    private final BookingPaymentRecordService bookingPaymentRecordService;

    public EventScheduleService(EventScheduleRepository scheduleRepository,
                                EventRepository eventRepository,
                                VenueRepository venueRepository,
                                BookingRepository bookingRepository,
                                BookedSeatRepository bookedSeatRepository,
                                PaymentRepository paymentRepository,
                                CancellationRepository cancellationRepository,
                                EventSeatRepository eventSeatRepository,
                                SeatRepository seatRepository,
                                ConcertInventoryService concertInventoryService,
                                BookingPaymentRecordService bookingPaymentRecordService) {
        this.scheduleRepository = scheduleRepository;
        this.eventRepository = eventRepository;
        this.venueRepository = venueRepository;
        this.bookingRepository = bookingRepository;
        this.bookedSeatRepository = bookedSeatRepository;
        this.paymentRepository = paymentRepository;
        this.cancellationRepository = cancellationRepository;
        this.eventSeatRepository = eventSeatRepository;
        this.seatRepository = seatRepository;
        this.concertInventoryService = concertInventoryService;
        this.bookingPaymentRecordService = bookingPaymentRecordService;
    }

    @Transactional
    public EventScheduleDto createSchedule(EventScheduleDto request) {
        Event event = eventRepository.findById(request.getEventId())
                .orElseThrow(() -> new ResourceNotFoundException("Event not found: " + request.getEventId()));
        Venue venue = venueRepository.findById(request.getVenueId())
                .orElseThrow(() -> new ResourceNotFoundException("Venue not found: " + request.getVenueId()));

        event.setCategory(BookingDomainRules.normalizeEventCategory(event.getCategory()));
        venue.setVenueType(BookingDomainRules.normalizeVenueType(venue.getVenueType()));

        EventScheduleDto normalizedRequest = normalizeRequest(request, event, venue);
        validateScheduleRequest(normalizedRequest, event, venue, null);

        EventSchedule schedule = EventScheduleDto.toEntity(normalizedRequest, event, venue);
        schedule.setAvailableSeats(resolveInitialAvailability(event, venue, schedule.getAudiId()));
        EventSchedule saved = scheduleRepository.save(schedule);

        if (BookingDomainRules.isConcertEvent(event.getCategory())) {
            concertInventoryService.synchronizeScheduleAvailability(saved);
            saved = scheduleRepository.save(saved);
        }

        return EventScheduleDto.toResponse(saved);
    }

    @Transactional
    public EventScheduleDto updateSchedule(Long scheduleId, EventScheduleDto request) {
        EventSchedule schedule = scheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new ResourceNotFoundException("Schedule not found: " + scheduleId));
        Event event = eventRepository.findById(request.getEventId())
                .orElseThrow(() -> new ResourceNotFoundException("Event not found: " + request.getEventId()));
        Venue venue = venueRepository.findById(request.getVenueId())
                .orElseThrow(() -> new ResourceNotFoundException("Venue not found: " + request.getVenueId()));

        event.setCategory(BookingDomainRules.normalizeEventCategory(event.getCategory()));
        venue.setVenueType(BookingDomainRules.normalizeVenueType(venue.getVenueType()));

        EventScheduleDto normalizedRequest = normalizeRequest(request, event, venue);
        validateScheduleRequest(normalizedRequest, event, venue, scheduleId);
        validateMutableFieldsForBookedSchedule(schedule, normalizedRequest);

        String currentStatus = normalizeScheduleStatus(schedule.getScheduleStatus());
        String requestedStatus = normalizeScheduleStatus(normalizedRequest.getScheduleStatus());
        boolean concertSchedule = BookingDomainRules.isConcertEvent(event.getCategory());
        boolean inventoryNeedsRebuild = concertSchedule && venueChanged(schedule, venue);

        EventScheduleDto.updateEntity(schedule, normalizedRequest, event, venue);

        if (shouldCascadeScheduleCancellation(currentStatus, requestedStatus)) {
            cancelScheduleBookings(schedule);
        }

        if (inventoryNeedsRebuild) {
            concertInventoryService.deleteByScheduleId(scheduleId);
        }

        if (concertSchedule) {
            concertInventoryService.synchronizeScheduleAvailability(schedule);
        } else {
            schedule.setAvailableSeats(resolveSeatBasedAvailability(schedule));
        }

        EventSchedule saved = scheduleRepository.save(schedule);
        return EventScheduleDto.toResponse(saved);
    }

    @Transactional(readOnly = true)
    public EventScheduleDto getScheduleById(Long scheduleId) {
        EventSchedule schedule = scheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new ResourceNotFoundException("Schedule not found: " + scheduleId));
        return EventScheduleDto.toResponse(schedule);
    }

    @Transactional(readOnly = true)
    public List<EventScheduleDto> getAllSchedules() {
        return scheduleRepository.findAll().stream()
                .map(EventScheduleDto::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<EventScheduleDto> getSchedulesByEventId(Long eventId) {
        return scheduleRepository.findByEventEventId(eventId).stream()
                .map(EventScheduleDto::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public void deleteSchedule(Long scheduleId) {
        EventSchedule schedule = scheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new ResourceNotFoundException("Schedule not found: " + scheduleId));

        List<Long> bookingIds = bookingRepository.findByScheduleScheduleIdIn(List.of(scheduleId)).stream()
                .map(Booking::getBookingId)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());

        if (!bookingIds.isEmpty()) {
            cancellationRepository.deleteByBookingBookingIdIn(bookingIds);
            paymentRepository.deleteByBookingBookingIdIn(bookingIds);
            bookedSeatRepository.deleteByBookingBookingIdIn(bookingIds);
            bookingRepository.deleteAllById(bookingIds);
        }

        List<EventSeat> eventSeats = eventSeatRepository.findByScheduleScheduleId(scheduleId);
        if (!eventSeats.isEmpty()) {
            List<Long> eventSeatIds = eventSeats.stream()
                    .map(EventSeat::getEventSeatId)
                    .filter(Objects::nonNull)
                    .collect(Collectors.toList());
            if (!eventSeatIds.isEmpty()) {
                bookedSeatRepository.deleteByEventSeatEventSeatIdIn(eventSeatIds);
            }
            eventSeatRepository.deleteAll(eventSeats);
        }

        concertInventoryService.deleteByScheduleId(scheduleId);
        scheduleRepository.delete(schedule);
    }

    private EventScheduleDto normalizeRequest(EventScheduleDto request, Event event, Venue venue) {
        String eventCategory = BookingDomainRules.normalizeEventCategory(event.getCategory());
        String venueType = BookingDomainRules.normalizeVenueType(venue.getVenueType());
        if (!BookingDomainRules.isVenueCompatible(eventCategory, venueType)) {
            throw new IllegalArgumentException(
                    String.format("%s events can only be scheduled in %s", eventCategory, BookingDomainRules.requiredVenueTypeForEvent(eventCategory))
            );
        }

        String audiId = null;
        String audiName = null;
        if (BookingDomainRules.requiresAudi(eventCategory)) {
            audiId = BookingDomainRules.normalizeAudiId(request.getAudiId(), request.getAudiName());
            audiName = BookingDomainRules.normalizeAudiName(request.getAudiName(), audiId);
        } else {
            audiName = BookingDomainRules.text(request.getAudiName());
            if (audiName.isBlank()) {
                audiName = "Open Ground";
            }
        }

        return new EventScheduleDto(
                request.getScheduleId(),
                request.getEventId(),
                request.getVenueId(),
                audiId,
                audiName,
                request.getShowDate(),
                request.getShowTime(),
                request.getEndTime(),
                request.getAvailableSeats(),
                normalizeScheduleStatus(request.getScheduleStatus())
        );
    }

    private void validateScheduleRequest(EventScheduleDto request, Event event, Venue venue, Long currentScheduleId) {
        validateScheduleDateTime(request, currentScheduleId == null ? null : scheduleRepository.findById(currentScheduleId).orElse(null));
        validateNoOverlap(request, event, currentScheduleId);
        validateSeatSetupForSchedule(request, event, venue);
    }

    private void validateSeatSetupForSchedule(EventScheduleDto request, Event event, Venue venue) {
        String eventCategory = BookingDomainRules.normalizeEventCategory(event.getCategory());
        String venueType = BookingDomainRules.normalizeVenueType(venue.getVenueType());

        if (BookingDomainRules.isSeatBasedEvent(eventCategory)) {
            int seatCount = resolveConfiguredPhysicalSeatCount(
                    venue.getVenueId(),
                    request.getAudiId(),
                    request.getAudiName()
            );
            if (seatCount <= 0) {
                throw new IllegalArgumentException("No physical seats are configured for the selected audi");
            }
            return;
        }

        if (!BookingDomainRules.supportsConcertCategories(venueType)) {
            throw new IllegalArgumentException("Concerts require a concert venue");
        }
        int categoryCount = seatRepository.findByVenueVenueIdAndConcertCategoryNameIsNotNull(venue.getVenueId()).size();
        if (categoryCount <= 0) {
            throw new IllegalArgumentException("No concert ticket categories are configured for the selected venue");
        }
    }

    private void validateMutableFieldsForBookedSchedule(EventSchedule currentSchedule, EventScheduleDto request) {
        if (currentSchedule == null || currentSchedule.getScheduleId() == null) {
            return;
        }
        if (!bookingRepository.existsByScheduleScheduleId(currentSchedule.getScheduleId())) {
            return;
        }

        Long currentEventId = currentSchedule.getEvent() != null ? currentSchedule.getEvent().getEventId() : null;
        Long currentVenueId = currentSchedule.getVenue() != null ? currentSchedule.getVenue().getVenueId() : null;
        boolean immutableFieldChanged = !Objects.equals(currentEventId, request.getEventId())
                || !Objects.equals(currentVenueId, request.getVenueId())
                || !sameLockedArea(currentSchedule, request);

        if (immutableFieldChanged) {
            throw new IllegalArgumentException("Event, venue, and audi cannot be changed after bookings exist for a schedule");
        }
    }

    private boolean sameLockedArea(EventSchedule currentSchedule, EventScheduleDto request) {
        String eventCategory = currentSchedule.getEvent() != null
                ? BookingDomainRules.normalizeEventCategory(currentSchedule.getEvent().getCategory())
                : "";

        if (BookingDomainRules.isConcertEvent(eventCategory)) {
            return BookingDomainRules.text(currentSchedule.getAudiName())
                    .equalsIgnoreCase(BookingDomainRules.text(request.getAudiName()));
        }

        String currentAudiId = BookingDomainRules.text(currentSchedule.getAudiId());
        String requestedAudiId = BookingDomainRules.text(request.getAudiId());
        if (!currentAudiId.isBlank() || !requestedAudiId.isBlank()) {
            return currentAudiId.equalsIgnoreCase(requestedAudiId);
        }

        return BookingDomainRules.text(currentSchedule.getAudiName())
                .equalsIgnoreCase(BookingDomainRules.text(request.getAudiName()));
    }

    private void validateNoOverlap(EventScheduleDto request, Event event, Long currentScheduleId) {
        if (request.getShowDate() == null) {
            throw new IllegalArgumentException("Show date is required");
        }
        if (request.getShowTime() == null) {
            throw new IllegalArgumentException("Show time is required");
        }

        String eventCategory = BookingDomainRules.normalizeEventCategory(event.getCategory());
        LocalTime requestedStart = request.getShowTime();
        LocalTime requestedEnd = calculateEndTime(requestedStart, event.getDuration());
        List<EventSchedule> matchingSchedules = scheduleRepository.findByVenueVenueIdAndShowDate(
                request.getVenueId(),
                request.getShowDate()
        );

        for (EventSchedule existingSchedule : matchingSchedules) {
            if (currentScheduleId != null && Objects.equals(existingSchedule.getScheduleId(), currentScheduleId)) {
                continue;
            }

            boolean sameInventoryArea = BookingDomainRules.isConcertEvent(eventCategory)
                    || BookingDomainRules.text(existingSchedule.getAudiId()).equalsIgnoreCase(BookingDomainRules.text(request.getAudiId()));
            if (!sameInventoryArea) {
                continue;
            }

            LocalTime existingStart = existingSchedule.getShowTime();
            LocalTime existingEnd = calculateEndTime(
                    existingStart,
                    existingSchedule.getEvent() != null ? existingSchedule.getEvent().getDuration() : null
            );
            if (!timeRangesOverlap(requestedStart, requestedEnd, existingStart, existingEnd)) {
                continue;
            }

            String existingEventName = existingSchedule.getEvent() != null
                    ? existingSchedule.getEvent().getEventName()
                    : "another event";
            String areaLabel = BookingDomainRules.isConcertEvent(eventCategory)
                    ? "venue"
                    : BookingDomainRules.text(request.getAudiName());
            throw new IllegalArgumentException(
                    String.format(
                            "Time overlap detected in %s. %s already runs between %s and %s on %s.",
                            areaLabel,
                            existingEventName,
                            existingStart,
                            existingEnd,
                            request.getShowDate()
                    )
            );
        }
    }

    private void validateScheduleDateTime(EventScheduleDto request, EventSchedule currentSchedule) {
        if (request.getShowDate() == null) {
            throw new IllegalArgumentException("Show date is required");
        }
        if (request.getShowTime() == null) {
            throw new IllegalArgumentException("Show time is required");
        }

        LocalDateTime requestedDateTime = LocalDateTime.of(request.getShowDate(), request.getShowTime());
        if (!requestedDateTime.isBefore(LocalDateTime.now())) {
            return;
        }

        boolean isUnchangedExistingSlot = currentSchedule != null
                && Objects.equals(currentSchedule.getShowDate(), request.getShowDate())
                && Objects.equals(currentSchedule.getShowTime(), request.getShowTime());
        if (isUnchangedExistingSlot) {
            return;
        }

        throw new IllegalArgumentException("Cannot create a slot for a past date and time");
    }

    private LocalTime calculateEndTime(LocalTime startTime, BigDecimal durationHours) {
        if (startTime == null) {
            throw new IllegalArgumentException("Show time is required");
        }
        if (durationHours == null || durationHours.doubleValue() <= 0) {
            throw new IllegalArgumentException("Event duration must be greater than zero");
        }

        long durationMinutes = Math.max(1L, Math.round(durationHours.doubleValue() * 60d));
        return startTime.plusMinutes(durationMinutes);
    }

    private boolean timeRangesOverlap(LocalTime startOne, LocalTime endOne, LocalTime startTwo, LocalTime endTwo) {
        if (startOne == null || endOne == null || startTwo == null || endTwo == null) {
            return false;
        }
        return startOne.isBefore(endTwo) && startTwo.isBefore(endOne);
    }

    private int resolveInitialAvailability(Event event, Venue venue, String audiId) {
        String eventCategory = BookingDomainRules.normalizeEventCategory(event.getCategory());
        if (BookingDomainRules.isConcertEvent(eventCategory)) {
            return concertInventoryService.resolveTotalTemplateTicketsForVenue(venue.getVenueId());
        }

        return resolveConfiguredPhysicalSeatCount(
                venue.getVenueId(),
                audiId,
                BookingDomainRules.normalizeAudiName(null, audiId)
        );
    }

    private int resolveSeatBasedAvailability(EventSchedule schedule) {
        Long venueId = schedule.getVenue() != null ? schedule.getVenue().getVenueId() : null;
        if (venueId == null) {
            return 0;
        }

        int physicalSeatCount = resolveConfiguredPhysicalSeatCount(
                venueId,
                schedule.getAudiId(),
                schedule.getAudiName()
        );
        int bookedSeatCount = eventSeatRepository.findByScheduleScheduleId(schedule.getScheduleId()).stream()
                .filter((eventSeat) -> "BOOKED".equalsIgnoreCase(BookingDomainRules.text(eventSeat.getSeatStatus())))
                .map(EventSeat::getEventSeatId)
                .collect(Collectors.toSet())
                .size();
        return Math.max(0, physicalSeatCount - bookedSeatCount);
    }

    private int resolveConfiguredPhysicalSeatCount(Long venueId, String scheduleAudiId, String scheduleAudiName) {
        if (venueId == null) {
            return 0;
        }

        List<Seat> physicalVenueSeats = seatRepository.findByVenueVenueId(venueId).stream()
                .filter((seat) -> BookingDomainRules.text(seat.getConcertCategoryName()).isBlank())
                .collect(Collectors.toList());
        if (physicalVenueSeats.isEmpty()) {
            return 0;
        }

        List<Seat> exactAudiSeats = physicalVenueSeats.stream()
                .filter((seat) -> matchesScheduleAudi(scheduleAudiId, scheduleAudiName, seat))
                .collect(Collectors.toList());
        if (!exactAudiSeats.isEmpty()) {
            return exactAudiSeats.size();
        }

        List<Seat> unassignedSeats = physicalVenueSeats.stream()
                .filter((seat) -> !hasSeatAudiAssignment(seat))
                .collect(Collectors.toList());
        if (!unassignedSeats.isEmpty()) {
            return unassignedSeats.size();
        }

        long configuredSeatLayouts = physicalVenueSeats.stream()
                .map(this::resolveSeatAudiAssignment)
                .filter((audiAssignment) -> !audiAssignment.isBlank())
                .distinct()
                .count();
        return configuredSeatLayouts <= 1 ? physicalVenueSeats.size() : 0;
    }

    private boolean matchesScheduleAudi(String scheduleAudiId, String scheduleAudiName, Seat seat) {
        String normalizedScheduleAudiId = BookingDomainRules.text(scheduleAudiId);
        String normalizedScheduleAudiName = BookingDomainRules.text(scheduleAudiName);
        String seatAudiId = BookingDomainRules.text(seat.getAudiId());
        String seatAudiName = BookingDomainRules.text(seat.getAudiName());

        if (!normalizedScheduleAudiId.isBlank() && !seatAudiId.isBlank()
                && normalizedScheduleAudiId.equalsIgnoreCase(seatAudiId)) {
            return true;
        }

        return !normalizedScheduleAudiName.isBlank() && !seatAudiName.isBlank()
                && normalizedScheduleAudiName.equalsIgnoreCase(seatAudiName);
    }

    private boolean hasSeatAudiAssignment(Seat seat) {
        return !BookingDomainRules.text(seat.getAudiId()).isBlank()
                || !BookingDomainRules.text(seat.getAudiName()).isBlank();
    }

    private String resolveSeatAudiAssignment(Seat seat) {
        String seatAudiId = BookingDomainRules.text(seat.getAudiId());
        if (!seatAudiId.isBlank()) {
            return seatAudiId.toUpperCase();
        }

        String seatAudiName = BookingDomainRules.text(seat.getAudiName());
        return seatAudiName.toUpperCase();
    }

    private boolean shouldCascadeScheduleCancellation(String currentStatus, String requestedStatus) {
        return "CANCELLED".equals(requestedStatus) && !"CANCELLED".equals(currentStatus);
    }

    private boolean venueChanged(EventSchedule currentSchedule, Venue nextVenue) {
        Long currentVenueId = currentSchedule.getVenue() != null ? currentSchedule.getVenue().getVenueId() : null;
        Long nextVenueId = nextVenue != null ? nextVenue.getVenueId() : null;
        return !Objects.equals(currentVenueId, nextVenueId);
    }

    private String normalizeScheduleStatus(String status) {
        String normalized = BookingDomainRules.text(status).toUpperCase();
        return normalized.isBlank() ? "OPEN" : normalized;
    }

    private void cancelScheduleBookings(EventSchedule schedule) {
        if (schedule == null || schedule.getScheduleId() == null) {
            return;
        }

        List<Booking> scheduleBookings = bookingRepository.findByScheduleScheduleIdIn(List.of(schedule.getScheduleId()));
        if (scheduleBookings.isEmpty()) {
            return;
        }

        List<Booking> bookingsToUpdate = new ArrayList<>();
        List<EventSeat> eventSeatsToUpdate = new ArrayList<>();
        List<Cancellation> cancellationsToSave = new ArrayList<>();

        for (Booking booking : scheduleBookings) {
            booking.setBookingStatus("CANCELLED");
            bookingsToUpdate.add(booking);

            List<BookedSeat> bookedSeats = List.of();
            if (booking.getTicketQuantity() != null && booking.getTicketQuantity() > 0) {
                concertInventoryService.restoreTickets(schedule, booking.resolveConcertTicketReferenceId(), booking.getTicketQuantity());
            } else {
                bookedSeats = bookedSeatRepository.findByBookingBookingId(booking.getBookingId());
                for (BookedSeat bookedSeat : bookedSeats) {
                    EventSeat eventSeat = bookedSeat.getEventSeat();
                    if (eventSeat == null) {
                        continue;
                    }
                    if ("AVAILABLE".equalsIgnoreCase(eventSeat.getSeatStatus())) {
                        continue;
                    }
                    eventSeat.setSeatStatus("AVAILABLE");
                    eventSeat.setHoldToken(null);
                    eventSeat.setHoldExpiresAt(null);
                    eventSeatsToUpdate.add(eventSeat);
                }
            }

            Payment payment = bookingPaymentRecordService.ensureCancellationPaymentRecord(booking, bookedSeats, "REFUNDED");

            Cancellation cancellation = cancellationRepository.findByBookingBookingId(booking.getBookingId())
                    .orElseGet(() -> createAdminCancellationRecord(booking));
            if (cancellation.getCancellationDate() == null) {
                cancellation.setCancellationDate(LocalDateTime.now());
            }
            cancellation.setRefundAmount(payment != null && payment.getAmount() != null ? payment.getAmount() : BigDecimal.ZERO);
            cancellation.setRefundStatus("COMPLETED");
            cancellationsToSave.add(cancellation);
        }

        if (!bookingsToUpdate.isEmpty()) {
            bookingRepository.saveAll(bookingsToUpdate);
        }
        if (!eventSeatsToUpdate.isEmpty()) {
            eventSeatRepository.saveAll(eventSeatsToUpdate);
        }
        if (!cancellationsToSave.isEmpty()) {
            cancellationRepository.saveAll(cancellationsToSave);
        }

        if (schedule.getEvent() != null && BookingDomainRules.isConcertEvent(schedule.getEvent().getCategory())) {
            concertInventoryService.synchronizeScheduleAvailability(schedule);
        } else {
            schedule.setAvailableSeats(resolveSeatBasedAvailability(schedule));
        }
    }

    private Cancellation createAdminCancellationRecord(Booking booking) {
        Cancellation cancellation = new Cancellation();
        cancellation.setBooking(booking);
        cancellation.setUser(booking.getUser());
        cancellation.setCancellationReason("Schedule cancelled by admin");
        cancellation.setCancellationType("ADMIN_CANCELLED");
        cancellation.setCancellationDate(LocalDateTime.now());
        return cancellation;
    }
}
