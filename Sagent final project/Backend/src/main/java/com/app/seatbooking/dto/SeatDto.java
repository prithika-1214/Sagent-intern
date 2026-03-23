package com.app.seatbooking.dto;

import com.app.seatbooking.entity.Seat;
import com.app.seatbooking.entity.Venue;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SeatDto {

    private Long seatId;

    @NotNull
    private Long venueId;

    private String seatNumber;

    private String seatRow;

    private String audiId;

    private String audiName;

    private String seatType;

    private String concertCategoryName;

    private Integer seatCount;

    private BigDecimal seatPrice;

    public static Seat toEntity(SeatDto request, Venue venue) {
        Seat seat = new Seat();
        seat.setVenue(venue);
        seat.setSeatNumber(request.getSeatNumber());
        seat.setSeatRow(request.getSeatRow());
        seat.setAudiId(request.getAudiId());
        seat.setAudiName(request.getAudiName());
        seat.setSeatType(request.getSeatType());
        seat.setConcertCategoryName(request.getConcertCategoryName());
        seat.setSeatCount(request.getSeatCount());
        seat.setSeatPrice(request.getSeatPrice());
        return seat;
    }

    public static void updateEntity(Seat seat, SeatDto request, Venue venue) {
        seat.setVenue(venue);
        seat.setSeatNumber(request.getSeatNumber());
        seat.setSeatRow(request.getSeatRow());
        seat.setAudiId(request.getAudiId());
        seat.setAudiName(request.getAudiName());
        seat.setSeatType(request.getSeatType());
        seat.setConcertCategoryName(request.getConcertCategoryName());
        seat.setSeatCount(request.getSeatCount());
        seat.setSeatPrice(request.getSeatPrice());
    }

    public static SeatDto toResponse(Seat seat) {
        Long venueId = seat.getVenue() != null ? seat.getVenue().getVenueId() : null;
        boolean concertCategorySeat = seat.getConcertCategoryName() != null
                && !seat.getConcertCategoryName().trim().isBlank();
        return new SeatDto(
                seat.getSeatId(),
                venueId,
                concertCategorySeat ? null : seat.getSeatNumber(),
                concertCategorySeat ? null : seat.getSeatRow(),
                concertCategorySeat ? null : seat.getAudiId(),
                concertCategorySeat ? null : seat.getAudiName(),
                seat.getSeatType(),
                seat.getConcertCategoryName(),
                seat.getSeatCount(),
                seat.getSeatPrice()
        );
    }
}
