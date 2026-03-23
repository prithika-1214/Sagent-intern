package com.app.seatbooking.controller;

import com.app.seatbooking.dto.AuthLoginRequest;
import com.app.seatbooking.dto.OtpVerificationRequest;
import com.app.seatbooking.dto.PasswordResetRequest;
import com.app.seatbooking.dto.SimpleMessageResponse;
import com.app.seatbooking.dto.UserDto;
import com.app.seatbooking.dto.UserOtpRequest;
import com.app.seatbooking.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ResponseEntity<UserDto> login(@Valid @RequestBody AuthLoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/forgot-password/send-otp")
    public ResponseEntity<SimpleMessageResponse> sendForgotPasswordOtp(@Valid @RequestBody UserOtpRequest request) {
        return ResponseEntity.ok(authService.sendForgotPasswordOtp(request));
    }

    @PostMapping("/forgot-password/verify-otp")
    public ResponseEntity<SimpleMessageResponse> verifyForgotPasswordOtp(
            @Valid @RequestBody OtpVerificationRequest request
    ) {
        return ResponseEntity.ok(authService.verifyForgotPasswordOtp(request));
    }

    @PostMapping("/forgot-password/reset")
    public ResponseEntity<SimpleMessageResponse> resetPassword(@Valid @RequestBody PasswordResetRequest request) {
        return ResponseEntity.ok(authService.resetPassword(request));
    }
}
