package com.system.college.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "course")
public class Course {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer couId;

    private String couName;
    private String dept;
    private Integer durationDays;

    public Course() {}

    public Integer getCouId() { return couId; }

    public void setCouId(Integer couId) { this.couId = couId; }

    public String getCouName() { return couName; }
    public void setCouName(String couName) { this.couName = couName; }

    public String getDept() { return dept; }
    public void setDept(String dept) { this.dept = dept; }

    public Integer getDurationDays() { return durationDays; }
    public void setDurationDays(Integer durationDays) { this.durationDays = durationDays; }
}
