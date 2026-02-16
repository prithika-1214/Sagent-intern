package com.system.budget.entity;

import jakarta.persistence.*;

@Entity
public class Balance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer balanceId;

    private Double amount;

    @OneToOne
    @JoinColumn(name = "user_id", unique = true)
    private User user;

    public Balance() {
    }

    public Balance(Integer balanceId, Double amount, User user) {
        this.balanceId = balanceId;
        this.amount = amount;
        this.user = user;
    }

    public Integer getBalanceId() {
        return balanceId;
    }

    public void setBalanceId(Integer balanceId) {
        this.balanceId = balanceId;
    }

    public Double getAmount() {
        return amount;
    }

    public void setAmount(Double amount) {
        this.amount = amount;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }
}
