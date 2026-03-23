package com.system.college.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "document")
public class Document {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer docId;

    private String type;
    private String docUpload;

    @ManyToOne
    @JoinColumn(name = "app_id")
    private Application application;

    public Document() {}

    public Integer getDocId() { return docId; }
    public void setDocId(Integer docId) { this.docId = docId; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getDocUpload() { return docUpload; }
    public void setDocUpload(String docUpload) { this.docUpload = docUpload; }

    public Application getApplication() { return application; }
    public void setApplication(Application application) { this.application = application; }
}
