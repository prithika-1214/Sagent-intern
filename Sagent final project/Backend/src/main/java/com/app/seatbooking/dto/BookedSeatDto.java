package com.app.seatbooking.dto;

import com.app.seatbooking.entity.BookedSeat;
import com.app.seatbooking.entity.Booking;
import com.app.seatbooking.entity.EventSeat;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class BookedSeatDto {

    private Long bookedSeatId;

    @NotNull
    private Long bookingId;

    @NotNull
    private Long eventSeatId;

    public static BookedSeat toEntity(Booking booking, EventSeat eventSeat) {
        BookedSeat bookedSeat = new BookedSeat();
        bookedSeat.setBooking(booking);
        bookedSeat.setEventSeat(eventSeat);
        return bookedSeat;
    }

    public static void updateEntity(BookedSeat bookedSeat, Booking booking, EventSeat eventSeat) {
        bookedSeat.setBooking(booking);
        bookedSeat.setEventSeat(eventSeat);
    }

    public static BookedSeatDto toResponse(BookedSeat bookedSeat) {
        Long bookingId = bookedSeat.getBooking() != null ? bookedSeat.getBooking().getBookingId() : null;
        Long eventSeatId = bookedSeat.getEventSeat() != null ? bookedSeat.getEventSeat().getEventSeatId() : null;
        return new BookedSeatDto(
                bookedSeat.getBookedSeatId(),
                bookingId,
                eventSeatId
        );
    }
}
