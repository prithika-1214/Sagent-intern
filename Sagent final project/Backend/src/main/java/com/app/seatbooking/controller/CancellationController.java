package com.app.seatbooking.controller;

import com.app.seatbooking.dto.CancellationDto;
import com.app.seatbooking.dto.CancellationUpdateDto;
import com.app.seatbooking.service.CancellationService;
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
@RequestMapping("/api/cancellations")
public class CancellationController {

    private final CancellationService cancellationService;

    public CancellationController(CancellationService cancellationService) {
        this.cancellationService = cancellationService;
    }

    @PostMapping
    public ResponseEntity<CancellationDto> createCancellation(@Valid @RequestBody CancellationDto request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(cancellationService.createCancellation(request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<CancellationDto> getCancellation(@PathVariable("id") Long cancellationId) {
        return ResponseEntity.ok(cancellationService.getCancellationById(cancellationId));
    }

    @GetMapping
    public ResponseEntity<List<CancellationDto>> getAllCancellations() {
        return ResponseEntity.ok(cancellationService.getAllCancellations());
    }

    @PutMapping("/{id}")
    public ResponseEntity<CancellationDto> updateCancellation(@PathVariable("id") Long cancellationId,
                                                                   @Valid @RequestBody CancellationUpdateDto request) {
        return ResponseEntity.ok(cancellationService.updateCancellation(cancellationId, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCancellation(@PathVariable("id") Long cancellationId) {
        cancellationService.deleteCancellation(cancellationId);
        return ResponseEntity.noContent().build();
    }
}


