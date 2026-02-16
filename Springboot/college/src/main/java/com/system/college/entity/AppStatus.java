package com.system.college.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "app_status")
public class AppStatus {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer appStatusId;

    private String review;
    private String status;

    @ManyToOne
    @JoinColumn(name = "stu_id")
    private Student student;

    @ManyToOne
    @JoinColumn(name = "off_id")
    private Officer officer;

    public AppStatus() {}

    public Integer getAppStatusId() { return appStatusId; }
    public void setAppStatusId(Integer appStatusId) { this.appStatusId = appStatusId; }

    public String getReview() { return review; }
    public void setReview(String review) { this.review = review; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Student getStudent() { return student; }
    public void setStudent(Student student) { this.student = student; }

    public Officer getOfficer() { return officer; }
    public void setOfficer(Officer officer) { this.officer = officer; }
}
