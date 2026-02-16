package com.system.grocery.entity;

import jakarta.persistence.*;

@Entity
@Table(name="user")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    private String name;
    private String address;
    private String contact;

    @Column(name="created_at")
    private String createdAt;

    public User(){}

    public Integer getId(){ return id; }
    public void setId(Integer id){ this.id = id; }

    public String getName(){ return name; }
    public void setName(String name){ this.name = name; }

    public String getAddress(){ return address; }
    public void setAddress(String address){ this.address = address; }

    public String getContact(){ return contact; }
    public void setContact(String contact){ this.contact = contact; }

    public String getCreatedAt(){ return createdAt; }
    public void setCreatedAt(String createdAt){ this.createdAt = createdAt; }
}
