package com.app.seatbooking.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
@JsonInclude(JsonInclude.Include.NON_EMPTY)
public class CastMemberDto {

    @Size(max = 120)
    private String name;

    @Size(max = 120)
    private String role;

    private String imageUrl;

    public CastMemberDto normalize() {
        return new CastMemberDto(
                normalizeText(name),
                normalizeText(role),
                normalizeText(imageUrl)
        );
    }

    public boolean hasName() {
        return name != null && !name.isBlank();
    }

    private static String normalizeText(String value) {
        if (value == null) {
            return null;
        }

        String normalized = value.trim();
        return normalized.isEmpty() ? null : normalized;
    }
}
