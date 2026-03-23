package com.app.seatbooking.repository;

import com.app.seatbooking.entity.User;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, Long> {

    boolean existsByEmail(String email);

    boolean existsByMobileNumber(Long mobileNumber);

    Optional<User> findByEmailIgnoreCase(String email);

    Optional<User> findByMobileNumber(Long mobileNumber);
}
