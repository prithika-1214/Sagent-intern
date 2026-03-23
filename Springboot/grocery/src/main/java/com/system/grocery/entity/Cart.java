package com.system.grocery.entity;

import jakarta.persistence.*;

@Entity
@Table(name="cart")
public class Cart {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name="user_id")
    private Integer userId;

    @Column(name="created_at")
    private String createdAt;

    public Cart(){}

    public Integer getId(){ return id; }
    public void setId(Integer id){ this.id=id; }

    public Integer getUserId(){ return userId; }
    public void setUserId(Integer userId){ this.userId=userId; }

    public String getCreatedAt(){ return createdAt; }
    public void setCreatedAt(String createdAt){ this.createdAt=createdAt; }
}
