package com.app.seatbooking.repository;

import com.app.seatbooking.entity.Seat;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SeatRepository extends JpaRepository<Seat, Long> {

    List<Seat> findByVenueVenueId(Long venueId);

    long countByVenueVenueId(Long venueId);

    long countByVenueVenueIdAndAudiIdIgnoreCaseAndConcertCategoryNameIsNull(Long venueId, String audiId);

    List<Seat> findByVenueVenueIdAndAudiIdIgnoreCaseAndConcertCategoryNameIsNull(Long venueId, String audiId);

    List<Seat> findByVenueVenueIdAndConcertCategoryNameIsNotNull(Long venueId);

    boolean existsByVenueVenueIdAndAudiIdIgnoreCaseAndSeatNumberIgnoreCaseAndConcertCategoryNameIsNull(
            Long venueId,
            String audiId,
            String seatNumber
    );

    boolean existsByVenueVenueIdAndConcertCategoryNameIgnoreCase(Long venueId, String concertCategoryName);
}
