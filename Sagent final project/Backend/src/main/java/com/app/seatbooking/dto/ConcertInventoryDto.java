package com.app.seatbooking.dto;

import com.app.seatbooking.entity.ConcertScheduleInventory;
import java.math.BigDecimal;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ConcertInventoryDto {

    private Long inventoryId;
    private Long scheduleId;
    private Long ticketCategoryId;
    private String categoryName;
    private BigDecimal price;
    private Integer totalTickets;
    private Integer soldTickets;
    private Integer availableTickets;

    public static ConcertInventoryDto toResponse(ConcertScheduleInventory inventory) {
        Long scheduleId = inventory.getSchedule() != null ? inventory.getSchedule().getScheduleId() : null;
        Long ticketCategoryId = inventory.getTicketCategorySeat() != null ? inventory.getTicketCategorySeat().getSeatId() : null;
        int totalTickets = inventory.getTotalTickets() == null ? 0 : inventory.getTotalTickets();
        int availableTickets = inventory.getAvailableTickets() == null ? 0 : inventory.getAvailableTickets();
        return new ConcertInventoryDto(
                inventory.getInventoryId(),
                scheduleId,
                ticketCategoryId,
                inventory.getCategoryName(),
                inventory.getTicketPrice(),
                totalTickets,
                Math.max(0, totalTickets - availableTickets),
                availableTickets
        );
    }
}
