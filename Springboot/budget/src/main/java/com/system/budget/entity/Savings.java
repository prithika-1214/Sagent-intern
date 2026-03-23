package com.system.budget.entity;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
public class Savings {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer savingsId;

    private Double amount;

    private LocalDate savingsDate;

    private Double targetAmt;

    private String description;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    public Savings() {
    }

    public Savings(Integer savingsId, Double amount,
                   LocalDate savingsDate, Double targetAmt,
                   String description, User user) {
        this.savingsId = savingsId;
        this.amount = amount;
        this.savingsDate = savingsDate;
        this.targetAmt = targetAmt;
        this.description = description;
        this.user = user;
    }

    public Integer getSavingsId() {
        return savingsId;
    }

    public void setSavingsId(Integer savingsId) {
        this.savingsId = savingsId;
    }

    public Double getAmount() {
        return amount;
    }

    public void setAmount(Double amount) {
        this.amount = amount;
    }

    public LocalDate getSavingsDate() {
        return savingsDate;
    }

    public void setSavingsDate(LocalDate savingsDate) {
        this.savingsDate = savingsDate;
    }

    public Double getTargetAmt() {
        return targetAmt;
    }

    public void setTargetAmt(Double targetAmt) {
        this.targetAmt = targetAmt;
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
