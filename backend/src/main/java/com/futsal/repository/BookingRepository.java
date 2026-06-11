package com.futsal.repository;

import com.futsal.model.Booking;
import com.futsal.model.TimeSlot;
import com.futsal.model.User;
import com.futsal.model.enums.BookingStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {

    List<Booking> findByUser(User user);

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
}
