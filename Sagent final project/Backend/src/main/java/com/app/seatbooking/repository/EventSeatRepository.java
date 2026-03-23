package com.app.seatbooking.repository;

import com.app.seatbooking.entity.EventSeat;
import java.util.Collection;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;

public interface EventSeatRepository extends JpaRepository<EventSeat, Long> {

    List<EventSeat> findByScheduleScheduleId(Long scheduleId);

    List<EventSeat> findByScheduleScheduleIdIn(Collection<Long> scheduleIds);

    List<EventSeat> findBySeatSeatId(Long seatId);

    List<EventSeat> findBySeatSeatIdIn(Collection<Long> seatIds);

    Optional<EventSeat> findByScheduleScheduleIdAndSeatSeatId(Long scheduleId, Long seatId);

    List<EventSeat> findBySeatStatusIgnoreCaseAndHoldExpiresAtBefore(String seatStatus, LocalDateTime holdExpiresAt);

    List<EventSeat> findByScheduleScheduleIdAndSeatStatusIgnoreCaseAndHoldExpiresAtBefore(
            Long scheduleId,
            String seatStatus,
            LocalDateTime holdExpiresAt
    );

    List<EventSeat> findByHoldTokenAndSeatStatusIgnoreCase(String holdToken, String seatStatus);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT eventSeat FROM EventSeat eventSeat WHERE eventSeat.eventSeatId IN :eventSeatIds")
    List<EventSeat> findAllByEventSeatIdInForUpdate(@Param("eventSeatIds") Collection<Long> eventSeatIds);

    boolean existsByScheduleScheduleId(Long scheduleId);
}
