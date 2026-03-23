package com.app.seatbooking.service;

import com.app.seatbooking.domain.BookingDomainRules;
import com.app.seatbooking.dto.VenueDto;
import com.app.seatbooking.entity.Booking;
import com.app.seatbooking.entity.EventSchedule;
import com.app.seatbooking.entity.EventSeat;
import com.app.seatbooking.entity.Seat;
import com.app.seatbooking.entity.Venue;
import com.app.seatbooking.exception.ResourceNotFoundException;
import com.app.seatbooking.repository.BookedSeatRepository;
import com.app.seatbooking.repository.BookingRepository;
import com.app.seatbooking.repository.CancellationRepository;
import com.app.seatbooking.repository.EventScheduleRepository;
import com.app.seatbooking.repository.EventSeatRepository;
import com.app.seatbooking.repository.PaymentRepository;
import com.app.seatbooking.repository.SeatRepository;
import com.app.seatbooking.repository.VenueRepository;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class VenueService {

    private static final int DEFAULT_CAPACITY = 0;
    private final VenueRepository venueRepository;
    private final EventScheduleRepository scheduleRepository;
    private final EventSeatRepository eventSeatRepository;
    private final BookingRepository bookingRepository;
    private final BookedSeatRepository bookedSeatRepository;
    private final PaymentRepository paymentRepository;
    private final CancellationRepository cancellationRepository;
    private final SeatRepository seatRepository;
    private final ConcertInventoryService concertInventoryService;

    public VenueService(VenueRepository venueRepository,
                        EventScheduleRepository scheduleRepository,
                        EventSeatRepository eventSeatRepository,
                        BookingRepository bookingRepository,
                        BookedSeatRepository bookedSeatRepository,
                        PaymentRepository paymentRepository,
                        CancellationRepository cancellationRepository,
                        SeatRepository seatRepository,
                        ConcertInventoryService concertInventoryService) {
        this.venueRepository = venueRepository;
        this.scheduleRepository = scheduleRepository;
        this.eventSeatRepository = eventSeatRepository;
        this.bookingRepository = bookingRepository;
        this.bookedSeatRepository = bookedSeatRepository;
        this.paymentRepository = paymentRepository;
        this.cancellationRepository = cancellationRepository;
        this.seatRepository = seatRepository;
        this.concertInventoryService = concertInventoryService;
    }

    public VenueDto createVenue(VenueDto request) {
        Venue venue = VenueDto.toEntity(request);
        venue.setCapacity(resolveCapacity(request.getCapacity(), null));
        venue.setVenueType(BookingDomainRules.normalizeVenueType(request.getVenueType()));
        Venue saved = venueRepository.save(venue);
        return VenueDto.toResponse(saved);
    }

    public VenueDto updateVenue(Long venueId, VenueDto request) {
        Venue venue = venueRepository.findById(venueId)
                .orElseThrow(() -> new ResourceNotFoundException("Venue not found: " + venueId));
        Integer existingCapacity = venue.getCapacity();
        VenueDto.updateEntity(venue, request);
        venue.setCapacity(resolveCapacity(request.getCapacity(), existingCapacity));
        venue.setVenueType(BookingDomainRules.normalizeVenueType(request.getVenueType()));
        Venue saved = venueRepository.save(venue);
        return VenueDto.toResponse(saved);
    }

    public VenueDto getVenueById(Long venueId) {
        Venue venue = venueRepository.findById(venueId)
                .orElseThrow(() -> new ResourceNotFoundException("Venue not found: " + venueId));
        return VenueDto.toResponse(venue);
    }

    public List<VenueDto> getAllVenues() {
        return venueRepository.findAll().stream()
                .map(VenueDto::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public void deleteVenue(Long venueId) {
        Venue venue = venueRepository.findById(venueId)
                .orElseThrow(() -> new ResourceNotFoundException("Venue not found: " + venueId));

        List<EventSchedule> schedules = scheduleRepository.findByVenueVenueId(venueId);
        List<Seat> seats = seatRepository.findByVenueVenueId(venueId);

        Set<Long> scheduleIds = schedules.stream()
                .map(EventSchedule::getScheduleId)
                .filter(Objects::nonNull)
                .collect(Collectors.toCollection(LinkedHashSet::new));

        Set<Long> seatIds = seats.stream()
                .map(Seat::getSeatId)
                .filter(Objects::nonNull)
                .collect(Collectors.toCollection(LinkedHashSet::new));

        Set<Long> bookingIds = new LinkedHashSet<>();
        if (!scheduleIds.isEmpty()) {
            bookingIds.addAll(
                    bookingRepository.findByScheduleScheduleIdIn(scheduleIds).stream()
                            .map(Booking::getBookingId)
                            .filter(Objects::nonNull)
                            .collect(Collectors.toSet())
            );
        }

        Set<Long> eventSeatIds = new LinkedHashSet<>();
        if (!scheduleIds.isEmpty()) {
            eventSeatIds.addAll(
                    eventSeatRepository.findByScheduleScheduleIdIn(scheduleIds).stream()
                            .map(EventSeat::getEventSeatId)
                            .filter(Objects::nonNull)
                            .collect(Collectors.toSet())
            );
        }
        if (!seatIds.isEmpty()) {
            eventSeatIds.addAll(
                    eventSeatRepository.findBySeatSeatIdIn(seatIds).stream()
                            .map(EventSeat::getEventSeatId)
                            .filter(Objects::nonNull)
                            .collect(Collectors.toSet())
            );
        }

        if (!eventSeatIds.isEmpty()) {
            bookingIds.addAll(
                    bookedSeatRepository.findByEventSeatEventSeatIdIn(eventSeatIds).stream()
                            .map(bookedSeat -> bookedSeat.getBooking())
                            .filter(Objects::nonNull)
                            .map(Booking::getBookingId)
                            .filter(Objects::nonNull)
                            .collect(Collectors.toSet())
            );
        }

        if (!bookingIds.isEmpty()) {
            cancellationRepository.deleteByBookingBookingIdIn(bookingIds);
            paymentRepository.deleteByBookingBookingIdIn(bookingIds);
            bookedSeatRepository.deleteByBookingBookingIdIn(bookingIds);

            List<Booking> bookings = bookingRepository.findAllById(bookingIds);
            if (!bookings.isEmpty()) {
                bookingRepository.deleteAll(bookings);
            }
        }

        if (!eventSeatIds.isEmpty()) {
            bookedSeatRepository.deleteByEventSeatEventSeatIdIn(eventSeatIds);

            List<EventSeat> eventSeats = eventSeatRepository.findAllById(eventSeatIds);
            if (!eventSeats.isEmpty()) {
                eventSeatRepository.deleteAll(eventSeats);
            }
        }

        concertInventoryService.deleteByScheduleIds(scheduleIds);

        if (!schedules.isEmpty()) {
            scheduleRepository.deleteAll(schedules);
        }

        if (!seats.isEmpty()) {
            seatRepository.deleteAll(seats);
        }

        venueRepository.delete(venue);
    }

    private Integer resolveCapacity(Integer requestedCapacity, Integer existingCapacity) {
        if (requestedCapacity != null) {
            return requestedCapacity;
        }
        if (existingCapacity != null) {
            return existingCapacity;
        }
        return DEFAULT_CAPACITY;
    }
}



