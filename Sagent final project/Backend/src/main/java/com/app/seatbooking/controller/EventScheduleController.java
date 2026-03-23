package com.app.seatbooking.controller;

import com.app.seatbooking.dto.EventScheduleDto;
import com.app.seatbooking.service.EventScheduleService;
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
@RequestMapping("/api/event-schedules")
public class EventScheduleController {

    private final EventScheduleService scheduleService;

    public EventScheduleController(EventScheduleService scheduleService) {
        this.scheduleService = scheduleService;
    }

    @PostMapping
    public ResponseEntity<EventScheduleDto> createSchedule(@Valid @RequestBody EventScheduleDto request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(scheduleService.createSchedule(request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<EventScheduleDto> getSchedule(@PathVariable("id") Long scheduleId) {
        return ResponseEntity.ok(scheduleService.getScheduleById(scheduleId));
    }

    @GetMapping
    public ResponseEntity<List<EventScheduleDto>> getAllSchedules() {
        return ResponseEntity.ok(scheduleService.getAllSchedules());
    }

    @GetMapping("/event/{eventId}")
    public ResponseEntity<List<EventScheduleDto>> getSchedulesByEventId(@PathVariable Long eventId) {
        return ResponseEntity.ok(scheduleService.getSchedulesByEventId(eventId));
    }

    @PutMapping("/{id}")
    public ResponseEntity<EventScheduleDto> updateSchedule(@PathVariable("id") Long scheduleId,
                                                                @Valid @RequestBody EventScheduleDto request) {
        return ResponseEntity.ok(scheduleService.updateSchedule(scheduleId, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSchedule(@PathVariable("id") Long scheduleId) {
        scheduleService.deleteSchedule(scheduleId);
        return ResponseEntity.noContent().build();
    }
}


