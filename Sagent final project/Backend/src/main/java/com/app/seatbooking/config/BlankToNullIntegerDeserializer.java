package com.app.seatbooking.config;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.core.JsonToken;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;
import java.io.IOException;

public class BlankToNullIntegerDeserializer extends JsonDeserializer<Integer> {

    @Override
    public Integer deserialize(JsonParser parser, DeserializationContext context) throws IOException {
        JsonToken token = parser.currentToken();
        if (token == JsonToken.VALUE_NULL) {
            return null;
        }

        if (token == JsonToken.VALUE_NUMBER_INT) {
            return parser.getIntValue();
        }

        String rawValue = parser.getValueAsString();
        if (rawValue == null) {
            return null;
        }

        String trimmedValue = rawValue.trim();
        if (trimmedValue.isEmpty()) {
            return null;
        }

        try {
            return Integer.valueOf(trimmedValue);
        } catch (NumberFormatException exception) {
            return (Integer) context.handleWeirdStringValue(Integer.class, trimmedValue, "Capacity must be a number");
        }
    }
}
