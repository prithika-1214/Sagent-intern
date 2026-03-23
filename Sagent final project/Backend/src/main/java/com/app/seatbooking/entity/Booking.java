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
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "BOOKINGS")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Booking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "booking_id")
    private Long bookingId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "schedule_id")
    private EventSchedule schedule;

    @Column(name = "booking_date")
    private LocalDateTime bookingDate;

    @Column(name = "booking_status", length = 30)
    private String bookingStatus;

    @Column(name = "ticket_category_id")
    private Long ticketCategoryId;

    @Column(name = "ticket_seat_id")
    private Long ticketSeatId;

    @Column(name = "ticket_category_name", length = 100)
    private String ticketCategoryName;

    @Column(name = "ticket_quantity")
    private Integer ticketQuantity;

    @Column(name = "ticket_unit_price", precision = 10, scale = 2)
    private java.math.BigDecimal ticketUnitPrice;

    @Column(name = "reminder_sent", nullable = false)
    private Boolean reminderSent = Boolean.FALSE;

    @OneToMany(mappedBy = "booking")
    private List<BookedSeat> bookedSeats = new ArrayList<>();

    @OneToMany(mappedBy = "booking")
    private List<Payment> payments = new ArrayList<>();

    @OneToMany(mappedBy = "booking")
    private List<Cancellation> cancellations = new ArrayList<>();

    @PrePersist
    public void onCreate() {
        if (reminderSent == null) {
            reminderSent = Boolean.FALSE;
        }
    }

    public Long resolveConcertTicketReferenceId() {
        return ticketSeatId != null ? ticketSeatId : ticketCategoryId;
    }
}
