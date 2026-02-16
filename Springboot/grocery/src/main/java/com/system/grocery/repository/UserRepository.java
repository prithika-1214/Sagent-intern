package com.system.grocery.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.system.grocery.entity.User;

public interface UserRepository extends JpaRepository<User, Integer> {
}
