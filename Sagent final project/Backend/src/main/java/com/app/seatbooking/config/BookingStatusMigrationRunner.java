package com.app.seatbooking.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class BookingStatusMigrationRunner implements ApplicationRunner {

    private static final Logger LOGGER = LoggerFactory.getLogger(BookingStatusMigrationRunner.class);
    private final JdbcTemplate jdbcTemplate;

    public BookingStatusMigrationRunner(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(ApplicationArguments args) {
        try {
            int updated = jdbcTemplate.update(
                    "UPDATE BOOKINGS SET booking_status = 'CONFIRMED' "
                            + "WHERE UPPER(TRIM(COALESCE(booking_status, ''))) = 'BOOKED' "
                            + "AND booking_id IN ("
                            + "SELECT DISTINCT booking_id FROM PAYMENTS "
                            + "WHERE UPPER(TRIM(COALESCE(payment_status, ''))) = 'SUCCESS'"
                            + ")"
            );
            if (updated > 0) {
                LOGGER.info("Migrated {} existing booking(s) from BOOKED to CONFIRMED", updated);
            }
        } catch (Exception ex) {
            LOGGER.warn("Unable to auto-migrate existing booking statuses: {}", ex.getMessage());
        }
    }
}
