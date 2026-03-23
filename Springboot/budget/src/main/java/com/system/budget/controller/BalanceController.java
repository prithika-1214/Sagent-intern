package com.system.budget.controller;

import com.system.budget.entity.Balance;
import com.system.budget.service.BalanceService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/balance")
public class BalanceController {

    private final BalanceService balanceService;

    public BalanceController(BalanceService balanceService) {
        this.balanceService = balanceService;
    }

    @PostMapping
    public Balance createBalance(@RequestBody Balance balance) {
        return balanceService.saveBalance(balance);
    }

    @GetMapping
    public List<Balance> getAllBalance() {
        return balanceService.getAllBalance();
    }

    @GetMapping("/{id}")
    public Balance getBalanceById(@PathVariable Integer id) {
        return balanceService.getBalanceById(id);
    }

    @PutMapping("/{id}")
    public Balance updateBalance(@PathVariable Integer id, @RequestBody Balance balance) {
        return balanceService.updateBalance(id, balance);
    }

    @DeleteMapping("/{id}")
    public String deleteBalance(@PathVariable Integer id) {
        balanceService.deleteBalance(id);
        return "Balance deleted successfully";
    }
}
