package com.system.grocery.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.system.grocery.entity.Delivery;

public interface DeliveryRepository extends JpaRepository<Delivery, Integer> {
}
