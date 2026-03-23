package com.app.seatbooking.service;

import com.app.seatbooking.domain.BookingDomainRules;
import com.app.seatbooking.dto.EventSeatDto;
import com.app.seatbooking.dto.EventSeatHoldRequestDto;
import com.app.seatbooking.dto.EventSeatHoldResponseDto;
import com.app.seatbooking.entity.EventSchedule;
import com.app.seatbooking.entity.EventSeat;
import com.app.seatbooking.entity.Seat;
import com.app.seatbooking.exception.ResourceNotFoundException;
import com.app.seatbooking.repository.EventScheduleRepository;
import com.app.seatbooking.repository.EventSeatRepository;
import com.app.seatbooking.repository.SeatRepository;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class EventSeatService {

    private static final Duration HOLD_DURATION = Duration.ofMinutes(3);

    private final EventSeatRepository eventSeatRepository;
    private final EventScheduleRepository scheduleRepository;
    private final SeatRepository seatRepository;

    public EventSeatService(EventSeatRepository eventSeatRepository,
                                EventScheduleRepository scheduleRepository,
                                SeatRepository seatRepository) {
        this.eventSeatRepository = eventSeatRepository;
        this.scheduleRepository = scheduleRepository;
        this.seatRepository = seatRepository;
    }

    @Transactional
    public EventSeatDto createEventSeat(EventSeatDto request) {
        EventSeat existingEventSeat = eventSeatRepository
                .findByScheduleScheduleIdAndSeatSeatId(request.getScheduleId(), request.getSeatId())
                .orElse(null);
        if (existingEventSeat != null) {
            return EventSeatDto.toResponse(existingEventSeat);
        }

        EventSchedule schedule = scheduleRepository.findById(request.getScheduleId())
                .orElseThrow(() -> new ResourceNotFoundException("Schedule not found: " + request.getScheduleId()));
        validateSeatBasedSchedule(schedule);
        Seat seat = seatRepository.findById(request.getSeatId())
                .orElseThrow(() -> new ResourceNotFoundException("Seat not found: " + request.getSeatId()));
        validateSeatBelongsToSchedule(schedule, seat);
        EventSeat eventSeat = EventSeatDto.toEntity(request, schedule, seat);
        EventSeat saved = eventSeatRepository.save(eventSeat);
        return EventSeatDto.toResponse(saved);
    }

    @Transactional
    public EventSeatDto updateEventSeat(Long eventSeatId, EventSeatDto request) {
        EventSeat eventSeat = eventSeatRepository.findById(eventSeatId)
                .orElseThrow(() -> new ResourceNotFoundException("Event seat not found: " + eventSeatId));
        EventSchedule schedule = scheduleRepository.findById(request.getScheduleId())
                .orElseThrow(() -> new ResourceNotFoundException("Schedule not found: " + request.getScheduleId()));
        validateSeatBasedSchedule(schedule);
        Seat seat = seatRepository.findById(request.getSeatId())
                .orElseThrow(() -> new ResourceNotFoundException("Seat not found: " + request.getSeatId()));
        validateSeatBelongsToSchedule(schedule, seat);
        EventSeatDto.updateEntity(eventSeat, request, schedule, seat);
        if (!"HELD".equals(normalizeSeatStatus(eventSeat.getSeatStatus()))) {
            clearHold(eventSeat);
        }
        EventSeat saved = eventSeatRepository.save(eventSeat);
        return EventSeatDto.toResponse(saved);
    }

    public EventSeatDto getEventSeatById(Long eventSeatId) {
        EventSeat eventSeat = eventSeatRepository.findById(eventSeatId)
                .orElseThrow(() -> new ResourceNotFoundException("Event seat not found: " + eventSeatId));
        return EventSeatDto.toResponse(eventSeat);
    }

    public List<EventSeatDto> getAllEventSeats() {
        releaseExpiredHeldSeats(null);
        return eventSeatRepository.findAll().stream()
                .map(EventSeatDto::toResponse)
                .collect(Collectors.toList());
    }

    public List<EventSeatDto> getEventSeatsByScheduleId(Long scheduleId) {
        releaseExpiredHeldSeats(scheduleId);
        return eventSeatRepository.findByScheduleScheduleId(scheduleId).stream()
                .map(EventSeatDto::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public EventSeatHoldResponseDto holdEventSeats(EventSeatHoldRequestDto request) {
        EventSchedule schedule = scheduleRepository.findById(request.getScheduleId())
                .orElseThrow(() -> new ResourceNotFoundException("Schedule not found: " + request.getScheduleId()));
        validateSeatBasedSchedule(schedule);
        String scheduleStatus = normalizeSeatStatus(schedule.getScheduleStatus());
        if (!"OPEN".equals(scheduleStatus)) {
            throw new IllegalArgumentException("This slot is not open for booking");
        }

        List<Long> requestedEventSeatIds = request.getEventSeatIds().stream()
                .filter(Objects::nonNull)
                .distinct()
                .collect(Collectors.toList());

        List<EventSeat> eventSeats = eventSeatRepository.findAllByEventSeatIdInForUpdate(requestedEventSeatIds);
        if (eventSeats.size() != requestedEventSeatIds.size()) {
            throw new ResourceNotFoundException("One or more event seats not found");
        }

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime holdExpiresAt = now.plus(HOLD_DURATION);
        for (EventSeat eventSeat : eventSeats) {
            if (eventSeat.getSchedule() == null
                    || !eventSeat.getSchedule().getScheduleId().equals(schedule.getScheduleId())) {
                throw new IllegalArgumentException("Event seat does not belong to the schedule");
            }

            releaseExpiredHoldIfNeeded(eventSeat, now);
            String seatStatus = normalizeSeatStatus(eventSeat.getSeatStatus());
            if ("BOOKED".equals(seatStatus)) {
                throw new IllegalArgumentException("One or more selected seats are already booked");
            }
            if ("HELD".equals(seatStatus) && !request.getHoldToken().equals(eventSeat.getHoldToken())) {
                throw new IllegalArgumentException("One or more selected seats are locked by another user");
            }
            if (!"AVAILABLE".equals(seatStatus) && !"HELD".equals(seatStatus)) {
                throw new IllegalArgumentException("One or more selected seats are unavailable");
            }

            eventSeat.setSeatStatus("HELD");
            eventSeat.setHoldToken(request.getHoldToken());
            eventSeat.setHoldExpiresAt(holdExpiresAt);
        }

        eventSeatRepository.saveAll(eventSeats);

        return new EventSeatHoldResponseDto(
                request.getHoldToken(),
                holdExpiresAt,
                eventSeats.stream().map(EventSeat::getEventSeatId).collect(Collectors.toList())
        );
    }

    @Transactional
    public void releaseHold(String holdToken) {
        if (holdToken == null || holdToken.isBlank()) {
            return;
        }

        List<EventSeat> heldSeats = eventSeatRepository.findByHoldTokenAndSeatStatusIgnoreCase(holdToken, "HELD");
        if (heldSeats.isEmpty()) {
            return;
        }

        heldSeats.forEach(this::markSeatAvailable);
        eventSeatRepository.saveAll(heldSeats);
    }

    @Transactional
    public void deleteEventSeat(Long eventSeatId) {
        EventSeat eventSeat = eventSeatRepository.findById(eventSeatId)
                .orElseThrow(() -> new ResourceNotFoundException("Event seat not found: " + eventSeatId));
        eventSeatRepository.delete(eventSeat);
    }

    private void releaseExpiredHeldSeats(Long scheduleId) {
        LocalDateTime now = LocalDateTime.now();
        List<EventSeat> expiredHeldSeats = scheduleId == null
                ? eventSeatRepository.findBySeatStatusIgnoreCaseAndHoldExpiresAtBefore("HELD", now)
                : eventSeatRepository.findByScheduleScheduleIdAndSeatStatusIgnoreCaseAndHoldExpiresAtBefore(
                        scheduleId,
                        "HELD",
                        now
                );

        if (expiredHeldSeats.isEmpty()) {
            return;
        }

        expiredHeldSeats.forEach(this::markSeatAvailable);
        eventSeatRepository.saveAll(expiredHeldSeats);
    }

    private void releaseExpiredHoldIfNeeded(EventSeat eventSeat, LocalDateTime now) {
        if (!"HELD".equals(normalizeSeatStatus(eventSeat.getSeatStatus()))) {
            return;
        }

        LocalDateTime holdExpiresAt = eventSeat.getHoldExpiresAt();
        if (holdExpiresAt != null && holdExpiresAt.isAfter(now)) {
            return;
        }

        markSeatAvailable(eventSeat);
    }

    private void markSeatAvailable(EventSeat eventSeat) {
        eventSeat.setSeatStatus("AVAILABLE");
        clearHold(eventSeat);
    }

    private void clearHold(EventSeat eventSeat) {
        eventSeat.setHoldToken(null);
        eventSeat.setHoldExpiresAt(null);
    }

    private void validateSeatBasedSchedule(EventSchedule schedule) {
        String eventCategory = schedule != null && schedule.getEvent() != null ? schedule.getEvent().getCategory() : null;
        if (!BookingDomainRules.isSeatBasedEvent(eventCategory)) {
            throw new IllegalArgumentException("This schedule uses concert ticket inventory instead of seat selection");
        }
    }

    private void validateSeatBelongsToSchedule(EventSchedule schedule, Seat seat) {
        if (schedule.getVenue() != null && seat.getVenue() != null
                && !schedule.getVenue().getVenueId().equals(seat.getVenue().getVenueId())) {
            throw new IllegalArgumentException("Seat does not belong to the schedule venue");
        }
        if (!BookingDomainRules.text(seat.getConcertCategoryName()).isBlank()) {
            throw new IllegalArgumentException("Concert ticket categories cannot be mapped as physical seats");
        }
        if (matchesScheduleAudi(schedule, seat) || canReuseSharedVenueSeatLayout(schedule, seat)) {
            return;
        }

        throw new IllegalArgumentException("Seat does not belong to the selected audi");
    }

    private String normalizeSeatStatus(String status) {
        return status == null ? "" : status.trim().toUpperCase();
    }

    private boolean canReuseSharedVenueSeatLayout(EventSchedule schedule, Seat seat) {
        Long venueId = schedule.getVenue() != null ? schedule.getVenue().getVenueId() : null;
        if (venueId == null) {
            return false;
        }

        List<Seat> physicalVenueSeats = seatRepository.findByVenueVenueId(venueId).stream()
                .filter(venueSeat -> BookingDomainRules.text(venueSeat.getConcertCategoryName()).isBlank())
                .collect(Collectors.toList());

        if (physicalVenueSeats.isEmpty()) {
            return false;
        }

        boolean hasExactAudiLayout = physicalVenueSeats.stream().anyMatch(venueSeat -> matchesScheduleAudi(schedule, venueSeat));
        if (hasExactAudiLayout) {
            return false;
        }

        if (!hasSeatAudiAssignment(seat)) {
            return true;
        }

        long configuredSeatLayouts = physicalVenueSeats.stream()
                .map(this::resolveSeatAudiAssignment)
                .filter(audiAssignment -> !audiAssignment.isBlank())
                .distinct()
                .count();

        return configuredSeatLayouts <= 1;
    }

    private boolean matchesScheduleAudi(EventSchedule schedule, Seat seat) {
        String scheduleAudiId = BookingDomainRules.text(schedule.getAudiId());
        String scheduleAudiName = BookingDomainRules.text(schedule.getAudiName());
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
