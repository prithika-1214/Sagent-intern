package com.app.seatbooking.controller;

import com.app.seatbooking.dto.EventSeatDto;
import com.app.seatbooking.dto.EventSeatHoldRequestDto;
import com.app.seatbooking.dto.EventSeatHoldResponseDto;
import com.app.seatbooking.service.EventSeatService;
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
@RequestMapping("/api/event-seats")
public class EventSeatController {

    private final EventSeatService eventSeatService;

    public EventSeatController(EventSeatService eventSeatService) {
        this.eventSeatService = eventSeatService;
    }

    @PostMapping
    public ResponseEntity<EventSeatDto> createEventSeat(@Valid @RequestBody EventSeatDto request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(eventSeatService.createEventSeat(request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<EventSeatDto> getEventSeat(@PathVariable("id") Long eventSeatId) {
        return ResponseEntity.ok(eventSeatService.getEventSeatById(eventSeatId));
    }

    @GetMapping
    public ResponseEntity<List<EventSeatDto>> getAllEventSeats() {
        return ResponseEntity.ok(eventSeatService.getAllEventSeats());
    }

    @GetMapping("/schedule/{scheduleId}")
    public ResponseEntity<List<EventSeatDto>> getEventSeatsByScheduleId(@PathVariable Long scheduleId) {
        return ResponseEntity.ok(eventSeatService.getEventSeatsByScheduleId(scheduleId));
    }

    @PostMapping("/hold")
    public ResponseEntity<EventSeatHoldResponseDto> holdEventSeats(@Valid @RequestBody EventSeatHoldRequestDto request) {
        return ResponseEntity.ok(eventSeatService.holdEventSeats(request));
    }

    @DeleteMapping("/hold/{holdToken}")
    public ResponseEntity<Void> releaseHold(@PathVariable String holdToken) {
        eventSeatService.releaseHold(holdToken);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}")
    public ResponseEntity<EventSeatDto> updateEventSeat(@PathVariable("id") Long eventSeatId,
                                                             @Valid @RequestBody EventSeatDto request) {
        return ResponseEntity.ok(eventSeatService.updateEventSeat(eventSeatId, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteEventSeat(@PathVariable("id") Long eventSeatId) {
        eventSeatService.deleteEventSeat(eventSeatId);
        return ResponseEntity.noContent().build();
    }
}


