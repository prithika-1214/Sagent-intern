package com.app.seatbooking.repository;

import com.app.seatbooking.entity.EventSchedule;
import java.time.LocalDate;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EventScheduleRepository extends JpaRepository<EventSchedule, Long> {

    List<EventSchedule> findByEventEventId(Long eventId);

    List<EventSchedule> findByVenueVenueId(Long venueId);

    List<EventSchedule> findByVenueVenueIdAndShowDate(Long venueId, LocalDate showDate);

    List<EventSchedule> findByVenueVenueIdAndShowDateAndAudiNameIgnoreCase(Long venueId, LocalDate showDate, String audiName);
}
