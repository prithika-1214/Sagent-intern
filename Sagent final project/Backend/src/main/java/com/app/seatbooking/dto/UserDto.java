package com.app.seatbooking.dto;

import com.app.seatbooking.entity.User;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UserDto {

    private Long userId;

    @NotBlank
    @Size(max = 100)
    private String userName;

    @NotBlank
    @Email
    @Size(max = 100)
    private String email;

    @NotNull
    private Long mobileNumber;

    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    @NotBlank
    @Size(max = 255)
    private String password;

    @NotBlank
    @Size(max = 30)
    @Pattern(regexp = "^(ADMIN|USER)$", flags = Pattern.Flag.CASE_INSENSITIVE, message = "Role must be ADMIN or USER")
    private String role;

    private LocalDateTime createdAt;

    @NotBlank
    @Size(max = 30)
    private String accountStatus;

    private static String normalizeRole(String value) {
        String normalized = String.valueOf(value == null ? "" : value).trim().toUpperCase();
        return "ADMIN".equals(normalized) ? "ADMIN" : "USER";
    }

    private static String normalizeAccountStatus(String value) {
        return String.valueOf(value == null ? "" : value).trim().toUpperCase();
    }

    public static User toEntity(UserDto request) {
        User user = new User();
        user.setUserName(request.getUserName());
        user.setEmail(request.getEmail());
        user.setMobileNumber(request.getMobileNumber());
        user.setPassword(request.getPassword());
        user.setRole(normalizeRole(request.getRole()));
        user.setAccountStatus(normalizeAccountStatus(request.getAccountStatus()));
        return user;
    }

    public static void updateEntity(User user, UserDto request) {
        user.setUserName(request.getUserName());
        user.setEmail(request.getEmail());
        user.setMobileNumber(request.getMobileNumber());
        user.setPassword(request.getPassword());
        user.setRole(normalizeRole(request.getRole()));
        user.setAccountStatus(normalizeAccountStatus(request.getAccountStatus()));
    }

    public static UserDto toResponse(User user) {
        return new UserDto(
                user.getUserId(),
                user.getUserName(),
                user.getEmail(),
                user.getMobileNumber(),
                null,
                user.getRole(),
                user.getCreatedAt(),
                user.getAccountStatus()
        );
    }
}

