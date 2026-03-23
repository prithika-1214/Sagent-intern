package com.app.seatbooking.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "USERS")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_id")
    private Long userId;

    @Column(name = "user_name", length = 100)
    private String userName;

    @Column(name = "email", length = 100, unique = true)
    private String email;

    @Column(name = "mobile_number", unique = true)
    private Long mobileNumber;

    @Column(name = "password", length = 255)
    private String password;

    @Column(name = "role", length = 30)
    private String role;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "account_status", length = 30)
    private String accountStatus;

    @OneToMany(mappedBy = "user")
    private List<Booking> bookings = new ArrayList<>();

    @OneToMany(mappedBy = "user")
    private List<Cancellation> cancellations = new ArrayList<>();
}
