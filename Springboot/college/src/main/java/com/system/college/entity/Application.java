package com.system.college.entity;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "application")
public class Application {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer appId;

    private String address;
    private Float percentage;
    private LocalDate subDate;

    @ManyToOne
    @JoinColumn(name = "stu_id")
    private Student student;

    @ManyToOne
    @JoinColumn(name = "cou_id")
    private Course course;

    public Application() {}

    public Integer getAppId() { return appId; }
    public void setAppId(Integer appId) { this.appId = appId; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public Float getPercentage() { return percentage; }
    public void setPercentage(Float percentage) { this.percentage = percentage; }

    public LocalDate getSubDate() { return subDate; }
    public void setSubDate(LocalDate subDate) { this.subDate = subDate; }

    public Student getStudent() { return student; }
    public void setStudent(Student student) { this.student = student; }

    public Course getCourse() { return course; }
    public void setCourse(Course course) { this.course = course; }
}
