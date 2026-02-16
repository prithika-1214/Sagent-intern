package com.system.grocery.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.system.grocery.entity.Category;

public interface CategoryRepository extends JpaRepository<Category, Integer> {
}
