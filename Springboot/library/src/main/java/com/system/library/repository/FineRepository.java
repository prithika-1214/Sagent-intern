package com.system.library.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.system.library.entity.Fine;

public interface FineRepository extends JpaRepository<Fine, Integer> {
}
