package com.app.seatbooking.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class UserRoleMigrationRunner implements ApplicationRunner {

    private static final Logger LOGGER = LoggerFactory.getLogger(UserRoleMigrationRunner.class);
    private final JdbcTemplate jdbcTemplate;

    public UserRoleMigrationRunner(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(ApplicationArguments args) {
        try {
            int updated = jdbcTemplate.update(
                    "UPDATE USERS SET role = 'USER' "
                            + "WHERE role IS NULL OR TRIM(role) = '' OR UPPER(TRIM(role)) IN ('ORGANIZER', 'ORGANISER')"
            );
            if (updated > 0) {
                LOGGER.info("Migrated {} user role(s) to USER", updated);
            }
        } catch (Exception ex) {
            LOGGER.warn("Unable to auto-migrate legacy unsupported roles: {}", ex.getMessage());
        }
    }
}
