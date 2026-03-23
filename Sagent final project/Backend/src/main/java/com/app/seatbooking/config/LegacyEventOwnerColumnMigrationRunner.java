package com.app.seatbooking.config;

import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class LegacyEventOwnerColumnMigrationRunner implements ApplicationRunner {

    private static final Logger LOGGER = LoggerFactory.getLogger(LegacyEventOwnerColumnMigrationRunner.class);
    private static final String LEGACY_COLUMN = "organiser_user_id";
    private final JdbcTemplate jdbcTemplate;

    public LegacyEventOwnerColumnMigrationRunner(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(ApplicationArguments args) {
        try {
            String eventsTable = findEventsTableName();
            if (eventsTable == null || eventsTable.isBlank() || !hasLegacyOwnerColumn(eventsTable)) {
                return;
            }

            dropForeignKeys(eventsTable);
            dropIndexes(eventsTable);
            jdbcTemplate.execute("ALTER TABLE " + quote(eventsTable) + " DROP COLUMN " + quote(LEGACY_COLUMN));
            LOGGER.info("Dropped legacy {} column from {}", LEGACY_COLUMN, eventsTable);
        } catch (Exception ex) {
            LOGGER.warn("Unable to auto-drop legacy owner column from EVENTS table: {}", ex.getMessage());
        }
    }

    private String findEventsTableName() {
        return jdbcTemplate.query(
                "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES "
                        + "WHERE TABLE_SCHEMA = DATABASE() AND LOWER(TABLE_NAME) = 'events' LIMIT 1",
                rs -> rs.next() ? rs.getString(1) : null
        );
    }

    private boolean hasLegacyOwnerColumn(String tableName) {
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS "
                        + "WHERE TABLE_SCHEMA = DATABASE() AND LOWER(TABLE_NAME) = LOWER(?) "
                        + "AND LOWER(COLUMN_NAME) = ?",
                Integer.class,
                tableName,
                LEGACY_COLUMN
        );
        return count != null && count > 0;
    }

    private void dropForeignKeys(String tableName) {
        List<String> foreignKeys = jdbcTemplate.queryForList(
                "SELECT CONSTRAINT_NAME FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE "
                        + "WHERE TABLE_SCHEMA = DATABASE() AND LOWER(TABLE_NAME) = LOWER(?) "
                        + "AND LOWER(COLUMN_NAME) = ? AND REFERENCED_TABLE_NAME IS NOT NULL",
                String.class,
                tableName,
                LEGACY_COLUMN
        );

        for (String foreignKey : foreignKeys) {
            jdbcTemplate.execute("ALTER TABLE " + quote(tableName) + " DROP FOREIGN KEY " + quote(foreignKey));
        }
    }

    private void dropIndexes(String tableName) {
        List<String> indexes = jdbcTemplate.queryForList(
                "SELECT DISTINCT INDEX_NAME FROM INFORMATION_SCHEMA.STATISTICS "
                        + "WHERE TABLE_SCHEMA = DATABASE() AND LOWER(TABLE_NAME) = LOWER(?) "
                        + "AND LOWER(COLUMN_NAME) = ? AND INDEX_NAME <> 'PRIMARY'",
                String.class,
                tableName,
                LEGACY_COLUMN
        );

        for (String index : indexes) {
            try {
                jdbcTemplate.execute("ALTER TABLE " + quote(tableName) + " DROP INDEX " + quote(index));
            } catch (Exception ex) {
                LOGGER.debug("Skipping index drop for {}.{}: {}", tableName, index, ex.getMessage());
            }
        }
    }

    private String quote(String identifier) {
        return "`" + String.valueOf(identifier).replace("`", "") + "`";
    }
}
