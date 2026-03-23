package com.system.budget.service;

import com.system.budget.entity.Savings;
import com.system.budget.repository.SavingsRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class SavingsService {

    private final SavingsRepository savingsRepository;

    public SavingsService(SavingsRepository savingsRepository) {
        this.savingsRepository = savingsRepository;
    }

    public Savings saveSavings(Savings savings) {
        return savingsRepository.save(savings);
    }

    public List<Savings> getAllSavings() {
        return savingsRepository.findAll();
    }

    public Savings getSavingsById(Integer id) {
        return savingsRepository.findById(id).orElse(null);
    }

    public Savings updateSavings(Integer id, Savings savings) {
        savings.setSavingsId(id);
        return savingsRepository.save(savings);
    }

    public void deleteSavings(Integer id) {
        savingsRepository.deleteById(id);
    }
}
