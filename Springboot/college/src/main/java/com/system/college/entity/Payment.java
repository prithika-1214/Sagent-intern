package com.system.college.entity;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "payment")
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer payId;

    private String payMethod;
    private Integer fee;
    private LocalDate payDate;
    private String transactionId;
    private String status;

    @OneToOne
    @JoinColumn(name = "app_id")
    private Application application;

    public Payment() {}

    public Integer getPayId() { return payId; }
    public void setPayId(Integer payId) { this.payId = payId; }

    public String getPayMethod() { return payMethod; }
    public void setPayMethod(String payMethod) { this.payMethod = payMethod; }

    public Integer getFee() { return fee; }
    public void setFee(Integer fee) { this.fee = fee; }

    public LocalDate getPayDate() { return payDate; }
    public void setPayDate(LocalDate payDate) { this.payDate = payDate; }

    public String getTransactionId() { return transactionId; }
    public void setTransactionId(String transactionId) { this.transactionId = transactionId; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Application getApplication() { return application; }
    public void setApplication(Application application) { this.application = application; }
}
