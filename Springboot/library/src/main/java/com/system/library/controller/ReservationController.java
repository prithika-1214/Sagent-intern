package com.system.library.controller;

import com.system.library.dto.ReservationRequest;
import com.system.library.entity.Reservation;
import com.system.library.service.ReservationService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/reservations")
public class ReservationController {

    private final ReservationService service;

    public ReservationController(ReservationService service) {
        this.service = service;
    }

    @PostMapping
    public Reservation create(@RequestBody ReservationRequest reservationRequest) {
        return service.create(reservationRequest);
    }

    @GetMapping
    public List<Reservation> getAll() {
        return service.getAll();
    }

    @GetMapping("/{id}")
    public Reservation getById(@PathVariable int id) {
        return service.getById(id);
    }

    @PutMapping("/{id}")
    public Reservation update(@PathVariable int id, @RequestBody ReservationRequest reservationRequest) {
        return service.update(id, reservationRequest);
    }

    @DeleteMapping("/{id}")
    public String delete(@PathVariable int id) {
        service.delete(id);
        return "Reservation deleted successfully";
    }
}
