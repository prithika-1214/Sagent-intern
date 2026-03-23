package com.app.seatbooking.service;

import com.app.seatbooking.domain.BookingDomainRules;
import com.app.seatbooking.dto.EventDto;
import com.app.seatbooking.entity.Booking;
import com.app.seatbooking.entity.Event;
import com.app.seatbooking.entity.EventSchedule;
import com.app.seatbooking.entity.EventSeat;
import com.app.seatbooking.exception.ResourceNotFoundException;
import com.app.seatbooking.repository.BookedSeatRepository;
import com.app.seatbooking.repository.BookingRepository;
import com.app.seatbooking.repository.CancellationRepository;
import com.app.seatbooking.repository.EventRepository;
import com.app.seatbooking.repository.EventScheduleRepository;
import com.app.seatbooking.repository.EventSeatRepository;
import com.app.seatbooking.repository.PaymentRepository;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class EventService {

    private final EventRepository eventRepository;
    private final EventScheduleRepository scheduleRepository;
    private final EventSeatRepository eventSeatRepository;
    private final BookingRepository bookingRepository;
    private final BookedSeatRepository bookedSeatRepository;
    private final PaymentRepository paymentRepository;
    private final CancellationRepository cancellationRepository;
    private final ConcertInventoryService concertInventoryService;

    public EventService(EventRepository eventRepository,
                            EventScheduleRepository scheduleRepository,
                            EventSeatRepository eventSeatRepository,
                            BookingRepository bookingRepository,
                            BookedSeatRepository bookedSeatRepository,
                            PaymentRepository paymentRepository,
                            CancellationRepository cancellationRepository,
                            ConcertInventoryService concertInventoryService) {
        this.eventRepository = eventRepository;
        this.scheduleRepository = scheduleRepository;
        this.eventSeatRepository = eventSeatRepository;
        this.bookingRepository = bookingRepository;
        this.bookedSeatRepository = bookedSeatRepository;
        this.paymentRepository = paymentRepository;
        this.cancellationRepository = cancellationRepository;
        this.concertInventoryService = concertInventoryService;
    }

    public EventDto createEvent(EventDto request) {
        Event event = EventDto.toEntity(request);
        event.setCategory(BookingDomainRules.normalizeEventCategory(event.getCategory()));
        Event saved = eventRepository.save(event);
        return toResponse(saved);
    }

    public EventDto updateEvent(Long eventId, EventDto request) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found: " + eventId));
        EventDto.updateEntity(event, request);
        event.setCategory(BookingDomainRules.normalizeEventCategory(event.getCategory()));
        Event saved = eventRepository.save(event);
        return toResponse(saved);
    }

    public EventDto getEventById(Long eventId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found: " + eventId));
        return toResponse(event);
    }

    public List<EventDto> getAllEvents() {
        return eventRepository.findAll().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public void deleteEvent(Long eventId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found: " + eventId));

        List<EventSchedule> schedules = scheduleRepository.findByEventEventId(eventId);
        if (!schedules.isEmpty()) {
            List<Long> scheduleIds = schedules.stream()
                    .map(EventSchedule::getScheduleId)
                    .collect(Collectors.toList());

            List<Booking> bookings = bookingRepository.findByScheduleScheduleIdIn(scheduleIds);
            if (!bookings.isEmpty()) {
                List<Long> bookingIds = bookings.stream()
                        .map(Booking::getBookingId)
                        .collect(Collectors.toList());

                cancellationRepository.deleteByBookingBookingIdIn(bookingIds);
                paymentRepository.deleteByBookingBookingIdIn(bookingIds);
                bookedSeatRepository.deleteByBookingBookingIdIn(bookingIds);
                bookingRepository.deleteAll(bookings);
            }

            List<EventSeat> eventSeats = eventSeatRepository.findByScheduleScheduleIdIn(scheduleIds);
            if (!eventSeats.isEmpty()) {
                List<Long> eventSeatIds = eventSeats.stream()
                        .map(EventSeat::getEventSeatId)
                        .collect(Collectors.toList());

                bookedSeatRepository.deleteByEventSeatEventSeatIdIn(eventSeatIds);
                eventSeatRepository.deleteAll(eventSeats);
            }

            concertInventoryService.deleteByScheduleIds(scheduleIds);
            scheduleRepository.deleteAll(schedules);
        }

        eventRepository.delete(event);
    }

    private EventDto toResponse(Event event) {
        return EventDto.toResponse(event);
    }
}



