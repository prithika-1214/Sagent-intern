package com.app.seatbooking.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class EventSeatHoldRequestDto {

    @NotNull
    private Long scheduleId;

    @NotEmpty
    private List<Long> eventSeatIds;

    @NotBlank
    private String holdToken;
}
