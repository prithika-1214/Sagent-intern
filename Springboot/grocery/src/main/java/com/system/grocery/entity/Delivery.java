package com.system.grocery.entity;

import jakarta.persistence.*;

@Entity
@Table(name="delivery")
public class Delivery {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name="order_id")
    private Integer orderId;

    @Column(name="agent_id")
    private Integer agentId;

    private String status;

    @Column(name="delivery_time")
    private String deliveryTime;

    public Delivery(){}

    public Integer getId(){ return id; }
    public void setId(Integer id){ this.id=id; }

    public Integer getOrderId(){ return orderId; }
    public void setOrderId(Integer orderId){ this.orderId=orderId; }

    public Integer getAgentId(){ return agentId; }
    public void setAgentId(Integer agentId){ this.agentId=agentId; }

    public String getStatus(){ return status; }
    public void setStatus(String status){ this.status=status; }

    public String getDeliveryTime(){ return deliveryTime; }
    public void setDeliveryTime(String deliveryTime){ this.deliveryTime=deliveryTime; }
}
