package com.system.patient.controller;

import com.system.patient.entity.Vitals;
import com.system.patient.service.VitalsService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/vitals")
public class VitalsController {

    private final VitalsService vitalsService;

    public VitalsController(VitalsService vitalsService) {
        this.vitalsService = vitalsService;
    }

    @PostMapping
    public Vitals create(@RequestBody Vitals vitals) {
        return vitalsService.save(vitals);
    }

    @GetMapping
    public List<Vitals> getAll() {
        return vitalsService.getAll();
    }

    @GetMapping("/{id}")
    public Vitals getById(@PathVariable Integer id) {
        return vitalsService.getById(id);
    }

    @PutMapping("/{id}")
    public Vitals update(@PathVariable Integer id, @RequestBody Vitals vitals) {
        return vitalsService.update(id, vitals);
    }

    @DeleteMapping("/{id}")
    public String delete(@PathVariable Integer id) {
        vitalsService.delete(id);
        return "Vitals deleted successfully";
    }
}
