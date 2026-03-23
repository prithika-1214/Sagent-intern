package com.app.seatbooking.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "CONCERT_SCHEDULE_INVENTORY")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ConcertScheduleInventory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "inventory_id")
    private Long inventoryId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "schedule_id")
    private EventSchedule schedule;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ticket_category_seat_id")
    private Seat ticketCategorySeat;

    @Column(name = "category_name", length = 100)
    private String categoryName;

    @Column(name = "ticket_price", precision = 10, scale = 2)
    private BigDecimal ticketPrice;

    @Column(name = "total_tickets")
    private Integer totalTickets;

    @Column(name = "available_tickets")
    private Integer availableTickets;
}
