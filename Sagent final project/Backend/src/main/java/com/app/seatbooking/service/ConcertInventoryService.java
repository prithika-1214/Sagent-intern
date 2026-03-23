package com.app.seatbooking.service;

import com.app.seatbooking.domain.BookingDomainRules;
import com.app.seatbooking.dto.ConcertInventoryDto;
import com.app.seatbooking.entity.ConcertScheduleInventory;
import com.app.seatbooking.entity.Event;
import com.app.seatbooking.entity.EventSchedule;
import com.app.seatbooking.entity.Seat;
import com.app.seatbooking.exception.ResourceNotFoundException;
import com.app.seatbooking.repository.ConcertScheduleInventoryRepository;
import com.app.seatbooking.repository.EventScheduleRepository;
import com.app.seatbooking.repository.SeatRepository;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ConcertInventoryService {

    private final ConcertScheduleInventoryRepository concertInventoryRepository;
    private final EventScheduleRepository scheduleRepository;
    private final SeatRepository seatRepository;

    public ConcertInventoryService(ConcertScheduleInventoryRepository concertInventoryRepository,
                                   EventScheduleRepository scheduleRepository,
                                   SeatRepository seatRepository) {
        this.concertInventoryRepository = concertInventoryRepository;
        this.scheduleRepository = scheduleRepository;
        this.seatRepository = seatRepository;
    }

    @Transactional
    public List<ConcertInventoryDto> getConcertInventoryByScheduleId(Long scheduleId) {
        EventSchedule schedule = scheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new ResourceNotFoundException("Schedule not found: " + scheduleId));
        validateConcertSchedule(schedule);
        return ensureInventoryForSchedule(schedule).stream()
                .map(ConcertInventoryDto::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public ConcertScheduleInventory reserveTickets(EventSchedule schedule, Long ticketCategoryId, int quantity) {
        validateConcertSchedule(schedule);
        ensureInventoryForSchedule(schedule);
        ConcertScheduleInventory inventory = concertInventoryRepository
                .findByScheduleScheduleIdAndTicketCategorySeatSeatIdForUpdate(schedule.getScheduleId(), ticketCategoryId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Concert ticket category not found for schedule: " + ticketCategoryId
                ));

        int availableTickets = inventory.getAvailableTickets() == null ? 0 : inventory.getAvailableTickets();
        if (quantity <= 0) {
            throw new IllegalArgumentException("Ticket quantity must be greater than zero");
        }
        if (availableTickets < quantity) {
            throw new IllegalArgumentException("Not enough tickets available in the selected category");
        }

        inventory.setAvailableTickets(availableTickets - quantity);
        return concertInventoryRepository.save(inventory);
    }

    @Transactional
    public void restoreTickets(EventSchedule schedule, Long ticketCategoryId, Integer quantity) {
        if (schedule == null || schedule.getScheduleId() == null || ticketCategoryId == null || quantity == null || quantity <= 0) {
            return;
        }

        List<ConcertScheduleInventory> inventories = ensureInventoryForSchedule(schedule);
        ConcertScheduleInventory matchingInventory = inventories.stream()
                .filter(inventory -> inventory.getTicketCategorySeat() != null)
                .filter(inventory -> Objects.equals(inventory.getTicketCategorySeat().getSeatId(), ticketCategoryId))
                .findFirst()
                .orElse(null);
        if (matchingInventory == null) {
            return;
        }

        int totalTickets = matchingInventory.getTotalTickets() == null ? 0 : matchingInventory.getTotalTickets();
        int availableTickets = matchingInventory.getAvailableTickets() == null ? 0 : matchingInventory.getAvailableTickets();
        matchingInventory.setAvailableTickets(Math.min(totalTickets, availableTickets + quantity));
        concertInventoryRepository.save(matchingInventory);
    }

    @Transactional
    public List<ConcertScheduleInventory> ensureInventoryForSchedule(EventSchedule schedule) {
        if (schedule == null || schedule.getScheduleId() == null) {
            return List.of();
        }

        validateConcertSchedule(schedule);

        List<ConcertScheduleInventory> existingInventory = concertInventoryRepository.findByScheduleScheduleId(schedule.getScheduleId());
        if (!existingInventory.isEmpty()) {
            return existingInventory;
        }

        Long venueId = schedule.getVenue() != null ? schedule.getVenue().getVenueId() : null;
        List<Seat> ticketCategoryTemplates = venueId == null
                ? List.of()
                : seatRepository.findByVenueVenueIdAndConcertCategoryNameIsNotNull(venueId);

        if (ticketCategoryTemplates.isEmpty()) {
            return List.of();
        }

        List<ConcertScheduleInventory> inventoriesToSave = new ArrayList<>();
        for (Seat templateSeat : ticketCategoryTemplates) {
            ConcertScheduleInventory inventory = new ConcertScheduleInventory();
            inventory.setSchedule(schedule);
            inventory.setTicketCategorySeat(templateSeat);
            inventory.setCategoryName(templateSeat.getConcertCategoryName());
            inventory.setTicketPrice(templateSeat.getSeatPrice());
            int totalTickets = templateSeat.getSeatCount() == null ? 0 : Math.max(0, templateSeat.getSeatCount());
            inventory.setTotalTickets(totalTickets);
            inventory.setAvailableTickets(totalTickets);
            inventoriesToSave.add(inventory);
        }

        return concertInventoryRepository.saveAll(inventoriesToSave);
    }

    @Transactional(readOnly = true)
    public int resolveTotalTemplateTicketsForVenue(Long venueId) {
        if (venueId == null) {
            return 0;
        }

        return seatRepository.findByVenueVenueIdAndConcertCategoryNameIsNotNull(venueId).stream()
                .map(Seat::getSeatCount)
                .filter(Objects::nonNull)
                .mapToInt((count) -> Math.max(0, count))
                .sum();
    }

    @Transactional
    public int synchronizeScheduleAvailability(EventSchedule schedule) {
        if (schedule == null) {
            return 0;
        }

        List<ConcertScheduleInventory> inventories = ensureInventoryForSchedule(schedule);
        int availableTickets = inventories.stream()
                .map(ConcertScheduleInventory::getAvailableTickets)
                .filter(Objects::nonNull)
                .mapToInt((count) -> Math.max(0, count))
                .sum();
        schedule.setAvailableSeats(availableTickets);
        return availableTickets;
    }

    @Transactional
    public void deleteByScheduleIds(Collection<Long> scheduleIds) {
        if (scheduleIds == null || scheduleIds.isEmpty()) {
            return;
        }
        concertInventoryRepository.deleteByScheduleScheduleIdIn(scheduleIds);
    }

    @Transactional
    public void deleteByScheduleId(Long scheduleId) {
        if (scheduleId == null) {
            return;
        }
        deleteByScheduleIds(List.of(scheduleId));
    }

    private void validateConcertSchedule(EventSchedule schedule) {
        Event event = schedule.getEvent();
        String eventCategory = event != null ? event.getCategory() : null;
        if (!BookingDomainRules.isConcertEvent(eventCategory)) {
            throw new IllegalArgumentException("Concert inventory is only available for concert schedules");
        }
    }
}
