package com.system.grocery.entity;

import jakarta.persistence.*;

@Entity
@Table(name="store")
public class Store {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    private String name;
    private String location;
    private String contact;

    public Store(){}

    public Integer getId(){ return id; }
    public void setId(Integer id){ this.id=id; }

    public String getName(){ return name; }
    public void setName(String name){ this.name=name; }

    public String getLocation(){ return location; }
    public void setLocation(String location){ this.location=location; }

    public String getContact(){ return contact; }
    public void setContact(String contact){ this.contact=contact; }
}
