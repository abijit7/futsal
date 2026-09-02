package com.futsal.service;

import com.futsal.error.ConflictException;
import com.futsal.error.NotFoundException;
import com.futsal.model.Booking;
import com.futsal.model.Futsal;
import com.futsal.model.Review;
import com.futsal.model.TimeSlot;
import com.futsal.model.User;
import com.futsal.model.enums.BookingStatus;
import com.futsal.repository.BookingRepository;
import com.futsal.repository.FutsalRepository;
import com.futsal.repository.ReviewRepository;
import com.futsal.repository.UserRepository;
import com.futsal.security.SecurityAuth;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Clock;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Venue reviews.
 *
 * <p>A review is only accepted from someone who actually played: the booking must belong to the
 * caller, be APPROVED, be at the venue being reviewed, and have already finished. Without that
 * check the rating on every venue card would be worth nothing, so it is enforced here rather
 * than in the UI.
 */
@Service
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final BookingRepository bookingRepository;
    private final FutsalRepository futsalRepository;
    private final UserRepository userRepository;
    private final SecurityAuth securityAuth;
    private final Clock clock;

    public ReviewService(ReviewRepository reviewRepository,
                         BookingRepository bookingRepository,
                         FutsalRepository futsalRepository,
                         UserRepository userRepository,
                         SecurityAuth securityAuth,
                         Clock clock) {
        this.reviewRepository = reviewRepository;
        this.bookingRepository = bookingRepository;
        this.futsalRepository = futsalRepository;
        this.userRepository = userRepository;
        this.securityAuth = securityAuth;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public Page<Review> listForFutsal(Long futsalId, Pageable pageable) {
        if (!futsalRepository.existsById(futsalId)) {
            throw new NotFoundException("Futsal not found");
        }
        return reviewRepository.findByFutsal_FutsalIdOrderByCreatedAtDesc(futsalId, pageable);
    }

    /** Booking ids the user has already reviewed, so the client can hide the prompt for them. */
    @Transactional(readOnly = true)
    public List<Long> reviewedBookingIds(Long userId) {
        securityAuth.requireUserOrAdmin(userId);
        return reviewRepository.findReviewedBookingIdsByUser(userId);
    }

    @Transactional
    public Review create(Long futsalId, Long userId, Long bookingId, int rating, String comment) {
        securityAuth.requireUserOrAdmin(userId);

        Futsal futsal = futsalRepository.findById(futsalId)
                .orElseThrow(() -> new NotFoundException("Futsal not found"));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("User not found"));
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new NotFoundException("Booking not found"));

        requireReviewableBooking(booking, futsalId, userId);

        if (reviewRepository.existsByBooking_BookingId(bookingId)) {
            throw new ConflictException("You have already reviewed this booking.");
        }

        Review review = new Review(futsal, user, booking, rating, trimToNull(comment));
        try {
            review = reviewRepository.saveAndFlush(review);
        } catch (DataIntegrityViolationException ex) {
            // Two concurrent submissions for the same booking; the unique key decided the winner.
            throw new ConflictException("You have already reviewed this booking.");
        }

        recalculateRating(futsalId);
        return review;
    }

    @Transactional
    public Review update(Long reviewId, int rating, String comment) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new NotFoundException("Review not found"));
        securityAuth.requireUserOrAdmin(review.getUser().getUserId());

        review.setRating(rating);
        review.setComment(trimToNull(comment));
        review.setUpdatedAt(LocalDateTime.now(clock));
        Review saved = reviewRepository.save(review);

        recalculateRating(review.getFutsal().getFutsalId());
        return saved;
    }

    @Transactional
    public void delete(Long reviewId) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new NotFoundException("Review not found"));
        // Authors may retract their own review; admins may remove any as moderation.
        securityAuth.requireUserOrAdmin(review.getUser().getUserId());

        Long futsalId = review.getFutsal().getFutsalId();
        reviewRepository.delete(review);
        reviewRepository.flush();
        recalculateRating(futsalId);
    }

    /**
     * Rewrites the denormalised aggregate on the venue. Runs in the same transaction as the write
     * that caused it, so the card and the review list can never disagree.
     */
    void recalculateRating(Long futsalId) {
        Futsal futsal = futsalRepository.findById(futsalId).orElse(null);
        if (futsal == null) {
            return;
        }
        long count = reviewRepository.countByFutsal_FutsalId(futsalId);
        Double average = reviewRepository.averageRatingForFutsal(futsalId);

        futsal.setReviewCount((int) count);
        futsal.setRating(average == null
                ? BigDecimal.ZERO
                : BigDecimal.valueOf(average).setScale(1, RoundingMode.HALF_UP));
        futsalRepository.save(futsal);
    }

    private void requireReviewableBooking(Booking booking, Long futsalId, Long userId) {
        if (booking.getUser() == null || !userId.equals(booking.getUser().getUserId())) {
            throw new ConflictException("You can only review your own bookings.");
        }
        if (booking.getStatus() != BookingStatus.APPROVED) {
            throw new ConflictException("Only approved bookings can be reviewed.");
        }

        TimeSlot slot = booking.getTimeSlot();
        if (slot == null || slot.getFutsal() == null
                || !futsalId.equals(slot.getFutsal().getFutsalId())) {
            throw new ConflictException("This booking is not for the venue being reviewed.");
        }
        if (slot.getSlotDate() == null || slot.getEndTime() == null) {
            throw new ConflictException("This booking has no scheduled time.");
        }

        LocalDateTime playedUntil = LocalDateTime.of(slot.getSlotDate(), slot.getEndTime());
        if (playedUntil.isAfter(LocalDateTime.now(clock))) {
            throw new ConflictException("You can review this booking after you have played.");
        }
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
