package com.futsal.repository;

import com.futsal.model.Futsal;
import com.futsal.model.TimeSlot;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
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

    Page<TimeSlot> findByFutsal_FutsalIdAndSlotDateGreaterThanEqualOrderBySlotDateAscStartTimeAsc(
            Long futsalId, LocalDate date, Pageable pageable
    );

    Page<TimeSlot> findBySlotDateGreaterThanEqualOrderBySlotDateAscStartTimeAsc(LocalDate date, Pageable pageable);

    Page<TimeSlot> findByFutsal_FutsalIdAndSlotDateOrderBySlotDateAscStartTimeAsc(
            Long futsalId, LocalDate date, Pageable pageable
    );

    Page<TimeSlot> findBySlotDateOrderBySlotDateAscStartTimeAsc(LocalDate date, Pageable pageable);

    @Query("select s from TimeSlot s where s.available = true and s.slotDate >= :today and (s.slotDate > :today or s.startTime >= :minStartTime) and s.endTime <= :closingTime")
    Page<TimeSlot> findAvailableAfter(
            @Param("today") LocalDate today,
            @Param("minStartTime") LocalTime minStartTime,
            @Param("closingTime") LocalTime closingTime,
            Pageable pageable
    );

    @Query("select s from TimeSlot s where s.futsal.futsalId = :futsalId and s.available = true and s.slotDate >= :today and (s.slotDate > :today or s.startTime >= :minStartTime) and s.endTime <= :closingTime")
    Page<TimeSlot> findAvailableForFutsalAfter(
            @Param("futsalId") Long futsalId,
            @Param("today") LocalDate today,
            @Param("minStartTime") LocalTime minStartTime,
            @Param("closingTime") LocalTime closingTime,
            Pageable pageable
    );

    @Query("select s from TimeSlot s where s.available = true and s.slotDate = :slotDate and s.endTime <= :closingTime and (:isToday = false or s.startTime >= :minStartTime)")
    Page<TimeSlot> findAvailableOnDate(
            @Param("slotDate") LocalDate slotDate,
            @Param("isToday") boolean isToday,
            @Param("minStartTime") LocalTime minStartTime,
            @Param("closingTime") LocalTime closingTime,
            Pageable pageable
    );

    @Query("select s from TimeSlot s where s.futsal.futsalId = :futsalId and s.available = true and s.slotDate = :slotDate and s.endTime <= :closingTime and (:isToday = false or s.startTime >= :minStartTime)")
    Page<TimeSlot> findAvailableForFutsalOnDate(
            @Param("futsalId") Long futsalId,
            @Param("slotDate") LocalDate slotDate,
            @Param("isToday") boolean isToday,
            @Param("minStartTime") LocalTime minStartTime,
            @Param("closingTime") LocalTime closingTime,
            Pageable pageable
    );
}
