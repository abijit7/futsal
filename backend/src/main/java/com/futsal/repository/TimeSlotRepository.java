package com.futsal.repository;

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

    boolean existsByDateAndStartTimeLessThanAndEndTimeGreaterThan(
            LocalDate date,
            LocalTime newEndTime,
            LocalTime newStartTime
    );
    List<TimeSlot> findBySlotDateGreaterThanEqualOrderBySlotDateAscStartTimeAsc(LocalDate date);
}
