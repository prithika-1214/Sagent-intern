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
import java.util.ArrayList;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "SEATS")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Seat {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "seat_id")
    private Long seatId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "venue_id")
    private Venue venue;

    @Column(name = "seat_number", length = 20)
    private String seatNumber;

    @Column(name = "seat_row", length = 20)
    private String seatRow;

    @Column(name = "audi_id", length = 50)
    private String audiId;

    @Column(name = "audi_name", length = 100)
    private String audiName;

    @Column(name = "seat_type", length = 30)
    private String seatType;

    @Column(name = "concert_category_name", length = 100)
    private String concertCategoryName;

    @Column(name = "seat_count")
    private Integer seatCount;

    @Column(name = "seat_price", precision = 10, scale = 2)
    private BigDecimal seatPrice;

    @OneToMany(mappedBy = "seat")
    private List<EventSeat> eventSeats = new ArrayList<>();
}
