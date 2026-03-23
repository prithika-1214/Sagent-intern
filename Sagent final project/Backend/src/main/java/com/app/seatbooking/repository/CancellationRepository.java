package com.app.seatbooking.repository;

import com.app.seatbooking.entity.Cancellation;
import java.util.Collection;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CancellationRepository extends JpaRepository<Cancellation, Long> {

    Optional<Cancellation> findByBookingBookingId(Long bookingId);

    void deleteByBookingBookingIdIn(Collection<Long> bookingIds);

    void deleteByUserUserId(Long userId);
}
