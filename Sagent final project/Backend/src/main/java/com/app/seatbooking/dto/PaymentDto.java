package com.app.seatbooking.dto;

import com.app.seatbooking.entity.Booking;
import com.app.seatbooking.entity.Payment;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
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
public class PaymentDto {

    private Long paymentId;

    @NotNull
    private Long bookingId;

    @NotBlank
    private String paymentMethod;

    private LocalDateTime paymentDate;

    @NotNull
    @Positive
    private BigDecimal amount;

    @PositiveOrZero
    private BigDecimal discountAmount;

    @PositiveOrZero
    private BigDecimal convenienceFee;

    @PositiveOrZero
    private BigDecimal gstPercentage;

    @PositiveOrZero
    private BigDecimal gstAmount;

    @NotBlank
    private String paymentStatus;

    @NotBlank
    private String transactionId;

    public static Payment toEntity(PaymentDto request, Booking booking) {
        Payment payment = new Payment();
        payment.setBooking(booking);
        payment.setPaymentMethod(request.getPaymentMethod());
        payment.setAmount(request.getAmount());
        payment.setDiscountAmount(request.getDiscountAmount());
        payment.setConvenienceFee(request.getConvenienceFee());
        payment.setGstPercentage(request.getGstPercentage());
        payment.setGstAmount(request.getGstAmount());
        payment.setPaymentStatus(request.getPaymentStatus());
        payment.setTransactionId(request.getTransactionId());
        return payment;
    }

    public static PaymentDto toResponse(Payment payment) {
        Long bookingId = payment.getBooking() != null ? payment.getBooking().getBookingId() : null;
        return new PaymentDto(
                payment.getPaymentId(),
                bookingId,
                payment.getPaymentMethod(),
                payment.getPaymentDate(),
                payment.getAmount(),
                payment.getDiscountAmount(),
                payment.getConvenienceFee(),
                payment.getGstPercentage(),
                payment.getGstAmount(),
                payment.getPaymentStatus(),
                payment.getTransactionId()
        );
    }
}

