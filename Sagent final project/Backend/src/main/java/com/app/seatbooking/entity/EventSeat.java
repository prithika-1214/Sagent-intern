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
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "EVENT_SEATS")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class EventSeat {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "event_seat_id")
    private Long eventSeatId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "schedule_id")
    private EventSchedule schedule;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "seat_id")
    private Seat seat;

    @Column(name = "seat_price", precision = 10, scale = 2)
    private BigDecimal seatPrice;

    @Column(name = "seat_status", length = 30)
    private String seatStatus;

    @Column(name = "hold_token", length = 100)
    private String holdToken;

    @Column(name = "hold_expires_at")
    private LocalDateTime holdExpiresAt;

    @OneToMany(mappedBy = "eventSeat")
    private List<BookedSeat> bookedSeats = new ArrayList<>();
}
