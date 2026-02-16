package com.system.budget.service;

import com.system.budget.entity.Income;
import com.system.budget.repository.IncomeRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class IncomeService {

    private final IncomeRepository incomeRepository;

    public IncomeService(IncomeRepository incomeRepository) {
        this.incomeRepository = incomeRepository;
    }

    public Income saveIncome(Income income) {
        return incomeRepository.save(income);
    }

    public List<Income> getAllIncome() {
        return incomeRepository.findAll();
    }

    public Income getIncomeById(Integer id) {
        return incomeRepository.findById(id).orElse(null);
    }

    public Income updateIncome(Integer id, Income income) {
        income.setIncomeId(id);
        return incomeRepository.save(income);
    }

    public void deleteIncome(Integer id) {
        incomeRepository.deleteById(id);
    }
}
