package com.system.patient.controller;

import com.system.patient.entity.Doctor;
import com.system.patient.service.DoctorService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/doctors")
public class DoctorController {

    private final DoctorService doctorService;

    public DoctorController(DoctorService doctorService) {
        this.doctorService = doctorService;
    }

    @PostMapping
    public Doctor create(@RequestBody Doctor doctor) {
        return doctorService.save(doctor);
    }

    @GetMapping
    public List<Doctor> getAll() {
        return doctorService.getAll();
    }

    @GetMapping("/{id}")
    public Doctor getById(@PathVariable Integer id) {
        return doctorService.getById(id);
    }

    @PutMapping("/{id}")
    public Doctor update(@PathVariable Integer id, @RequestBody Doctor doctor) {
        return doctorService.update(id, doctor);
    }

    @DeleteMapping("/{id}")
    public String delete(@PathVariable Integer id) {
        doctorService.delete(id);
        return "Doctor deleted successfully";
    }
}
