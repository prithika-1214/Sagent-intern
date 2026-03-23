package com.system.patient.controller;

import com.system.patient.entity.MedicalHistory;
import com.system.patient.service.MedicalHistoryService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/medical-history")
public class MedicalHistoryController {

    private final MedicalHistoryService medicalHistoryService;

    public MedicalHistoryController(MedicalHistoryService medicalHistoryService) {
        this.medicalHistoryService = medicalHistoryService;
    }

    @PostMapping
    public MedicalHistory create(@RequestBody MedicalHistory history) {
        return medicalHistoryService.save(history);
    }

    @GetMapping
    public List<MedicalHistory> getAll() {
        return medicalHistoryService.getAll();
    }

    @GetMapping("/{id}")
    public MedicalHistory getById(@PathVariable Integer id) {
        return medicalHistoryService.getById(id);
    }

    @PutMapping("/{id}")
    public MedicalHistory update(@PathVariable Integer id, @RequestBody MedicalHistory history) {
        return medicalHistoryService.update(id, history);
    }

    @DeleteMapping("/{id}")
    public String delete(@PathVariable Integer id) {
        medicalHistoryService.delete(id);
        return "Medical history deleted successfully";
    }
}
