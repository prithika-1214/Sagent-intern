package com.system.patient.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "vitals")
public class Vitals {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    private Integer heartRate;
    private Integer bpSystolic;
    private Integer bpDiastolic;
    private Integer oxygenLevel;
    private LocalDateTime recordedTime;

    @ManyToOne
    @JoinColumn(name = "patient_id")
    private Patient patient;

    public Vitals() {}

    public Vitals(Integer id, Integer heartRate,
                  Integer bpSystolic, Integer bpDiastolic,
                  Integer oxygenLevel, LocalDateTime recordedTime,
                  Patient patient) {
        this.id = id;
        this.heartRate = heartRate;
        this.bpSystolic = bpSystolic;
        this.bpDiastolic = bpDiastolic;
        this.oxygenLevel = oxygenLevel;
        this.recordedTime = recordedTime;
        this.patient = patient;
    }

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public Integer getHeartRate() { return heartRate; }
    public void setHeartRate(Integer heartRate) { this.heartRate = heartRate; }

    public Integer getBpSystolic() { return bpSystolic; }
    public void setBpSystolic(Integer bpSystolic) { this.bpSystolic = bpSystolic; }

    public Integer getBpDiastolic() { return bpDiastolic; }
    public void setBpDiastolic(Integer bpDiastolic) { this.bpDiastolic = bpDiastolic; }

    public Integer getOxygenLevel() { return oxygenLevel; }
    public void setOxygenLevel(Integer oxygenLevel) { this.oxygenLevel = oxygenLevel; }

    public LocalDateTime getRecordedTime() { return recordedTime; }
    public void setRecordedTime(LocalDateTime recordedTime) { this.recordedTime = recordedTime; }

    public Patient getPatient() { return patient; }
    public void setPatient(Patient patient) { this.patient = patient; }
}
