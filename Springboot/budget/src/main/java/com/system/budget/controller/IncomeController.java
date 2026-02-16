package com.system.budget.controller;

import com.system.budget.entity.Income;
import com.system.budget.service.IncomeService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/income")
public class IncomeController {

    private final IncomeService incomeService;

    public IncomeController(IncomeService incomeService) {
        this.incomeService = incomeService;
    }

    @PostMapping
    public Income createIncome(@RequestBody Income income) {
        return incomeService.saveIncome(income);
    }

    @GetMapping
    public List<Income> getAllIncome() {
        return incomeService.getAllIncome();
    }

    @GetMapping("/{id}")
    public Income getIncomeById(@PathVariable Integer id) {
        return incomeService.getIncomeById(id);
    }

    @PutMapping("/{id}")
    public Income updateIncome(@PathVariable Integer id, @RequestBody Income income) {
        return incomeService.updateIncome(id, income);
    }

    @DeleteMapping("/{id}")
    public String deleteIncome(@PathVariable Integer id) {
        incomeService.deleteIncome(id);
        return "Income deleted successfully";
    }
}
