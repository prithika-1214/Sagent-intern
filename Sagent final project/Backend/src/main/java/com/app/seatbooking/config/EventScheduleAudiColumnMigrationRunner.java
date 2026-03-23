package com.app.seatbooking.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class EventScheduleAudiColumnMigrationRunner implements ApplicationRunner {

    private static final Logger LOGGER = LoggerFactory.getLogger(EventScheduleAudiColumnMigrationRunner.class);
    private static final String COLUMN_NAME = "audi_name";
    private static final String DEFAULT_AUDI_NAME = "Audi 1";
    private final JdbcTemplate jdbcTemplate;

    public EventScheduleAudiColumnMigrationRunner(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(ApplicationArguments args) {
        try {
            String schedulesTable = findSchedulesTableName();
            if (schedulesTable == null || schedulesTable.isBlank()) {
                return;
            }

            if (!hasAudiColumn(schedulesTable)) {
                jdbcTemplate.execute(
                        "ALTER TABLE " + quote(schedulesTable)
                                + " ADD COLUMN " + quote(COLUMN_NAME)
                                + " VARCHAR(50) NOT NULL DEFAULT '" + DEFAULT_AUDI_NAME + "'"
                );
                LOGGER.info("Added {} column to {}", COLUMN_NAME, schedulesTable);
            }

            jdbcTemplate.update(
                    "UPDATE " + quote(schedulesTable)
                            + " SET " + quote(COLUMN_NAME) + " = ? "
                            + "WHERE " + quote(COLUMN_NAME) + " IS NULL OR TRIM(" + quote(COLUMN_NAME) + ") = ''",
                    DEFAULT_AUDI_NAME
            );
        } catch (Exception ex) {
            LOGGER.warn("Unable to auto-add {} column to EVENT_SCHEDULES table: {}", COLUMN_NAME, ex.getMessage());
        }
    }

    private String findSchedulesTableName() {
        return jdbcTemplate.query(
                "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES "
                        + "WHERE TABLE_SCHEMA = DATABASE() AND LOWER(TABLE_NAME) = 'event_schedules' LIMIT 1",
                rs -> rs.next() ? rs.getString(1) : null
        );
    }

    private boolean hasAudiColumn(String tableName) {
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
