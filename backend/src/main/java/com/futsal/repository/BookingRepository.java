package com.futsal.repository;

import com.futsal.model.Booking;
import com.futsal.model.TimeSlot;
import com.futsal.model.User;
import com.futsal.model.enums.BookingStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long>, JpaSpecificationExecutor<Booking> {

    List<Booking> findByUser(User user);

    /** Guards user deletion: a user with booking history cannot be removed. */
    long countByUser(User user);

    List<Booking> findByStatus(BookingStatus status);

    List<Booking> findByUserOrderByBookedAtDesc(User user);

    List<Booking> findAllByOrderByBookedAtDesc();

    Page<Booking> findByUserOrderByBookedAtDesc(User user, Pageable pageable);

    Page<Booking> findByUserAndStatusOrderByBookedAtDesc(User user, BookingStatus status, Pageable pageable);

    Page<Booking> findAllByOrderByBookedAtDesc(Pageable pageable);

    Page<Booking> findByStatusOrderByBookedAtDesc(BookingStatus status, Pageable pageable);

    boolean existsByTimeSlotAndStatusNotIn(TimeSlot timeSlot, Collection<BookingStatus> statuses);

    boolean existsByTimeSlot(TimeSlot timeSlot);

    boolean existsByTimeSlot_Futsal_FutsalIdAndStatusNotIn(Long futsalId, Collection<BookingStatus> statuses);

    boolean existsByTimeSlot_Futsal_FutsalId(Long futsalId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select b from Booking b join fetch b.timeSlot where b.bookingId = :bookingId")
    Optional<Booking> findByIdForUpdate(@Param("bookingId") Long bookingId);

    /**
     * Bookings left in {@code status} whose slot has already finished.
     *
     * <p>Returns ids rather than entities so the expiry sweep can lock and resolve each one in its
     * own transaction. Keyed on the slot's end time, not just its date, so a slot finishing at
     * 19:00 is expired at 19:00 rather than at midnight.
     */
    @Query("select b.bookingId from Booking b where b.status = :status "
            + "and (b.timeSlot.slotDate < :date "
            + "  or (b.timeSlot.slotDate = :date and b.timeSlot.endTime <= :time))")
    List<Long> findIdsByStatusAndSlotEndedBy(@Param("status") BookingStatus status,
                                             @Param("date") LocalDate date,
                                             @Param("time") LocalTime time);

    /**
     * Bookings left in {@code status} whose slot starts by {@code date}/{@code time} and has not
     * finished by {@code nowDate}/{@code nowTime}.
     *
     * <p>Drives the auto-approval deadline: called with "now plus the lead time", it returns the
     * bookings a venue has run out of time to answer.
     *
     * <p>The second bound matters. Approving a slot that has already finished confirms a match that
     * did not happen, and the expiry pass that would normally have taken those rows first can fail —
     * a database missing a migration is enough. Excluding them here keeps this query correct on its
     * own rather than only in combination with the pass before it.
     */
    @Query("select b.bookingId from Booking b where b.status = :status "
            + "and (b.timeSlot.slotDate < :date "
            + "  or (b.timeSlot.slotDate = :date and b.timeSlot.startTime <= :time)) "
            + "and (b.timeSlot.slotDate > :nowDate "
            + "  or (b.timeSlot.slotDate = :nowDate and b.timeSlot.endTime > :nowTime))")
    List<Long> findIdsByStatusAndSlotStartingBy(@Param("status") BookingStatus status,
                                                @Param("date") LocalDate date,
                                                @Param("time") LocalTime time,
                                                @Param("nowDate") LocalDate nowDate,
                                                @Param("nowTime") LocalTime nowTime);
}
