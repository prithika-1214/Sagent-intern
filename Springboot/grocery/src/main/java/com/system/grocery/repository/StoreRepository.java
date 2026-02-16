package com.system.grocery.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.system.grocery.entity.Store;

public interface StoreRepository extends JpaRepository<Store, Integer> {
}
