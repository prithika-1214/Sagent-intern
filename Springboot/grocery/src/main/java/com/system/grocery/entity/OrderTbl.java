package com.system.grocery.entity;

import jakarta.persistence.*;

@Entity
@Table(name="order_tbl")
public class OrderTbl {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name="user_id")
    private Integer userId;

    @Column(name="cart_id")
    private Integer cartId;

    @Column(name="store_id")
    private Integer storeId;

    private String status;

    @Column(name="total_amount")
    private Double totalAmount;

    @Column(name="order_time")
    private String orderTime;

    @Column(name="delivery_address")
    private String deliveryAddress;

    public OrderTbl(){}

    public Integer getId(){ return id; }
    public void setId(Integer id){ this.id=id; }

    public Integer getUserId(){ return userId; }
    public void setUserId(Integer userId){ this.userId=userId; }

    public Integer getCartId(){ return cartId; }
    public void setCartId(Integer cartId){ this.cartId=cartId; }

    public Integer getStoreId(){ return storeId; }
    public void setStoreId(Integer storeId){ this.storeId=storeId; }

    public String getStatus(){ return status; }
    public void setStatus(String status){ this.status=status; }

    public Double getTotalAmount(){ return totalAmount; }
    public void setTotalAmount(Double totalAmount){ this.totalAmount=totalAmount; }

    public String getOrderTime(){ return orderTime; }
    public void setOrderTime(String orderTime){ this.orderTime=orderTime; }

    public String getDeliveryAddress(){ return deliveryAddress; }
    public void setDeliveryAddress(String deliveryAddress){ this.deliveryAddress=deliveryAddress; }
}
