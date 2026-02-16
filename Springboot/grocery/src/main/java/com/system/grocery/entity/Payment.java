package com.system.grocery.entity;

import jakarta.persistence.*;

@Entity
@Table(name="payment")
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name="order_id")
    private Integer orderId;

    private String method;
    private Double amount;
    private String status;

    @Column(name="paid_time")
    private String paidTime;

    public Payment(){}

    public Integer getId(){ return id; }
    public void setId(Integer id){ this.id=id; }

    public Integer getOrderId(){ return orderId; }
    public void setOrderId(Integer orderId){ this.orderId=orderId; }

    public String getMethod(){ return method; }
    public void setMethod(String method){ this.method=method; }

    public Double getAmount(){ return amount; }
    public void setAmount(Double amount){ this.amount=amount; }

    public String getStatus(){ return status; }
    public void setStatus(String status){ this.status=status; }

    public String getPaidTime(){ return paidTime; }
    public void setPaidTime(String paidTime){ this.paidTime=paidTime; }
}
