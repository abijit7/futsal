package com.futsal.repository;

import com.futsal.model.Booking;
import com.futsal.model.User;
import com.futsal.model.enums.BookingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {

    List<Booking> findByUser(User user);

    List<Booking> findByStatus(BookingStatus status);

    List<Booking> findByUserOrderByBookedAtDesc(User user);

    List<Booking> findAllByOrderByBookedAtDesc();

    boolean existsByTimeSlotAndStatusNotIn(com.futsal.model.TimeSlot timeSlot, java.util.Collection<com.futsal.model.enums.BookingStatus> statuses);
}
