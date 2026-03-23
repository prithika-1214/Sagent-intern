package com.app.seatbooking.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class EventSeatHoldColumnMigrationRunner implements ApplicationRunner {

    private static final Logger LOGGER = LoggerFactory.getLogger(EventSeatHoldColumnMigrationRunner.class);
    private static final String HOLD_TOKEN_COLUMN = "hold_token";
    private static final String HOLD_EXPIRES_AT_COLUMN = "hold_expires_at";
    private final JdbcTemplate jdbcTemplate;

    public EventSeatHoldColumnMigrationRunner(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(ApplicationArguments args) {
        try {
            String eventSeatsTable = findEventSeatsTableName();
            if (eventSeatsTable == null || eventSeatsTable.isBlank()) {
                return;
            }

            if (!hasColumn(eventSeatsTable, HOLD_TOKEN_COLUMN)) {
                jdbcTemplate.execute(
                        "ALTER TABLE " + quote(eventSeatsTable)
                                + " ADD COLUMN " + quote(HOLD_TOKEN_COLUMN) + " VARCHAR(100) NULL"
                );
                LOGGER.info("Added {} column to {}", HOLD_TOKEN_COLUMN, eventSeatsTable);
            }

            if (!hasColumn(eventSeatsTable, HOLD_EXPIRES_AT_COLUMN)) {
                jdbcTemplate.execute(
                        "ALTER TABLE " + quote(eventSeatsTable)
                                + " ADD COLUMN " + quote(HOLD_EXPIRES_AT_COLUMN) + " DATETIME NULL"
                );
                LOGGER.info("Added {} column to {}", HOLD_EXPIRES_AT_COLUMN, eventSeatsTable);
            }
        } catch (Exception ex) {
            LOGGER.warn(
                    "Unable to auto-add hold columns to EVENT_SEATS table: {}",
                    ex.getMessage()
            );
        }
    }

    private String findEventSeatsTableName() {
        return jdbcTemplate.query(
                "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES "
                        + "WHERE TABLE_SCHEMA = DATABASE() AND LOWER(TABLE_NAME) = 'event_seats' LIMIT 1",
                rs -> rs.next() ? rs.getString(1) : null
        );
    }

    private boolean hasColumn(String tableName, String columnName) {
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS "
                        + "WHERE TABLE_SCHEMA = DATABASE() AND LOWER(TABLE_NAME) = LOWER(?) "
                        + "AND LOWER(COLUMN_NAME) = LOWER(?)",
                Integer.class,
                tableName,
                columnName
        );
        return count != null && count > 0;
    }

    private String quote(String identifier) {
        return "`" + String.valueOf(identifier).replace("`", "") + "`";
    }
}
