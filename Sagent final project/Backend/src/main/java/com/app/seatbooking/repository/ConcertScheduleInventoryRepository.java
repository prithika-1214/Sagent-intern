package com.app.seatbooking.repository;

import com.app.seatbooking.entity.ConcertScheduleInventory;
import jakarta.persistence.LockModeType;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ConcertScheduleInventoryRepository extends JpaRepository<ConcertScheduleInventory, Long> {

    List<ConcertScheduleInventory> findByScheduleScheduleId(Long scheduleId);

    List<ConcertScheduleInventory> findByScheduleScheduleIdIn(Collection<Long> scheduleIds);

    List<ConcertScheduleInventory> findByTicketCategorySeatSeatIdIn(Collection<Long> ticketCategorySeatIds);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            SELECT inventory
            FROM ConcertScheduleInventory inventory
            WHERE inventory.schedule.scheduleId = :scheduleId
            AND inventory.ticketCategorySeat.seatId = :ticketCategoryId
            """)
    Optional<ConcertScheduleInventory> findByScheduleScheduleIdAndTicketCategorySeatSeatIdForUpdate(
            @Param("scheduleId") Long scheduleId,
            @Param("ticketCategoryId") Long ticketCategoryId
    );

    void deleteByScheduleScheduleIdIn(Collection<Long> scheduleIds);
}
