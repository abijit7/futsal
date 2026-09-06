package com.futsal.config;

import com.futsal.model.enums.BookingStatus;
import com.futsal.service.BookingService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Closes out bookings nobody ever decided on.
 *
 * <p>A booking stays PENDING until an admin approves or rejects it. When the slot comes and goes
 * with no decision, the booking used to sit there forever: the slot stayed held, the customer could
 * not cancel it because the cancellation window had closed, and any money taken was never recorded
 * as owed. This sweep resolves them to EXPIRED, which releases the slot and marks the refund.
 *
 * <p>Separate from {@link BookingService} for the same reason {@link DemoDataSeeder} is separate
 * from its service: {@code updateStatus} is {@code @Transactional}, and a self-invoked call would
 * silently run outside a transaction. Going through the injected proxy also gives every booking its
 * own unit of work, so one bad row cannot roll the whole batch back.
 */
@Component
public class BookingExpirySweeper {

    private static final Logger log = LoggerFactory.getLogger(BookingExpirySweeper.class);

    private static final String EXPIRY_ACTOR = "system:expiry";

    private static final String APPROVAL_ACTOR = "system:auto-approve";

    private final BookingService bookingService;

    public BookingExpirySweeper(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    /**
     * Resolves undecided bookings, in two passes.
     *
     * <p>Order matters. Expiry runs first, so a booking whose slot has already ended leaves PENDING
     * on that pass and cannot be picked up by the approval pass behind it. {@code updateStatus}
     * would refuse to approve a lapsed slot anyway, but leaning on an exception for control flow
     * would be worse than sequencing the two properly.
     */
    @Scheduled(fixedDelayString = "${app.booking.expiry-sweep-interval-ms:900000}")
    public void resolveUndecidedBookings() {
        expireLapsedBookings();
        approveUnansweredBookings();
    }

    /** Bookings nobody decided on before their slot came and went. */
    private void expireLapsedBookings() {
        List<Long> lapsed = bookingService.findLapsedPendingBookingIds();
        if (lapsed.isEmpty()) {
            return;
        }

        int expired = 0;
        int failed = 0;
        for (Long bookingId : lapsed) {
            try {
                bookingService.updateStatus(bookingId, BookingStatus.EXPIRED, EXPIRY_ACTOR);
                expired++;
            } catch (RuntimeException ex) {
                // Someone decided on this booking between the listing and the update, or the row
                // is broken. Either way the rest of the batch continues.
                failed++;
                log.warn("Could not expire bookingId={}", bookingId, ex);
            }
        }
        log.info("Expired {} unconfirmed booking(s) whose slot had passed; {} could not be resolved",
                expired, failed);
    }

    /**
     * Bookings whose slot is close enough that the venue has run out of time to answer.
     *
     * <p>Silence becomes acceptance: leaving the customer to find out at the court whether they have
     * one is worse than committing the venue to a booking it never declined.
     */
    private void approveUnansweredBookings() {
        List<Long> unanswered = bookingService.findUnansweredBookingIds();
        if (unanswered.isEmpty()) {
            return;
        }

        int approved = 0;
        int failed = 0;
        for (Long bookingId : unanswered) {
            try {
                bookingService.updateStatus(bookingId, BookingStatus.APPROVED, APPROVAL_ACTOR);
                approved++;
            } catch (RuntimeException ex) {
                failed++;
                log.warn("Could not auto-approve bookingId={}", bookingId, ex);
            }
        }
        log.info("Auto-approved {} booking(s) the venue did not answer in time; {} could not be resolved",
                approved, failed);
    }
}
