package com.system.grocery.entity;

import jakarta.persistence.*;

@Entity
@Table(name="delivery_agent")
public class DeliveryAgent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    private String name;
    private String phone;

    @Column(name="vehicle_no")
    private String vehicleNo;

    public DeliveryAgent(){}

    public Integer getId(){ return id; }
    public void setId(Integer id){ this.id=id; }

    public String getName(){ return name; }
    public void setName(String name){ this.name=name; }

    public String getPhone(){ return phone; }
    public void setPhone(String phone){ this.phone=phone; }

    public String getVehicleNo(){ return vehicleNo; }
    public void setVehicleNo(String vehicleNo){ this.vehicleNo=vehicleNo; }
}
