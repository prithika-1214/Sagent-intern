package com.system.patient.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "feedback")
public class Feedback {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    private String response;
    private Integer rating;

    @OneToOne
    @JoinColumn(name = "appointment_id", unique = true)
    private Appointment appointment;

    public Feedback() {}

    public Feedback(Integer id, String response,
                    Integer rating, Appointment appointment) {
        this.id = id;
        this.response = response;
        this.rating = rating;
        this.appointment = appointment;
    }

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public String getResponse() { return response; }
    public void setResponse(String response) { this.response = response; }

    public Integer getRating() { return rating; }
    public void setRating(Integer rating) { this.rating = rating; }

    public Appointment getAppointment() { return appointment; }
    public void setAppointment(Appointment appointment) { this.appointment = appointment; }
}
