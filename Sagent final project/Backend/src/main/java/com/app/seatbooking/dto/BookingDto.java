package com.app.seatbooking.dto;

import com.app.seatbooking.config.FlexibleLocalDateTimeDeserializer;
import com.app.seatbooking.entity.BookedSeat;
import com.app.seatbooking.entity.Booking;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class BookingDto {

    private Long bookingId;

    @NotNull
    private Long userId;

    @NotNull
    private Long scheduleId;

    @JsonDeserialize(using = FlexibleLocalDateTimeDeserializer.class)
    private LocalDateTime bookingDate;
    private String bookingStatus;

    private String holdToken;

    private Long ticketCategoryId;

    private String ticketCategoryName;

    private Integer ticketQuantity;

    private BigDecimal ticketUnitPrice;

    private List<Long> eventSeatIds = new ArrayList<>();

    private List<Long> bookedSeatIds;

    public static BookingDto toResponse(Booking booking, List<BookedSeat> bookedSeats) {
        List<Long> eventSeatIds = bookedSeats.stream()
                .map(seat -> seat.getEventSeat().getEventSeatId())
                .collect(Collectors.toList());
        List<Long> bookedSeatIds = bookedSeats.stream()
                .map(BookedSeat::getBookedSeatId)
                .collect(Collectors.toList());
        Long userId = booking.getUser() != null ? booking.getUser().getUserId() : null;
        Long scheduleId = booking.getSchedule() != null ? booking.getSchedule().getScheduleId() : null;
        return new BookingDto(
                booking.getBookingId(),
                userId,
                scheduleId,
                booking.getBookingDate(),
                booking.getBookingStatus(),
                null,
                booking.resolveConcertTicketReferenceId(),
                booking.getTicketCategoryName(),
                booking.getTicketQuantity(),
                booking.getTicketUnitPrice(),
                eventSeatIds,
                bookedSeatIds
        );
    }
}
