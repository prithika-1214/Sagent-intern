package com.system.grocery.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.system.grocery.entity.Product;

public interface ProductRepository extends JpaRepository<Product, Integer> {
}
