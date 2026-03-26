package com.app.seatbooking.dto;

import com.app.seatbooking.entity.Event;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class EventDto {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper()
            .configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
    private static final TypeReference<List<CastMemberDto>> CAST_MEMBER_LIST_TYPE = new TypeReference<>() {
    };

    private Long eventId;

    @NotBlank
    @Size(max = 150)
    private String eventName;

    @Size(max = 100)
    private String genre;

    private String synopsis;

    @NotNull
    @Positive
    private BigDecimal duration;

    @Size(max = 50)
    private String language;

    @Size(max = 50)
    private String category;

    @Size(max = 30)
    private String eventStatus;

    private String imageUrl;

    private String trailerUrl;

    @Valid
    private List<CastMemberDto> castMembers;

    public static Event toEntity(EventDto request) {
        Event event = new Event();
        event.setEventName(request.getEventName());
        event.setGenre(request.getGenre());
        event.setSynopsis(request.getSynopsis());
        event.setDuration(request.getDuration());
        event.setLanguage(request.getLanguage());
        event.setCategory(request.getCategory());
        event.setEventStatus(request.getEventStatus());
        event.setImageUrl(request.getImageUrl());
        event.setTrailerUrl(request.getTrailerUrl());
        event.setCastMembersJson(serializeCastMembers(request.getCastMembers()));
        return event;
    }

    public static void updateEntity(Event event, EventDto request) {
        event.setEventName(request.getEventName());
        event.setGenre(request.getGenre());
        event.setSynopsis(request.getSynopsis());
        event.setDuration(request.getDuration());
        event.setLanguage(request.getLanguage());
        event.setCategory(request.getCategory());
        event.setEventStatus(request.getEventStatus());
        event.setImageUrl(request.getImageUrl());
        event.setTrailerUrl(request.getTrailerUrl());
        event.setCastMembersJson(serializeCastMembers(request.getCastMembers()));
    }

    public static EventDto toResponse(Event event) {
        return new EventDto(
                event.getEventId(),
                event.getEventName(),
                event.getGenre(),
                event.getSynopsis(),
                event.getDuration(),
                event.getLanguage(),
                event.getCategory(),
                event.getEventStatus(),
                event.getImageUrl(),
                event.getTrailerUrl(),
                deserializeCastMembers(event.getCastMembersJson())
        );
    }

    private static String serializeCastMembers(List<CastMemberDto> castMembers) {
        List<CastMemberDto> normalizedCastMembers = normalizeCastMembers(castMembers);
        if (normalizedCastMembers.isEmpty()) {
            return null;
        }

        try {
            return OBJECT_MAPPER.writeValueAsString(normalizedCastMembers);
        } catch (JsonProcessingException ex) {
            throw new IllegalArgumentException("Unable to serialize cast members", ex);
        }
    }

    private static List<CastMemberDto> deserializeCastMembers(String castMembersJson) {
        if (castMembersJson == null || castMembersJson.isBlank()) {
            return new ArrayList<>();
        }

        try {
            return normalizeCastMembers(OBJECT_MAPPER.readValue(castMembersJson, CAST_MEMBER_LIST_TYPE));
        } catch (JsonProcessingException ex) {
            return new ArrayList<>();
        }
    }

    private static List<CastMemberDto> normalizeCastMembers(List<CastMemberDto> castMembers) {
        if (castMembers == null || castMembers.isEmpty()) {
            return new ArrayList<>();
        }

        return castMembers.stream()
                .filter(Objects::nonNull)
                .map(CastMemberDto::normalize)
                .filter(CastMemberDto::hasName)
                .toList();
    }
}

