package com.app.seatbooking.dto;

import com.app.seatbooking.entity.Cancellation;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CancellationDto {

    private Long cancellationId;

    @NotNull
    private Long bookingId;

    @NotNull
    private Long userId;

    @NotBlank
    private String cancellationReason;

    private LocalDateTime cancellationDate;

    @NotBlank
    private String cancellationType;

    @PositiveOrZero
    private BigDecimal refundAmount;

    @NotBlank
    private String refundStatus;

    public static CancellationDto toResponse(Cancellation cancellation) {
        Long bookingId = cancellation.getBooking() != null ? cancellation.getBooking().getBookingId() : null;
        Long userId = cancellation.getUser() != null ? cancellation.getUser().getUserId() : null;
        return new CancellationDto(
                cancellation.getCancellationId(),
                bookingId,
                userId,
                cancellation.getCancellationReason(),
                cancellation.getCancellationDate(),
                cancellation.getCancellationType(),
                cancellation.getRefundAmount(),
                cancellation.getRefundStatus()
        );
    }
}

