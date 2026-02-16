package com.system.budget.service;

import com.system.budget.entity.Balance;
import com.system.budget.repository.BalanceRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class BalanceService {

    private final BalanceRepository balanceRepository;

    public BalanceService(BalanceRepository balanceRepository) {
        this.balanceRepository = balanceRepository;
    }

    public Balance saveBalance(Balance balance) {
        return balanceRepository.save(balance);
    }

    public List<Balance> getAllBalance() {
        return balanceRepository.findAll();
    }

    public Balance getBalanceById(Integer id) {
        return balanceRepository.findById(id).orElse(null);
    }

    public Balance updateBalance(Integer id, Balance balance) {
        balance.setBalanceId(id);
        return balanceRepository.save(balance);
    }

    public void deleteBalance(Integer id) {
        balanceRepository.deleteById(id);
    }
}
