package com.app.seatbooking.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.app.seatbooking.entity.Event;
import com.app.seatbooking.entity.EventSchedule;
import com.app.seatbooking.entity.Venue;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import java.time.LocalDate;
import java.time.LocalTime;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class EventScheduleDto {

    private Long scheduleId;

    @NotNull
    private Long eventId;

    @NotNull
    private Long venueId;

    private String audiId;

    private String audiName;

    @NotNull
    private LocalDate showDate;

    @NotNull
    @JsonAlias({"startTime"})
    private LocalTime showTime;

    private LocalTime endTime;

    @PositiveOrZero
    private Integer availableSeats;

    @NotBlank
    private String scheduleStatus;

    public static EventSchedule toEntity(EventScheduleDto request, Event event, Venue venue) {
        EventSchedule schedule = new EventSchedule();
        schedule.setEvent(event);
        schedule.setVenue(venue);
        schedule.setAudiId(normalizeOptionalText(request.getAudiId()));
        schedule.setAudiName(normalizeOptionalText(request.getAudiName()));
        schedule.setShowDate(request.getShowDate());
        schedule.setShowTime(request.getShowTime());
        schedule.setScheduleStatus(request.getScheduleStatus());
        return schedule;
    }

    public static void updateEntity(EventSchedule schedule, EventScheduleDto request, Event event, Venue venue) {
        schedule.setEvent(event);
        schedule.setVenue(venue);
        schedule.setAudiId(normalizeOptionalText(request.getAudiId()));
        schedule.setAudiName(normalizeOptionalText(request.getAudiName()));
        schedule.setShowDate(request.getShowDate());
        schedule.setShowTime(request.getShowTime());
        schedule.setScheduleStatus(request.getScheduleStatus());
    }

    public static EventScheduleDto toResponse(EventSchedule schedule) {
        Long eventId = schedule.getEvent() != null ? schedule.getEvent().getEventId() : null;
        Long venueId = schedule.getVenue() != null ? schedule.getVenue().getVenueId() : null;
        return new EventScheduleDto(
                schedule.getScheduleId(),
                eventId,
                venueId,
                schedule.getAudiId(),
                schedule.getAudiName(),
                schedule.getShowDate(),
                schedule.getShowTime(),
                resolveEndTime(schedule),
                schedule.getAvailableSeats(),
                schedule.getScheduleStatus()
        );
    }

    private static String normalizeOptionalText(String value) {
        return value == null ? null : value.trim();
    }

    private static LocalTime resolveEndTime(EventSchedule schedule) {
        if (schedule == null || schedule.getShowTime() == null || schedule.getEvent() == null
                || schedule.getEvent().getDuration() == null) {
            return null;
        }

        long durationMinutes = Math.max(1L, Math.round(schedule.getEvent().getDuration().doubleValue() * 60d));
        return schedule.getShowTime().plusMinutes(durationMinutes);
    }
}

