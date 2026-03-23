package com.system.budget.entity;

import jakarta.persistence.*;

@Entity
public class Category {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer catId;

    private String catName;

    private Double limitAmount;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    public Category() {
    }

    public Category(Integer catId, String catName, Double limitAmount, User user) {
        this.catId = catId;
        this.catName = catName;
        this.limitAmount = limitAmount;
        this.user = user;
    }

    public Integer getCatId() {
        return catId;
    }

    public void setCatId(Integer catId) {
        this.catId = catId;
    }

    public String getCatName() {
        return catName;
    }

    public void setCatName(String catName) {
        this.catName = catName;
    }

    public Double getLimitAmount() {
        return limitAmount;
    }

    public void setLimitAmount(Double limitAmount) {
        this.limitAmount = limitAmount;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }
}
