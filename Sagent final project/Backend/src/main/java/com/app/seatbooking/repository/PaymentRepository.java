package com.app.seatbooking.repository;

import com.app.seatbooking.entity.Payment;
import java.util.Collection;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PaymentRepository extends JpaRepository<Payment, Long> {

    boolean existsByTransactionId(String transactionId);

    Optional<Payment> findByBookingBookingId(Long bookingId);

    void deleteByBookingBookingIdIn(Collection<Long> bookingIds);
}
