package com.system.budget.service;

import com.system.budget.entity.Expense;
import com.system.budget.repository.ExpenseRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ExpenseService {

    private final ExpenseRepository expenseRepository;

    public ExpenseService(ExpenseRepository expenseRepository) {
        this.expenseRepository = expenseRepository;
    }

    public Expense saveExpense(Expense expense) {
        return expenseRepository.save(expense);
    }

    public List<Expense> getAllExpenses() {
        return expenseRepository.findAll();
    }

    public Expense getExpenseById(Integer id) {
        return expenseRepository.findById(id).orElse(null);
    }

    public Expense updateExpense(Integer id, Expense expense) {
        expense.setExpenseId(id);
        return expenseRepository.save(expense);
    }

    public void deleteExpense(Integer id) {
        expenseRepository.deleteById(id);
    }
}
