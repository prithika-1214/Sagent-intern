package com.system.grocery.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.system.grocery.entity.OrderTbl;

public interface OrderTblRepository extends JpaRepository<OrderTbl, Integer> {
}
