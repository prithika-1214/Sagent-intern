package com.system.grocery.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.system.grocery.entity.DeliveryAgent;

public interface DeliveryAgentRepository extends JpaRepository<DeliveryAgent, Integer> {
}
