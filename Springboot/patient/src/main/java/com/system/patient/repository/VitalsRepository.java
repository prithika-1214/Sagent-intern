package com.system.patient.repository;

import com.system.patient.entity.Vitals;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface VitalsRepository extends JpaRepository<Vitals, Integer> {

}
