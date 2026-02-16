package com.system.grocery.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.system.grocery.entity.Payment;

public interface PaymentRepository extends JpaRepository<Payment, Integer> {
}
