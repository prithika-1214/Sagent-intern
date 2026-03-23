package com.app.seatbooking.service;

import com.app.seatbooking.config.SmsProperties;
import com.app.seatbooking.dto.AuthLoginRequest;
import com.app.seatbooking.dto.OtpVerificationRequest;
import com.app.seatbooking.dto.PasswordResetRequest;
import com.app.seatbooking.dto.SimpleMessageResponse;
import com.app.seatbooking.dto.UserDto;
import com.app.seatbooking.dto.UserOtpRequest;
import com.app.seatbooking.entity.User;
import com.app.seatbooking.entity.UserOtp;
import com.app.seatbooking.repository.UserOtpRepository;
import com.app.seatbooking.repository.UserRepository;
import java.time.LocalDateTime;
import java.util.Objects;
import java.util.Optional;
import java.util.concurrent.ThreadLocalRandom;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class AuthService {

    private static final String FORGOT_PASSWORD_PURPOSE = "FORGOT_PASSWORD";

    private final UserRepository userRepository;
    private final UserOtpRepository userOtpRepository;
    private final SmsService smsService;
    private final SmsProperties smsProperties;

    public AuthService(UserRepository userRepository,
                       UserOtpRepository userOtpRepository,
                       SmsService smsService,
                       SmsProperties smsProperties) {
        this.userRepository = userRepository;
        this.userOtpRepository = userOtpRepository;
        this.smsService = smsService;
        this.smsProperties = smsProperties;
    }

    public UserDto login(AuthLoginRequest request) {
        String email = String.valueOf(request.getEmail()).trim().toLowerCase();
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new IllegalArgumentException("Invalid email or password"));

        if (!"ACTIVE".equalsIgnoreCase(user.getAccountStatus())) {
            throw new IllegalArgumentException("Account is inactive. Contact admin.");
        }

        if (!Objects.equals(String.valueOf(request.getPassword()), String.valueOf(user.getPassword()))) {
            throw new IllegalArgumentException("Invalid email or password");
        }

        return UserDto.toResponse(user);
    }

    @Transactional
    public SimpleMessageResponse sendForgotPasswordOtp(UserOtpRequest request) {
        User user = getActiveUserByMobile(request.getMobileNumber());
        userOtpRepository.deleteByUserUserIdAndOtpPurpose(user.getUserId(), FORGOT_PASSWORD_PURPOSE);

        LocalDateTime now = LocalDateTime.now();
        UserOtp otp = new UserOtp();
        otp.setUser(user);
        otp.setOtpCode(generateOtp());
        otp.setOtpPurpose(FORGOT_PASSWORD_PURPOSE);
        otp.setCreatedAt(now);
        otp.setExpiresAt(now.plusMinutes(Math.max(1, smsProperties.getOtpExpiryMinutes())));
        otp.setVerificationAttempts(0);
        userOtpRepository.save(otp);

        smsService.sendSms(
                user.getMobileNumber(),
                "Tickify password reset OTP: " + otp.getOtpCode()
                        + ". Valid for " + Math.max(1, smsProperties.getOtpExpiryMinutes()) + " minutes."
        );

        return new SimpleMessageResponse("OTP sent to your registered mobile number");
    }

    @Transactional
    public SimpleMessageResponse verifyForgotPasswordOtp(OtpVerificationRequest request) {
        User user = getActiveUserByMobile(request.getMobileNumber());
        UserOtp otp = getActiveForgotPasswordOtp(user);
        validateOtpCode(otp, request.getOtp());
        otp.setVerifiedAt(LocalDateTime.now());
        userOtpRepository.save(otp);
        return new SimpleMessageResponse("OTP verified successfully");
    }

    @Transactional
    public SimpleMessageResponse resetPassword(PasswordResetRequest request) {
        if (!Objects.equals(request.getNewPassword(), request.getConfirmPassword())) {
            throw new IllegalArgumentException("Passwords do not match");
        }

        User user = getActiveUserByMobile(request.getMobileNumber());
        UserOtp otp = getActiveForgotPasswordOtp(user);

        if (otp.getVerifiedAt() == null) {
            throw new IllegalArgumentException("Please verify the OTP before resetting the password");
        }

        validateOtpCode(otp, request.getOtp());
        user.setPassword(request.getNewPassword());
        userRepository.save(user);

        otp.setConsumedAt(LocalDateTime.now());
        userOtpRepository.save(otp);
        return new SimpleMessageResponse("Password updated successfully");
    }

    private User getActiveUserByMobile(Long mobileNumber) {
        User user = userRepository.findByMobileNumber(mobileNumber)
                .orElseThrow(() -> new IllegalArgumentException("No account found with this mobile number"));

        if (!"ACTIVE".equalsIgnoreCase(user.getAccountStatus())) {
            throw new IllegalArgumentException("Account is inactive. Contact admin.");
        }

        return user;
    }

    private UserOtp getActiveForgotPasswordOtp(User user) {
        Optional<UserOtp> userOtp = userOtpRepository.findTopByUserUserIdAndOtpPurposeAndConsumedAtIsNullOrderByCreatedAtDesc(
                user.getUserId(),
                FORGOT_PASSWORD_PURPOSE
        );

        UserOtp otp = userOtp.orElseThrow(() -> new IllegalArgumentException("Please request a new OTP"));
        if (otp.getExpiresAt() == null || otp.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("OTP has expired. Please request a new one");
        }
        return otp;
    }

    private void validateOtpCode(UserOtp otp, String providedOtp) {
        String normalizedOtp = String.valueOf(providedOtp == null ? "" : providedOtp).trim();
        if (!StringUtils.hasText(normalizedOtp) || !Objects.equals(otp.getOtpCode(), normalizedOtp)) {
            int attempts = otp.getVerificationAttempts() == null ? 0 : otp.getVerificationAttempts();
            otp.setVerificationAttempts(attempts + 1);
            userOtpRepository.save(otp);
            throw new IllegalArgumentException("Invalid OTP");
        }
    }

    private String generateOtp() {
        int otpLength = Math.max(4, Math.min(8, smsProperties.getOtpLength()));
        StringBuilder otp = new StringBuilder(otpLength);
        for (int index = 0; index < otpLength; index += 1) {
            otp.append(ThreadLocalRandom.current().nextInt(10));
        }
        return otp.toString();
    }
}
