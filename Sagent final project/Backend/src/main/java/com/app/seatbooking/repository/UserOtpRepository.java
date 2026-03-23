package com.app.seatbooking.repository;

import com.app.seatbooking.entity.UserOtp;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserOtpRepository extends JpaRepository<UserOtp, Long> {

    Optional<UserOtp> findTopByUserUserIdAndOtpPurposeAndConsumedAtIsNullOrderByCreatedAtDesc(Long userId, String otpPurpose);

    void deleteByUserUserIdAndOtpPurpose(Long userId, String otpPurpose);

    void deleteByUserUserId(Long userId);
}
