package com.system.grocery.entity;

import jakarta.persistence.*;

@Entity
@Table(name="product")
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    private String name;
    private Double price;
    private Boolean available;

    @Column(name="category_id")
    private Integer categoryId;

    @Column(name="created_at")
    private String createdAt;

    public Product(){}

    public Integer getId(){ return id; }
    public void setId(Integer id){ this.id=id; }

    public String getName(){ return name; }
    public void setName(String name){ this.name=name; }

    public Double getPrice(){ return price; }
    public void setPrice(Double price){ this.price=price; }

    public Boolean getAvailable(){ return available; }
    public void setAvailable(Boolean available){ this.available=available; }

    public Integer getCategoryId(){ return categoryId; }
    public void setCategoryId(Integer categoryId){ this.categoryId=categoryId; }

    public String getCreatedAt(){ return createdAt; }
    public void setCreatedAt(String createdAt){ this.createdAt=createdAt; }
}
