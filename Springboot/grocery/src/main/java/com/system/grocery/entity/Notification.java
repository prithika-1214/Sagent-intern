package com.system.grocery.entity;

import jakarta.persistence.*;

@Entity
@Table(name="notification")
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name="user_id")
    private Integer userId;

    @Column(name="order_id")
    private Integer orderId;

    private String message;
    private String type;

    @Column(name="is_read")
    private Boolean isRead;

    @Column(name="created_at")
    private String createdAt;

    public Notification(){}

    public Integer getId(){ return id; }
    public void setId(Integer id){ this.id=id; }

    public Integer getUserId(){ return userId; }
    public void setUserId(Integer userId){ this.userId=userId; }

    public Integer getOrderId(){ return orderId; }
    public void setOrderId(Integer orderId){ this.orderId=orderId; }

    public String getMessage(){ return message; }
    public void setMessage(String message){ this.message=message; }

    public String getType(){ return type; }
    public void setType(String type){ this.type=type; }

    public Boolean getIsRead(){ return isRead; }
    public void setIsRead(Boolean isRead){ this.isRead=isRead; }

    public String getCreatedAt(){ return createdAt; }
    public void setCreatedAt(String createdAt){ this.createdAt=createdAt; }
}
