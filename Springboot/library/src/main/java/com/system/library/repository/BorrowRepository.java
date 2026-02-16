package com.system.library.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.system.library.entity.Borrow;

public interface BorrowRepository extends JpaRepository<Borrow, Integer> {
}
