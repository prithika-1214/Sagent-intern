package com.app.seatbooking.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class EventImageColumnMigrationRunner implements ApplicationRunner {

    private static final Logger LOGGER = LoggerFactory.getLogger(EventImageColumnMigrationRunner.class);
    private static final String COLUMN_NAME = "image_url";
    private final JdbcTemplate jdbcTemplate;

    public EventImageColumnMigrationRunner(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(ApplicationArguments args) {
        try {
            String eventsTable = findEventsTableName();
            if (eventsTable == null || eventsTable.isBlank() || hasImageColumn(eventsTable)) {
                return;
            }

            jdbcTemplate.execute(
                    "ALTER TABLE " + quote(eventsTable) + " ADD COLUMN " + quote(COLUMN_NAME) + " LONGTEXT NULL"
            );
            LOGGER.info("Added {} column to {}", COLUMN_NAME, eventsTable);
        } catch (Exception ex) {
            LOGGER.warn("Unable to auto-add {} column to EVENTS table: {}", COLUMN_NAME, ex.getMessage());
        }
    }

    private String findEventsTableName() {
        return jdbcTemplate.query(
                "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES "
                        + "WHERE TABLE_SCHEMA = DATABASE() AND LOWER(TABLE_NAME) = 'events' LIMIT 1",
                rs -> rs.next() ? rs.getString(1) : null
        );
    }

    private boolean hasImageColumn(String tableName) {
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS "
                        + "WHERE TABLE_SCHEMA = DATABASE() AND LOWER(TABLE_NAME) = LOWER(?) "
                        + "AND LOWER(COLUMN_NAME) = ?",
                Integer.class,
                tableName,
                COLUMN_NAME
        );
        return count != null && count > 0;
    }

    private String quote(String identifier) {
        return "`" + String.valueOf(identifier).replace("`", "") + "`";
    }
}
