package com.app.seatbooking.dto;

import com.app.seatbooking.entity.EventSchedule;
import com.app.seatbooking.entity.EventSeat;
import com.app.seatbooking.entity.Seat;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class EventSeatDto {

    private Long eventSeatId;

    @NotNull
    private Long scheduleId;

    @NotNull
    private Long seatId;

    @NotNull
    @Positive
    private BigDecimal seatPrice;

    @NotBlank
    private String seatStatus;

    public static EventSeat toEntity(EventSeatDto request, EventSchedule schedule, Seat seat) {
        EventSeat eventSeat = new EventSeat();
        eventSeat.setSchedule(schedule);
        eventSeat.setSeat(seat);
        eventSeat.setSeatPrice(request.getSeatPrice());
        eventSeat.setSeatStatus(request.getSeatStatus());
        return eventSeat;
    }

    public static void updateEntity(EventSeat eventSeat, EventSeatDto request, EventSchedule schedule, Seat seat) {
        eventSeat.setSchedule(schedule);
        eventSeat.setSeat(seat);
        eventSeat.setSeatPrice(request.getSeatPrice());
        eventSeat.setSeatStatus(request.getSeatStatus());
    }

    public static EventSeatDto toResponse(EventSeat eventSeat) {
        Long scheduleId = eventSeat.getSchedule() != null ? eventSeat.getSchedule().getScheduleId() : null;
        Long seatId = eventSeat.getSeat() != null ? eventSeat.getSeat().getSeatId() : null;
        return new EventSeatDto(
                eventSeat.getEventSeatId(),
                scheduleId,
                seatId,
                eventSeat.getSeatPrice(),
                eventSeat.getSeatStatus()
        );
    }
}

