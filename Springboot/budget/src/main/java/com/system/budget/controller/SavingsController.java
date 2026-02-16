package com.system.budget.controller;

import com.system.budget.entity.Savings;
import com.system.budget.service.SavingsService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/savings")
public class SavingsController {

    private final SavingsService savingsService;

    public SavingsController(SavingsService savingsService) {
        this.savingsService = savingsService;
    }

    @PostMapping
    public Savings createSavings(@RequestBody Savings savings) {
        return savingsService.saveSavings(savings);
    }

    @GetMapping
    public List<Savings> getAllSavings() {
        return savingsService.getAllSavings();
    }

    @GetMapping("/{id}")
    public Savings getSavingsById(@PathVariable Integer id) {
        return savingsService.getSavingsById(id);
    }

    @PutMapping("/{id}")
    public Savings updateSavings(@PathVariable Integer id, @RequestBody Savings savings) {
        return savingsService.updateSavings(id, savings);
    }

    @DeleteMapping("/{id}")
    public String deleteSavings(@PathVariable Integer id) {
        savingsService.deleteSavings(id);
        return "Savings deleted successfully";
    }
}
