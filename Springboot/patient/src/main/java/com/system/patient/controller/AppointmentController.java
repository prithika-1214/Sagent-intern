package com.system.patient.controller;

import com.system.patient.entity.Appointment;
import com.system.patient.service.AppointmentService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/appointments")
public class AppointmentController {

    private final AppointmentService appointmentService;

    public AppointmentController(AppointmentService appointmentService) {
        this.appointmentService = appointmentService;
    }

    @PostMapping
    public Appointment create(@RequestBody Appointment appointment) {
        return appointmentService.save(appointment);
    }

    @GetMapping
    public List<Appointment> getAll() {
        return appointmentService.getAll();
    }

    @GetMapping("/{id}")
    public Appointment getById(@PathVariable Integer id) {
        return appointmentService.getById(id);
    }

    @PutMapping("/{id}")
    public Appointment update(@PathVariable Integer id, @RequestBody Appointment appointment) {
        return appointmentService.update(id, appointment);
    }

    @DeleteMapping("/{id}")
    public String delete(@PathVariable Integer id) {
        appointmentService.delete(id);
        return "Appointment deleted successfully";
    }
}
