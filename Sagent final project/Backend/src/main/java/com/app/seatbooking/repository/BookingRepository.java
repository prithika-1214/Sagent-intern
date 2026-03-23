package com.app.seatbooking.repository;

import com.app.seatbooking.entity.Booking;
import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BookingRepository extends JpaRepository<Booking, Long> {

    boolean existsByScheduleScheduleId(Long scheduleId);

    List<Booking> findByScheduleScheduleIdIn(Collection<Long> scheduleIds);

    List<Booking> findByUserUserId(Long userId);

    List<Booking> findByTicketCategoryIdIn(Collection<Long> ticketCategoryIds);

    List<Booking> findByTicketSeatIdIn(Collection<Long> ticketSeatIds);
}
