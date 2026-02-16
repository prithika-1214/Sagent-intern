package com.system.patient.controller;

import com.system.patient.entity.Patient;
import com.system.patient.service.PatientService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/patients")
public class PatientController {

    private final PatientService patientService;

    public PatientController(PatientService patientService) {
        this.patientService = patientService;
    }

    @PostMapping
    public Patient create(@RequestBody Patient patient) {
        return patientService.save(patient);
    }

    @GetMapping
    public List<Patient> getAll() {
        return patientService.getAll();
    }

    @GetMapping("/{id}")
    public Patient getById(@PathVariable Integer id) {
        return patientService.getById(id);
    }

    @PutMapping("/{id}")
    public Patient update(@PathVariable Integer id, @RequestBody Patient patient) {
        return patientService.update(id, patient);
    }

    @DeleteMapping("/{id}")
    public String delete(@PathVariable Integer id) {
        patientService.delete(id);
        return "Deleted Successfully";
    }
}
