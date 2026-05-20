package com.futsal.repository;

import com.futsal.model.Futsal;
import com.futsal.model.TimeSlot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Repository
public interface TimeSlotRepository extends JpaRepository<TimeSlot, Long> {

    List<TimeSlot> findByAvailableTrue();

    List<TimeSlot> findBySlotDate(LocalDate date);

    List<TimeSlot> findBySlotDateAndAvailableTrue(LocalDate date);

    List<TimeSlot> findByFutsal_FutsalIdAndSlotDateGreaterThanEqualAndAvailableTrueOrderBySlotDateAscStartTimeAsc(
            Long futsalId, LocalDate date
    );

    List<TimeSlot> findByFutsal_FutsalIdAndSlotDateGreaterThanEqualOrderBySlotDateAscStartTimeAsc(
            Long futsalId, LocalDate date
    );

    List<TimeSlot> findByFutsal_FutsalIdAndSlotDate(Long futsalId, LocalDate date);

    boolean existsBySlotDateAndStartTimeLessThanAndEndTimeGreaterThan(
            LocalDate slotDate,
            LocalTime endTime,
            LocalTime startTime
    );

    boolean existsByFutsalAndSlotDateAndStartTimeLessThanAndEndTimeGreaterThan(
            Futsal futsal,
            LocalDate slotDate,
            LocalTime endTime,
            LocalTime startTime
    );

    boolean existsByFutsalAndSlotDateAndStartTimeLessThanAndEndTimeGreaterThanAndSlotIdNot(
            Futsal futsal,
            LocalDate slotDate,
            LocalTime endTime,
            LocalTime startTime,
            Long slotId
    );

    List<TimeSlot> findBySlotDateGreaterThanEqualOrderBySlotDateAscStartTimeAsc(LocalDate date);
}
