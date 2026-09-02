package com.futsal.repository;

import com.futsal.model.Review;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {

    Page<Review> findByFutsal_FutsalIdOrderByCreatedAtDesc(Long futsalId, Pageable pageable);

    Optional<Review> findByBooking_BookingId(Long bookingId);

    boolean existsByBooking_BookingId(Long bookingId);

    /** Bookings the caller has already reviewed, so the UI can hide the prompt for them. */
    @Query("select r.booking.bookingId from Review r where r.user.userId = :userId")
    List<Long> findReviewedBookingIdsByUser(@Param("userId") Long userId);

    long countByFutsal_FutsalId(Long futsalId);

    /** Null when the venue has no reviews; callers translate that to a zero rating. */
    @Query("select avg(r.rating) from Review r where r.futsal.futsalId = :futsalId")
    Double averageRatingForFutsal(@Param("futsalId") Long futsalId);
}
