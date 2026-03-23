package com.app.seatbooking.controller;

import com.app.seatbooking.dto.BookedSeatDto;
import com.app.seatbooking.service.BookedSeatService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/booked-seats")
public class BookedSeatController {

    private final BookedSeatService bookedSeatService;

    public BookedSeatController(BookedSeatService bookedSeatService) {
        this.bookedSeatService = bookedSeatService;
    }

    @PostMapping
    public ResponseEntity<BookedSeatDto> createBookedSeat(@Valid @RequestBody BookedSeatDto request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(bookedSeatService.createBookedSeat(request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<BookedSeatDto> getBookedSeat(@PathVariable("id") Long bookedSeatId) {
        return ResponseEntity.ok(bookedSeatService.getBookedSeatById(bookedSeatId));
    }

    @GetMapping
    public ResponseEntity<List<BookedSeatDto>> getAllBookedSeats() {
        return ResponseEntity.ok(bookedSeatService.getAllBookedSeats());
    }

    @GetMapping("/booking/{bookingId}")
    public ResponseEntity<List<BookedSeatDto>> getBookedSeatsByBookingId(@PathVariable Long bookingId) {
        return ResponseEntity.ok(bookedSeatService.getBookedSeatsByBookingId(bookingId));
    }

    @PutMapping("/{id}")
    public ResponseEntity<BookedSeatDto> updateBookedSeat(@PathVariable("id") Long bookedSeatId,
                                                               @Valid @RequestBody BookedSeatDto request) {
        return ResponseEntity.ok(bookedSeatService.updateBookedSeat(bookedSeatId, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBookedSeat(@PathVariable("id") Long bookedSeatId) {
        bookedSeatService.deleteBookedSeat(bookedSeatId);
        return ResponseEntity.noContent().build();
    }
}


