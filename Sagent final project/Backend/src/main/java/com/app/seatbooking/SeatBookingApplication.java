package com.app.seatbooking;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class SeatBookingApplication {

    public static void main(String[] args) {
        SpringApplication.run(SeatBookingApplication.class, args);
    }

}
