package com.app.seatbooking.controller;

import com.app.seatbooking.dto.VenueDto;
import com.app.seatbooking.service.VenueService;
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
    @RequestMapping("/api/venues")
public class VenueController {

    private final VenueService venueService;

    public VenueController(VenueService venueService) {
        this.venueService = venueService;
    }

    @PostMapping
    public ResponseEntity<VenueDto> createVenue(@Valid @RequestBody VenueDto request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(venueService.createVenue(request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<VenueDto> getVenue(@PathVariable("id") Long venueId) {
        return ResponseEntity.ok(venueService.getVenueById(venueId));
    }

    @GetMapping
    public ResponseEntity<List<VenueDto>> getAllVenues() {
        return ResponseEntity.ok(venueService.getAllVenues());
    }

    @PutMapping("/{id}")
    public ResponseEntity<VenueDto> updateVenue(@PathVariable("id") Long venueId,
                                                     @Valid @RequestBody VenueDto request) {
        return ResponseEntity.ok(venueService.updateVenue(venueId, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteVenue(@PathVariable("id") Long venueId) {
        venueService.deleteVenue(venueId);
        return ResponseEntity.noContent().build();
    }
}


