package com.app.seatbooking.service;

import com.app.seatbooking.dto.BookedSeatDto;
import com.app.seatbooking.entity.BookedSeat;
import com.app.seatbooking.entity.Booking;
import com.app.seatbooking.entity.EventSeat;
import com.app.seatbooking.exception.ResourceNotFoundException;
import com.app.seatbooking.repository.BookedSeatRepository;
import com.app.seatbooking.repository.BookingRepository;
import com.app.seatbooking.repository.EventSeatRepository;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;

@Service
public class BookedSeatService {

    private final BookedSeatRepository bookedSeatRepository;
    private final BookingRepository bookingRepository;
    private final EventSeatRepository eventSeatRepository;

    public BookedSeatService(BookedSeatRepository bookedSeatRepository,
                                 BookingRepository bookingRepository,
                                 EventSeatRepository eventSeatRepository) {
        this.bookedSeatRepository = bookedSeatRepository;
        this.bookingRepository = bookingRepository;
        this.eventSeatRepository = eventSeatRepository;
    }

    public BookedSeatDto createBookedSeat(BookedSeatDto request) {
        Booking booking = bookingRepository.findById(request.getBookingId())
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found: " + request.getBookingId()));
        EventSeat eventSeat = eventSeatRepository.findById(request.getEventSeatId())
                .orElseThrow(() -> new ResourceNotFoundException("Event seat not found: " + request.getEventSeatId()));
        BookedSeat bookedSeat = BookedSeatDto.toEntity(booking, eventSeat);
        BookedSeat saved = bookedSeatRepository.save(bookedSeat);
        return BookedSeatDto.toResponse(saved);
    }

    public BookedSeatDto updateBookedSeat(Long bookedSeatId, BookedSeatDto request) {
        BookedSeat bookedSeat = bookedSeatRepository.findById(bookedSeatId)
                .orElseThrow(() -> new ResourceNotFoundException("Booked seat not found: " + bookedSeatId));
        Booking booking = bookingRepository.findById(request.getBookingId())
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found: " + request.getBookingId()));
        EventSeat eventSeat = eventSeatRepository.findById(request.getEventSeatId())
                .orElseThrow(() -> new ResourceNotFoundException("Event seat not found: " + request.getEventSeatId()));
        BookedSeatDto.updateEntity(bookedSeat, booking, eventSeat);
        BookedSeat saved = bookedSeatRepository.save(bookedSeat);
        return BookedSeatDto.toResponse(saved);
    }

    public BookedSeatDto getBookedSeatById(Long bookedSeatId) {
        BookedSeat bookedSeat = bookedSeatRepository.findById(bookedSeatId)
                .orElseThrow(() -> new ResourceNotFoundException("Booked seat not found: " + bookedSeatId));
        return BookedSeatDto.toResponse(bookedSeat);
    }

    public List<BookedSeatDto> getAllBookedSeats() {
        return bookedSeatRepository.findAll().stream()
                .map(BookedSeatDto::toResponse)
                .collect(Collectors.toList());
    }

    public List<BookedSeatDto> getBookedSeatsByBookingId(Long bookingId) {
        return bookedSeatRepository.findByBookingBookingId(bookingId).stream()
                .map(BookedSeatDto::toResponse)
                .collect(Collectors.toList());
    }

    public void deleteBookedSeat(Long bookedSeatId) {
        BookedSeat bookedSeat = bookedSeatRepository.findById(bookedSeatId)
                .orElseThrow(() -> new ResourceNotFoundException("Booked seat not found: " + bookedSeatId));
        bookedSeatRepository.delete(bookedSeat);
    }
}
