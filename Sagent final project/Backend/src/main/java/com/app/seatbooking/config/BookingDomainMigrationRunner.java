package com.app.seatbooking.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class BookingDomainMigrationRunner implements ApplicationRunner {

    private static final Logger LOGGER = LoggerFactory.getLogger(BookingDomainMigrationRunner.class);
    private final JdbcTemplate jdbcTemplate;

    public BookingDomainMigrationRunner(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(ApplicationArguments args) {
        try {
            backfillEventCategories();
            backfillVenueTypes();
            backfillAudiColumns();
            backfillPaymentPricingColumns();
            backfillCancelledBookingRecords();
        } catch (Exception ex) {
            LOGGER.warn("Unable to backfill booking domain defaults: {}", ex.getMessage());
        }
    }

    private void backfillEventCategories() {
        if (!hasColumn("EVENTS", "category")) {
            return;
        }

        jdbcTemplate.update(
                "UPDATE EVENTS SET category = 'MOVIE' "
                        + "WHERE UPPER(TRIM(COALESCE(category, ''))) IN ('', 'MOVIE')"
        );
        jdbcTemplate.update(
                "UPDATE EVENTS SET category = 'CONCERT' "
                        + "WHERE UPPER(TRIM(COALESCE(category, ''))) = 'CONCERT'"
        );
        jdbcTemplate.update(
                "UPDATE EVENTS SET category = 'STANDUP_SHOW' "
                        + "WHERE UPPER(REPLACE(REPLACE(TRIM(COALESCE(category, '')), '-', '_'), ' ', '_')) IN ('SHOW', 'STANDUP', 'STANDUP_SHOW')"
        );
    }

    private void backfillVenueTypes() {
        if (!hasColumn("VENUES", "venue_type")) {
            return;
        }

        jdbcTemplate.update(
                "UPDATE VENUES SET venue_type = 'MOVIE_VENUE' "
                        + "WHERE venue_type IS NULL OR TRIM(venue_type) = ''"
        );
    }

    private void backfillAudiColumns() {
        if (hasColumn("EVENT_SCHEDULES", "audi_id")) {
            jdbcTemplate.update(
                    "UPDATE EVENT_SCHEDULES SET audi_id = UPPER(REPLACE(REPLACE(TRIM(COALESCE(audi_name, 'Audi 1')), ' ', '_'), '-', '_')) "
                            + "WHERE (audi_id IS NULL OR TRIM(audi_id) = '') "
                            + "AND COALESCE(TRIM(audi_name), '') <> ''"
            );
            jdbcTemplate.update(
                    "UPDATE EVENT_SCHEDULES SET audi_id = 'AUDI_1' "
                            + "WHERE audi_id IS NULL OR TRIM(audi_id) = ''"
            );
        }

        if (hasColumn("SEATS", "audi_id")) {
            jdbcTemplate.update(
                    "UPDATE SEATS SET audi_id = 'AUDI_1' "
                            + "WHERE (concert_category_name IS NULL OR TRIM(concert_category_name) = '') "
                            + "AND (audi_id IS NULL OR TRIM(audi_id) = '')"
            );
        }

        if (hasColumn("SEATS", "audi_name")) {
            jdbcTemplate.update(
                    "UPDATE SEATS SET audi_name = 'Audi 1' "
                            + "WHERE (concert_category_name IS NULL OR TRIM(concert_category_name) = '') "
                            + "AND (audi_name IS NULL OR TRIM(audi_name) = '')"
            );
        }
    }

    private void backfillPaymentPricingColumns() {
        if (hasColumn("PAYMENTS", "convenience_fee")) {
            jdbcTemplate.update("UPDATE PAYMENTS SET convenience_fee = 0 WHERE convenience_fee IS NULL");
        }
        if (hasColumn("PAYMENTS", "gst_percentage")) {
            jdbcTemplate.update("UPDATE PAYMENTS SET gst_percentage = 18 WHERE gst_percentage IS NULL");
        }
        if (hasColumn("PAYMENTS", "gst_amount")) {
            jdbcTemplate.update("UPDATE PAYMENTS SET gst_amount = 0 WHERE gst_amount IS NULL");
        }
    }

    private void backfillCancelledBookingRecords() {
        if (!hasColumn("BOOKINGS", "booking_status")
                || !hasColumn("PAYMENTS", "payment_status")
                || !hasColumn("CANCELLATIONS", "booking_id")) {
            return;
        }

        jdbcTemplate.update(
                "INSERT INTO PAYMENTS "
                        + "(booking_id, payment_method, payment_date, amount, discount_amount, convenience_fee, gst_percentage, gst_amount, payment_status, transaction_id) "
                        + "SELECT b.booking_id, 'SYSTEM', COALESCE(c.cancellation_date, b.booking_date, NOW()), "
                        + "COALESCE(c.refund_amount, "
                        + "CASE "
                        + "WHEN b.ticket_quantity IS NOT NULL AND b.ticket_unit_price IS NOT NULL THEN b.ticket_quantity * b.ticket_unit_price "
                        + "ELSE (SELECT COALESCE(SUM(es.seat_price), 0) "
                        + "FROM BOOKED_SEATS bs "
                        + "JOIN EVENT_SEATS es ON es.event_seat_id = bs.event_seat_id "
                        + "WHERE bs.booking_id = b.booking_id) "
                        + "END, 0), "
                        + "0, 0, 18, 0, "
                        + "CASE "
                        + "WHEN c.cancellation_id IS NULL THEN 'REFUNDED' "
                        + "WHEN UPPER(TRIM(COALESCE(c.refund_status, ''))) = 'COMPLETED' THEN 'REFUNDED' "
                        + "ELSE 'PENDING' "
                        + "END, "
                        + "CONCAT('AUTO_CANCELLED_', b.booking_id) "
                        + "FROM BOOKINGS b "
                        + "LEFT JOIN PAYMENTS p ON p.booking_id = b.booking_id "
                        + "LEFT JOIN CANCELLATIONS c ON c.booking_id = b.booking_id "
                        + "WHERE UPPER(TRIM(COALESCE(b.booking_status, ''))) = 'CANCELLED' "
                        + "AND p.payment_id IS NULL"
        );

        jdbcTemplate.update(
                "UPDATE PAYMENTS p "
                        + "JOIN BOOKINGS b ON b.booking_id = p.booking_id "
                        + "LEFT JOIN CANCELLATIONS c ON c.booking_id = b.booking_id "
                        + "SET p.payment_method = COALESCE(NULLIF(TRIM(p.payment_method), ''), 'SYSTEM'), "
                        + "p.payment_date = COALESCE(p.payment_date, c.cancellation_date, b.booking_date, NOW()), "
                        + "p.amount = COALESCE(p.amount, c.refund_amount, "
                        + "CASE "
                        + "WHEN b.ticket_quantity IS NOT NULL AND b.ticket_unit_price IS NOT NULL THEN b.ticket_quantity * b.ticket_unit_price "
                        + "ELSE (SELECT COALESCE(SUM(es.seat_price), 0) "
                        + "FROM BOOKED_SEATS bs "
                        + "JOIN EVENT_SEATS es ON es.event_seat_id = bs.event_seat_id "
                        + "WHERE bs.booking_id = b.booking_id) "
                        + "END, 0), "
                        + "p.discount_amount = COALESCE(p.discount_amount, 0), "
                        + "p.convenience_fee = COALESCE(p.convenience_fee, 0), "
                        + "p.gst_percentage = COALESCE(p.gst_percentage, 18), "
                        + "p.gst_amount = COALESCE(p.gst_amount, 0), "
                        + "p.payment_status = CASE "
                        + "WHEN c.cancellation_id IS NULL THEN 'REFUNDED' "
                        + "WHEN UPPER(TRIM(COALESCE(c.refund_status, ''))) = 'COMPLETED' THEN 'REFUNDED' "
                        + "ELSE 'PENDING' "
                        + "END, "
                        + "p.transaction_id = COALESCE(NULLIF(TRIM(p.transaction_id), ''), CONCAT('AUTO_CANCELLED_', b.booking_id)) "
                        + "WHERE UPPER(TRIM(COALESCE(b.booking_status, ''))) = 'CANCELLED' "
                        + "AND p.payment_id IS NOT NULL"
        );

        jdbcTemplate.update(
                "INSERT INTO CANCELLATIONS "
                        + "(booking_id, user_id, cancellation_reason, cancellation_date, cancellation_type, refund_amount, refund_status) "
                        + "SELECT b.booking_id, b.user_id, 'Booking cancelled by admin', NOW(), 'ADMIN_CANCELLED', "
                        + "COALESCE((SELECT MAX(p.amount) FROM PAYMENTS p WHERE p.booking_id = b.booking_id), 0), 'COMPLETED' "
                        + "FROM BOOKINGS b "
                        + "LEFT JOIN CANCELLATIONS c ON c.booking_id = b.booking_id "
                        + "WHERE UPPER(TRIM(COALESCE(b.booking_status, ''))) = 'CANCELLED' "
                        + "AND c.cancellation_id IS NULL"
        );
    }

    private boolean hasColumn(String tableName, String columnName) {
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS "
                        + "WHERE TABLE_SCHEMA = DATABASE() AND UPPER(TABLE_NAME) = UPPER(?) "
                        + "AND UPPER(COLUMN_NAME) = UPPER(?)",
                Integer.class,
                tableName,
                columnName
        );
        return count != null && count > 0;
    }
}
