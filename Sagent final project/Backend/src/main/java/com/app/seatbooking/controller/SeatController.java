package com.app.seatbooking.controller;

import com.app.seatbooking.dto.ConcertInventoryDto;
import com.app.seatbooking.dto.SeatDto;
import com.app.seatbooking.service.SeatService;
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
@RequestMapping("/api/seats")
public class SeatController {

    private final SeatService seatService;

    public SeatController(SeatService seatService) {
        this.seatService = seatService;
    }

    @PostMapping
    public ResponseEntity<SeatDto> createSeat(@Valid @RequestBody SeatDto request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(seatService.createSeat(request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<SeatDto> getSeat(@PathVariable("id") Long seatId) {
        return ResponseEntity.ok(seatService.getSeatById(seatId));
    }

    @GetMapping
    public ResponseEntity<List<SeatDto>> getAllSeats() {
        return ResponseEntity.ok(seatService.getAllSeats());
    }

    @GetMapping("/concert-inventory/schedule/{scheduleId}")
    public ResponseEntity<List<ConcertInventoryDto>> getConcertInventoryByScheduleId(@PathVariable Long scheduleId) {
        return ResponseEntity.ok(seatService.getConcertInventoryByScheduleId(scheduleId));
    }

    @PutMapping("/{id}")
    public ResponseEntity<SeatDto> updateSeat(@PathVariable("id") Long seatId,
                                                   @Valid @RequestBody SeatDto request) {
        return ResponseEntity.ok(seatService.updateSeat(seatId, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSeat(@PathVariable("id") Long seatId) {
        seatService.deleteSeat(seatId);
        return ResponseEntity.noContent().build();
    }
}
