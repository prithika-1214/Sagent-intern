package com.app.seatbooking.service;

import com.app.seatbooking.domain.BookingDomainRules;
import com.app.seatbooking.dto.ConcertInventoryDto;
import com.app.seatbooking.dto.SeatDto;
import com.app.seatbooking.entity.Booking;
import com.app.seatbooking.entity.ConcertScheduleInventory;
import com.app.seatbooking.entity.EventSchedule;
import com.app.seatbooking.entity.EventSeat;
import com.app.seatbooking.entity.Seat;
import com.app.seatbooking.entity.Venue;
import com.app.seatbooking.exception.ResourceNotFoundException;
import com.app.seatbooking.repository.BookedSeatRepository;
import com.app.seatbooking.repository.BookingRepository;
import com.app.seatbooking.repository.CancellationRepository;
import com.app.seatbooking.repository.ConcertScheduleInventoryRepository;
import com.app.seatbooking.repository.EventScheduleRepository;
import com.app.seatbooking.repository.EventSeatRepository;
import com.app.seatbooking.repository.PaymentRepository;
import com.app.seatbooking.repository.SeatRepository;
import com.app.seatbooking.repository.VenueRepository;
import java.math.BigDecimal;
import java.util.Collection;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SeatService {

    private static final int MAX_SEAT_NUMBER_LENGTH = 20;

    private final SeatRepository seatRepository;
    private final VenueRepository venueRepository;
    private final EventSeatRepository eventSeatRepository;
    private final BookedSeatRepository bookedSeatRepository;
    private final BookingRepository bookingRepository;
    private final PaymentRepository paymentRepository;
    private final CancellationRepository cancellationRepository;
    private final EventScheduleRepository scheduleRepository;
    private final ConcertScheduleInventoryRepository concertInventoryRepository;
    private final ConcertInventoryService concertInventoryService;

    public SeatService(SeatRepository seatRepository,
                       VenueRepository venueRepository,
                       EventSeatRepository eventSeatRepository,
                       BookedSeatRepository bookedSeatRepository,
                       BookingRepository bookingRepository,
                       PaymentRepository paymentRepository,
                       CancellationRepository cancellationRepository,
                       EventScheduleRepository scheduleRepository,
                       ConcertScheduleInventoryRepository concertInventoryRepository,
                       ConcertInventoryService concertInventoryService) {
        this.seatRepository = seatRepository;
        this.venueRepository = venueRepository;
        this.eventSeatRepository = eventSeatRepository;
        this.bookedSeatRepository = bookedSeatRepository;
        this.bookingRepository = bookingRepository;
        this.paymentRepository = paymentRepository;
        this.cancellationRepository = cancellationRepository;
        this.scheduleRepository = scheduleRepository;
        this.concertInventoryRepository = concertInventoryRepository;
        this.concertInventoryService = concertInventoryService;
    }

    public SeatDto createSeat(SeatDto request) {
        Venue venue = venueRepository.findById(request.getVenueId())
                .orElseThrow(() -> new ResourceNotFoundException("Venue not found: " + request.getVenueId()));
        String venueType = BookingDomainRules.normalizeVenueType(venue.getVenueType());
        SeatDto normalizedRequest = normalizeRequest(request, venueType);
        validateSeatRequest(normalizedRequest, venue, null);
        Seat seat = SeatDto.toEntity(normalizedRequest, venue);
        Seat saved = seatRepository.save(seat);
        synchronizeSeatDerivedAvailability(saved, null);
        return SeatDto.toResponse(saved);
    }

    @Transactional
    public SeatDto updateSeat(Long seatId, SeatDto request) {
        Seat seat = seatRepository.findById(seatId)
                .orElseThrow(() -> new ResourceNotFoundException("Seat not found: " + seatId));
        Venue venue = venueRepository.findById(request.getVenueId())
                .orElseThrow(() -> new ResourceNotFoundException("Venue not found: " + request.getVenueId()));
        String previousAudiId = seat.getAudiId();
        String venueType = BookingDomainRules.normalizeVenueType(venue.getVenueType());
        SeatDto normalizedRequest = normalizeRequest(request, venueType);
        validateSeatRequest(normalizedRequest, venue, seatId);
        boolean wasConcertCategory = isConcertCategorySeat(seat);

        SeatDto.updateEntity(seat, normalizedRequest, venue);
        Seat saved = seatRepository.save(seat);

        if (isConcertCategorySeat(saved)) {
            propagateConcertCategoryChanges(saved);
        }

        synchronizeSeatDerivedAvailability(saved, previousAudiId);
        if (wasConcertCategory && !isConcertCategorySeat(saved)) {
            synchronizeConcertSchedulesForSeatCategoryIds(List.of(seatId));
        }
        return SeatDto.toResponse(saved);
    }

    public SeatDto getSeatById(Long seatId) {
        Seat seat = seatRepository.findById(seatId)
                .orElseThrow(() -> new ResourceNotFoundException("Seat not found: " + seatId));
        return SeatDto.toResponse(seat);
    }

    public List<SeatDto> getAllSeats() {
        return seatRepository.findAll().stream()
                .map(SeatDto::toResponse)
                .collect(Collectors.toList());
    }

    public List<ConcertInventoryDto> getConcertInventoryByScheduleId(Long scheduleId) {
        return concertInventoryService.getConcertInventoryByScheduleId(scheduleId);
    }

    @Transactional
    public void deleteSeat(Long seatId) {
        Seat seat = seatRepository.findById(seatId)
                .orElseThrow(() -> new ResourceNotFoundException("Seat not found: " + seatId));

        if (isConcertCategorySeat(seat)) {
            deleteConcertCategorySeat(seat);
            return;
        }

        List<EventSeat> eventSeats = eventSeatRepository.findBySeatSeatId(seatId);
        if (!eventSeats.isEmpty()) {
            List<Long> eventSeatIds = eventSeats.stream()
                    .map(EventSeat::getEventSeatId)
                    .filter(Objects::nonNull)
                    .collect(Collectors.toList());

            deleteBookingsByEventSeatIds(eventSeatIds);
            eventSeatRepository.deleteAll(eventSeats);
        }

        Long venueId = seat.getVenue() != null ? seat.getVenue().getVenueId() : null;
        seatRepository.delete(seat);
        synchronizeSeatBasedSchedules(venueId);
    }

    private void deleteConcertCategorySeat(Seat seat) {
        Long seatId = seat.getSeatId();
        Set<Booking> relatedBookings = new LinkedHashSet<>();
        relatedBookings.addAll(bookingRepository.findByTicketCategoryIdIn(List.of(seatId)));
        relatedBookings.addAll(bookingRepository.findByTicketSeatIdIn(List.of(seatId)));
        deleteBookings(List.copyOf(relatedBookings));

        List<ConcertScheduleInventory> inventories = concertInventoryRepository.findByTicketCategorySeatSeatIdIn(List.of(seatId));
        Set<Long> affectedScheduleIds = inventories.stream()
                .map(ConcertScheduleInventory::getSchedule)
                .filter(Objects::nonNull)
                .map(EventSchedule::getScheduleId)
                .filter(Objects::nonNull)
                .collect(Collectors.toCollection(LinkedHashSet::new));

        if (!inventories.isEmpty()) {
            concertInventoryRepository.deleteAll(inventories);
        }

        seatRepository.delete(seat);
        synchronizeConcertSchedulesForIds(affectedScheduleIds);
    }

    private void deleteBookingsByEventSeatIds(Collection<Long> eventSeatIds) {
        if (eventSeatIds == null || eventSeatIds.isEmpty()) {
            return;
        }
        List<Booking> bookings = bookedSeatRepository.findByEventSeatEventSeatIdIn(eventSeatIds).stream()
                .map((bookedSeat) -> bookedSeat.getBooking())
                .filter(Objects::nonNull)
                .distinct()
                .collect(Collectors.toList());
        deleteBookings(bookings);
        bookedSeatRepository.deleteByEventSeatEventSeatIdIn(eventSeatIds);
    }

    private void deleteBookings(List<Booking> bookings) {
        if (bookings == null || bookings.isEmpty()) {
            return;
        }
        List<Long> bookingIds = bookings.stream()
                .map(Booking::getBookingId)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
        if (bookingIds.isEmpty()) {
            return;
        }

        cancellationRepository.deleteByBookingBookingIdIn(bookingIds);
        paymentRepository.deleteByBookingBookingIdIn(bookingIds);
        bookedSeatRepository.deleteByBookingBookingIdIn(bookingIds);
        bookingRepository.deleteAll(bookings);
    }

    private void validateSeatRequest(SeatDto request, Venue venue, Long currentSeatId) {
        String venueType = BookingDomainRules.normalizeVenueType(venue.getVenueType());
        if (BookingDomainRules.supportsConcertCategories(venueType)) {
            validateConcertCategoryRequest(request, venue, currentSeatId);
            return;
        }

        validatePhysicalSeatRequest(request, venue, currentSeatId);
    }

    private void validateConcertCategoryRequest(SeatDto request, Venue venue, Long currentSeatId) {
        String categoryName = BookingDomainRules.normalizeConcertCategoryName(request.getConcertCategoryName());
        if (categoryName.isBlank()) {
            throw new IllegalArgumentException("Concert ticket category is required");
        }
        if (request.getSeatCount() == null || request.getSeatCount() <= 0) {
            throw new IllegalArgumentException("Ticket count must be greater than zero");
        }
        if (request.getSeatPrice() == null || request.getSeatPrice().compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Ticket price must be zero or greater");
        }

        boolean duplicateCategory = seatRepository.findByVenueVenueIdAndConcertCategoryNameIsNotNull(venue.getVenueId()).stream()
                .filter(this::isConcertCategorySeat)
                .filter((seat) -> !Objects.equals(seat.getSeatId(), currentSeatId))
                .anyMatch((seat) -> categoryName.equalsIgnoreCase(seat.getConcertCategoryName()));
        if (duplicateCategory) {
            throw new IllegalArgumentException("This concert category already exists for the venue");
        }
    }

    private void validatePhysicalSeatRequest(SeatDto request, Venue venue, Long currentSeatId) {
        String seatNumber = BookingDomainRules.text(request.getSeatNumber());
        String seatRow = BookingDomainRules.text(request.getSeatRow());
        String audiId = BookingDomainRules.text(request.getAudiId());
        if (audiId.isBlank()) {
            throw new IllegalArgumentException("Audi ID is required for seat-based venues");
        }
        if (seatNumber.isBlank()) {
            throw new IllegalArgumentException("Seat number is required");
        }
        if (seatRow.isBlank()) {
            throw new IllegalArgumentException("Seat row is required");
        }
        if (BookingDomainRules.text(request.getSeatType()).isBlank()) {
            throw new IllegalArgumentException("Seat section/type is required");
        }
        if (request.getSeatPrice() == null || request.getSeatPrice().compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Seat price must be zero or greater");
        }

        boolean duplicateSeat = seatRepository.findByVenueVenueIdAndAudiIdIgnoreCaseAndConcertCategoryNameIsNull(
                        venue.getVenueId(),
                        request.getAudiId()
                ).stream()
                .filter((seat) -> !Objects.equals(seat.getSeatId(), currentSeatId))
                .anyMatch((seat) -> seatNumber.equalsIgnoreCase(BookingDomainRules.text(seat.getSeatNumber())));
        if (duplicateSeat) {
            throw new IllegalArgumentException("This seat number already exists in the selected audi");
        }
    }

    private SeatDto normalizeRequest(SeatDto request, String venueType) {
        SeatDto normalized = new SeatDto();
        normalized.setSeatId(request.getSeatId());
        normalized.setVenueId(request.getVenueId());
        normalized.setSeatPrice(request.getSeatPrice());

        if (BookingDomainRules.supportsConcertCategories(venueType)) {
            normalized.setSeatNumber(buildConcertCategorySeatNumber(request.getConcertCategoryName()));
            normalized.setSeatRow(null);
            normalized.setAudiId(null);
            normalized.setAudiName(null);
            normalized.setSeatType(BookingDomainRules.CONCERT_CATEGORY_SEAT_TYPE);
            normalized.setConcertCategoryName(BookingDomainRules.normalizeConcertCategoryName(request.getConcertCategoryName()));
            normalized.setSeatCount(request.getSeatCount());
            return normalized;
        }

        String audiId = BookingDomainRules.normalizeAudiId(request.getAudiId(), request.getAudiName());
        normalized.setSeatNumber(BookingDomainRules.text(request.getSeatNumber()).toUpperCase());
        normalized.setSeatRow(BookingDomainRules.text(request.getSeatRow()).toUpperCase());
        normalized.setAudiId(audiId);
        normalized.setAudiName(BookingDomainRules.normalizeAudiName(request.getAudiName(), audiId));
        normalized.setSeatType(BookingDomainRules.normalizeSeatType(request.getSeatType(), venueType));
        normalized.setConcertCategoryName(null);
        normalized.setSeatCount(resolvePhysicalSeatCount(request.getSeatCount()));
        return normalized;
    }

    private Integer resolvePhysicalSeatCount(Integer requestedSeatCount) {
        if (requestedSeatCount == null || requestedSeatCount <= 0) {
            return 1;
        }
        return requestedSeatCount;
    }

    private String buildConcertCategorySeatNumber(String categoryName) {
        String normalizedCategory = BookingDomainRules.normalizeConcertCategoryName(categoryName)
                .replaceAll("[^A-Z0-9]+", "_")
                .replaceAll("_+", "_")
                .replaceAll("^_", "")
                .replaceAll("_$", "");
        String base = normalizedCategory.isBlank() ? "CATEGORY" : normalizedCategory;
        String hashSuffix = String.format("%04X", Math.abs(base.hashCode()) & 0xFFFF);
        int maxBaseLength = Math.max(0, MAX_SEAT_NUMBER_LENGTH - 4 - hashSuffix.length());
        String truncatedBase = base.substring(0, Math.min(base.length(), maxBaseLength));
        return "CAT_" + truncatedBase + hashSuffix;
    }

    private boolean isConcertCategorySeat(Seat seat) {
        return seat != null && !BookingDomainRules.text(seat.getConcertCategoryName()).isBlank();
    }

    private void propagateConcertCategoryChanges(Seat categorySeat) {
        List<ConcertScheduleInventory> inventories = concertInventoryRepository.findByTicketCategorySeatSeatIdIn(
                List.of(categorySeat.getSeatId())
        );
        if (inventories.isEmpty()) {
            return;
        }

        Set<Long> affectedScheduleIds = new LinkedHashSet<>();
        for (ConcertScheduleInventory inventory : inventories) {
            int previousTotal = inventory.getTotalTickets() == null ? 0 : inventory.getTotalTickets();
            int previousAvailable = inventory.getAvailableTickets() == null ? 0 : inventory.getAvailableTickets();
            int soldTickets = Math.max(0, previousTotal - previousAvailable);
            int newTotal = categorySeat.getSeatCount() == null ? 0 : Math.max(0, categorySeat.getSeatCount());

            inventory.setCategoryName(categorySeat.getConcertCategoryName());
            inventory.setTicketPrice(categorySeat.getSeatPrice());
            inventory.setTotalTickets(newTotal);
            inventory.setAvailableTickets(Math.max(0, newTotal - soldTickets));

            if (inventory.getSchedule() != null && inventory.getSchedule().getScheduleId() != null) {
                affectedScheduleIds.add(inventory.getSchedule().getScheduleId());
            }
        }

        concertInventoryRepository.saveAll(inventories);
        synchronizeConcertSchedulesForIds(affectedScheduleIds);
    }

    private void synchronizeSeatDerivedAvailability(Seat seat, String previousAudiId) {
        if (seat == null || seat.getVenue() == null || seat.getVenue().getVenueId() == null) {
            return;
        }

        if (isConcertCategorySeat(seat)) {
            synchronizeConcertSchedulesForVenue(seat.getVenue().getVenueId());
            return;
        }

        synchronizeSeatBasedSchedules(seat.getVenue().getVenueId());
    }

    private void synchronizeConcertSchedulesForVenue(Long venueId) {
        if (venueId == null) {
            return;
        }
        Set<Long> scheduleIds = scheduleRepository.findByVenueVenueId(venueId).stream()
                .filter((schedule) -> schedule.getEvent() != null)
                .filter((schedule) -> BookingDomainRules.isConcertEvent(schedule.getEvent().getCategory()))
                .map(EventSchedule::getScheduleId)
                .filter(Objects::nonNull)
                .collect(Collectors.toCollection(LinkedHashSet::new));
        synchronizeConcertSchedulesForIds(scheduleIds);
    }

    private void synchronizeConcertSchedulesForSeatCategoryIds(Collection<Long> seatIds) {
        if (seatIds == null || seatIds.isEmpty()) {
            return;
        }
        Set<Long> scheduleIds = concertInventoryRepository.findByTicketCategorySeatSeatIdIn(seatIds).stream()
                .map(ConcertScheduleInventory::getSchedule)
                .filter(Objects::nonNull)
                .map(EventSchedule::getScheduleId)
                .filter(Objects::nonNull)
                .collect(Collectors.toCollection(LinkedHashSet::new));
        synchronizeConcertSchedulesForIds(scheduleIds);
    }

    private void synchronizeConcertSchedulesForIds(Collection<Long> scheduleIds) {
        if (scheduleIds == null || scheduleIds.isEmpty()) {
            return;
        }

        List<EventSchedule> schedules = scheduleRepository.findAllById(scheduleIds);
        for (EventSchedule schedule : schedules) {
            concertInventoryService.synchronizeScheduleAvailability(schedule);
        }
        if (!schedules.isEmpty()) {
            scheduleRepository.saveAll(schedules);
        }
    }

    private void synchronizeSeatBasedSchedules(Long venueId) {
        if (venueId == null) {
            return;
        }

        List<EventSchedule> schedules = scheduleRepository.findByVenueVenueId(venueId).stream()
                .filter((schedule) -> schedule.getEvent() != null)
                .filter((schedule) -> BookingDomainRules.isSeatBasedEvent(schedule.getEvent().getCategory()))
                .collect(Collectors.toList());

        if (schedules.isEmpty()) {
            return;
        }

        for (EventSchedule schedule : schedules) {
            int physicalSeatCount = resolveConfiguredPhysicalSeatCountForSchedule(schedule);
            int bookedSeatCount = eventSeatRepository.findByScheduleScheduleId(schedule.getScheduleId()).stream()
                    .filter((eventSeat) -> "BOOKED".equalsIgnoreCase(BookingDomainRules.text(eventSeat.getSeatStatus())))
                    .map(EventSeat::getEventSeatId)
                    .collect(Collectors.toSet())
                    .size();
            schedule.setAvailableSeats(Math.max(0, physicalSeatCount - bookedSeatCount));
        }
        scheduleRepository.saveAll(schedules);
    }

    private int resolveConfiguredPhysicalSeatCountForSchedule(EventSchedule schedule) {
        if (schedule == null || schedule.getVenue() == null || schedule.getVenue().getVenueId() == null) {
            return 0;
        }

        Long venueId = schedule.getVenue().getVenueId();
        String scheduleAudiId = BookingDomainRules.text(schedule.getAudiId());
        String scheduleAudiName = BookingDomainRules.text(schedule.getAudiName());

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
        String seatAudiId = BookingDomainRules.text(seat.getAudiId());
        String seatAudiName = BookingDomainRules.text(seat.getAudiName());

        if (!scheduleAudiId.isBlank() && !seatAudiId.isBlank() && scheduleAudiId.equalsIgnoreCase(seatAudiId)) {
            return true;
        }

        return !scheduleAudiName.isBlank() && !seatAudiName.isBlank() && scheduleAudiName.equalsIgnoreCase(seatAudiName);
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
}
