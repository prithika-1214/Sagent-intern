package com.app.seatbooking.config;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;
import java.io.IOException;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;

public class FlexibleLocalDateTimeDeserializer extends JsonDeserializer<LocalDateTime> {

    @Override
    public LocalDateTime deserialize(JsonParser parser, DeserializationContext context) throws IOException {
        String rawValue = parser.getValueAsString();
        if (rawValue == null) {
            return null;
        }

        String trimmedValue = rawValue.trim();
        if (trimmedValue.isEmpty()) {
            return null;
        }

        try {
            return LocalDateTime.parse(trimmedValue, DateTimeFormatter.ISO_LOCAL_DATE_TIME);
        } catch (DateTimeParseException ignored) {
            // Fall back to offset-aware formats used by browsers and other API clients.
        }

        try {
            return OffsetDateTime.parse(trimmedValue, DateTimeFormatter.ISO_OFFSET_DATE_TIME).toLocalDateTime();
        } catch (DateTimeParseException ignored) {
            // Fall back to zoned formats before surfacing a validation message.
        }

        try {
            return ZonedDateTime.parse(trimmedValue, DateTimeFormatter.ISO_ZONED_DATE_TIME).toLocalDateTime();
        } catch (DateTimeParseException ignored) {
            return (LocalDateTime) context.handleWeirdStringValue(
                    LocalDateTime.class,
                    trimmedValue,
                    "Expected an ISO local or offset date-time value"
            );
        }
    }
}
