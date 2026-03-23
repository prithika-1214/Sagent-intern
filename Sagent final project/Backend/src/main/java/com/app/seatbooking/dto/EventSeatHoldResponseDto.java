package com.app.seatbooking.dto;

import java.time.LocalDateTime;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class EventSeatHoldResponseDto {

    private String holdToken;
    private LocalDateTime holdExpiresAt;
    private List<Long> eventSeatIds;
}
