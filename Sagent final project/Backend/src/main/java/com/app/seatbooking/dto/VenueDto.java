package com.app.seatbooking.dto;

import com.app.seatbooking.config.BlankToNullIntegerDeserializer;
import com.app.seatbooking.entity.Venue;
import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class VenueDto {

    @JsonAlias("venue_id")
    private Long venueId;

    @JsonAlias("venue_name")
    @NotBlank
    @Size(max = 100)
    private String venueName;

    @NotBlank
    @Size(max = 255)
    private String address;

    @NotBlank
    @Size(max = 100)
    private String city;

    @NotBlank
    @Size(max = 100)
    private String state;

    @JsonDeserialize(using = BlankToNullIntegerDeserializer.class)
    @PositiveOrZero
    private Integer capacity;

    private String venueType;

    public static Venue toEntity(VenueDto request) {
        Venue venue = new Venue();
        venue.setVenueName(request.getVenueName());
        venue.setAddress(request.getAddress());
        venue.setCity(request.getCity());
        venue.setState(request.getState());
        venue.setCapacity(request.getCapacity());
        venue.setVenueType(request.getVenueType());
        return venue;
    }

    public static void updateEntity(Venue venue, VenueDto request) {
        venue.setVenueName(request.getVenueName());
        venue.setAddress(request.getAddress());
        venue.setCity(request.getCity());
        venue.setState(request.getState());
        venue.setCapacity(request.getCapacity());
        venue.setVenueType(request.getVenueType());
    }

    public static VenueDto toResponse(Venue venue) {
        return new VenueDto(
                venue.getVenueId(),
                venue.getVenueName(),
                venue.getAddress(),
                venue.getCity(),
                venue.getState(),
                venue.getCapacity(),
                venue.getVenueType()
        );
    }
}

