package com.app.seatbooking.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "EVENT_SCHEDULES")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class EventSchedule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "schedule_id")
    private Long scheduleId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id")
    private Event event;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "venue_id")
    private Venue venue;

    @Column(name = "audi_id", length = 50)
    private String audiId;

    @Column(name = "audi_name", length = 100)
    private String audiName;

    @Column(name = "show_date")
    private LocalDate showDate;

    @Column(name = "show_time")
    private LocalTime showTime;

    @Column(name = "available_seats")
    private Integer availableSeats;

    @Column(name = "schedule_status", length = 30)
    private String scheduleStatus;

    @OneToMany(mappedBy = "schedule")
    private List<EventSeat> eventSeats = new ArrayList<>();

    @OneToMany(mappedBy = "schedule")
    private List<Booking> bookings = new ArrayList<>();
}
