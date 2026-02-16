package com.system.library.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.system.library.entity.Reservation;

public interface ReservationRepository extends JpaRepository<Reservation, Integer> {
}
