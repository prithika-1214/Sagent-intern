package com.system.budget.entity;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
public class Income {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer incomeId;

    private String incomeType;

    private Double amount;

    private LocalDate incomeDate;

    private String description;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    public Income() {
    }

    public Income(Integer incomeId, String incomeType, Double amount,
                  LocalDate incomeDate, String description, User user) {
        this.incomeId = incomeId;
        this.incomeType = incomeType;
        this.amount = amount;
        this.incomeDate = incomeDate;
        this.description = description;
        this.user = user;
    }

    public Integer getIncomeId() {
        return incomeId;
    }

    public void setIncomeId(Integer incomeId) {
        this.incomeId = incomeId;
    }

    public String getIncomeType() {
        return incomeType;
    }

    public void setIncomeType(String incomeType) {
        this.incomeType = incomeType;
    }

    public Double getAmount() {
        return amount;
    }

    public void setAmount(Double amount) {
        this.amount = amount;
    }

    public LocalDate getIncomeDate() {
        return incomeDate;
    }

    public void setIncomeDate(LocalDate incomeDate) {
        this.incomeDate = incomeDate;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }
}
