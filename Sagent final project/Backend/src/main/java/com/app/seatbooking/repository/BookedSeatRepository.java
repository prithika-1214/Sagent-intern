package com.app.seatbooking.repository;

import com.app.seatbooking.entity.BookedSeat;
import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BookedSeatRepository extends JpaRepository<BookedSeat, Long> {

    List<BookedSeat> findByBookingBookingId(Long bookingId);

    List<BookedSeat> findByBookingBookingIdIn(Collection<Long> bookingIds);

    List<BookedSeat> findByEventSeatEventSeatIdIn(Collection<Long> eventSeatIds);

    void deleteByBookingBookingIdIn(Collection<Long> bookingIds);

    void deleteByEventSeatEventSeatIdIn(Collection<Long> eventSeatIds);
}
