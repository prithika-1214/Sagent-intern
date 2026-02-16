package com.system.budget.controller;

import com.system.budget.entity.Expense;
import com.system.budget.service.ExpenseService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/expenses")
public class ExpenseController {

    private final ExpenseService expenseService;

    public ExpenseController(ExpenseService expenseService) {
        this.expenseService = expenseService;
    }

    @PostMapping
    public Expense createExpense(@RequestBody Expense expense) {
        return expenseService.saveExpense(expense);
    }

    @GetMapping
    public List<Expense> getAllExpenses() {
        return expenseService.getAllExpenses();
    }

    @GetMapping("/{id}")
    public Expense getExpenseById(@PathVariable Integer id) {
        return expenseService.getExpenseById(id);
    }

    @PutMapping("/{id}")
    public Expense updateExpense(@PathVariable Integer id, @RequestBody Expense expense) {
        return expenseService.updateExpense(id, expense);
    }

    @DeleteMapping("/{id}")
    public String deleteExpense(@PathVariable Integer id) {
        expenseService.deleteExpense(id);
        return "Expense deleted successfully";
    }
}
