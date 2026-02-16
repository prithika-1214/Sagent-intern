package com.system.grocery.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.system.grocery.entity.CartItem;

public interface CartItemRepository extends JpaRepository<CartItem, Integer> {
}
