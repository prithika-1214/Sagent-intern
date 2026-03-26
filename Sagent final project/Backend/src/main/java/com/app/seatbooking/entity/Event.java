package com.app.seatbooking.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "EVENTS")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Event {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "event_id")
    private Long eventId;

    @Column(name = "event_name", length = 150)
    private String eventName;

    @Column(name = "genre", length = 100)
    private String genre;

    @Column(name = "synopsis", columnDefinition = "TEXT")
    private String synopsis;

    @Column(name = "duration", precision = 5, scale = 2)
    private BigDecimal duration;

    @Column(name = "language", length = 50)
    private String language;

    @Column(name = "category", length = 50)
    private String category;

    @Column(name = "event_status", length = 30)
    private String eventStatus;

    @Lob
    @Column(name = "image_url", columnDefinition = "LONGTEXT")
    private String imageUrl;

    @Lob
    @Column(name = "trailer_url", columnDefinition = "LONGTEXT")
    private String trailerUrl;

    @Lob
    @Column(name = "cast_members", columnDefinition = "LONGTEXT")
    private String castMembersJson;

    @OneToMany(mappedBy = "event")
    private List<EventSchedule> schedules = new ArrayList<>();
}
