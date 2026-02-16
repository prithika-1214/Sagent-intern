package com.system.grocery.entity;

import jakarta.persistence.*;

@Entity
@Table(name="cart_item")
public class CartItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name="cart_id")
    private Integer cartId;

    @Column(name="product_id")
    private Integer productId;

    private Integer quantity;

    @Column(name="price_at_time")
    private Double priceAtTime;

    public CartItem(){}

    public Integer getId(){ return id; }
    public void setId(Integer id){ this.id=id; }

    public Integer getCartId(){ return cartId; }
    public void setCartId(Integer cartId){ this.cartId=cartId; }

    public Integer getProductId(){ return productId; }
    public void setProductId(Integer productId){ this.productId=productId; }

    public Integer getQuantity(){ return quantity; }
    public void setQuantity(Integer quantity){ this.quantity=quantity; }

    public Double getPriceAtTime(){ return priceAtTime; }
    public void setPriceAtTime(Double priceAtTime){ this.priceAtTime=priceAtTime; }
}
