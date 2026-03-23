package com.system.college.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "review_record")
public class ReviewRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer recId;

    @ManyToOne
    @JoinColumn(name = "app_id")
    private Application application;

    @ManyToOne
    @JoinColumn(name = "off_id")
    private Officer officer;

    public ReviewRecord() {}

    public Integer getRecId() { return recId; }
    public void setRecId(Integer recId) { this.recId = recId; }

    public Application getApplication() { return application; }
    public void setApplication(Application application) { this.application = application; }

    public Officer getOfficer() { return officer; }
    public void setOfficer(Officer officer) { this.officer = officer; }
}
