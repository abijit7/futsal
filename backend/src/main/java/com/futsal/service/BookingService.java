package com.futsal.service;

import com.futsal.error.ConflictException;
import com.futsal.error.NotFoundException;
import com.futsal.model.Booking;
import com.futsal.model.BookingStatusHistory;
import com.futsal.model.TimeSlot;
import com.futsal.model.TimeSlotStatusHistory;
import com.futsal.model.User;
import com.futsal.model.enums.BookingStatus;
import com.futsal.model.enums.PaymentMethod;
import com.futsal.repository.BookingRepository;
import com.futsal.repository.PaymentTransactionRepository;
import com.futsal.repository.ReviewRepository;
import com.futsal.repository.TimeSlotRepository;
import com.futsal.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class BookingService {

    /**
     * Statuses that no longer hold their slot, so a new booking may take it.
     *
     * <p>EXPIRED belongs here for the same reason CANCELLED and REJECTED do: the expiry sweep
     * releases the slot, and without this the slot would read as available while
     * {@link #createPaidBooking} still refused it as already booked.
     */
    static final List<BookingStatus> CLOSED_STATUSES =
            List.of(BookingStatus.CANCELLED, BookingStatus.REJECTED, BookingStatus.EXPIRED);

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TimeSlotRepository timeSlotRepository;

    @Autowired(required = false)
    private BookingNotificationService bookingNotificationService;

    @Autowired(required = false)
    private RefundService refundService;

    /**
     * Rows that point at a booking and must go with it. Optional for the same reason as the two
     * above: the unit tests build this service with {@code new BookingService()}.
     */
    @Autowired(required = false)
    private PaymentTransactionRepository paymentTransactionRepository;

    @Autowired(required = false)
    private ReviewRepository reviewRepository;

    /** Only for rewriting a venue's rating after a review disappears with its booking. */
    @Autowired(required = false)
    private ReviewService reviewService;

    /**
     * Optional so the existing unit tests can construct this service without a Spring context;
     * {@link #now()} falls back to the system clock when it is absent.
     */
    @Autowired(required = false)
    private Clock clock;

    /**
     * How close to the slot a customer may still cancel it themselves. Admins are not subject to
     * this: an operator must always be able to cancel, for example when a court floods.
     */
    @Value("${app.booking.cancellation-cutoff-hours:24}")
    private int cancellationCutoffHours;

    /**
     * How long before a slot starts an unanswered booking is approved anyway. Zero disables the
     * deadline entirely, leaving every cash booking to a human.
     */
    @Value("${app.booking.auto-approve-lead-hours:2}")
    private int autoApproveLeadHours;

    // ── Create a new booking after payment confirmation ─────────────────────
    @Transactional
    public Booking createPaidBooking(Long userId, Long slotId, String notes, PaymentMethod paymentMethod, String paymentRef) {
        if (paymentMethod == null) {
            throw new IllegalArgumentException("Payment method is required.");
        }
        if (paymentRef == null || paymentRef.trim().isEmpty()) {
            throw new IllegalArgumentException("Payment reference is required.");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("User not found"));

        TimeSlot slot = timeSlotRepository.findByIdForUpdate(slotId)
                .orElseThrow(() -> new NotFoundException("Time slot not found"));

        if (bookingRepository.existsByTimeSlotAndStatusNotIn(slot, CLOSED_STATUSES)) {
            throw new ConflictException("This slot has already been booked.");
        }

        if (!slot.isAvailable()) {
            throw new ConflictException("This slot is no longer available. Please choose another slot.");
        }

        // Mark slot as unavailable and record history
        slot.setAvailable(false);
        slot.addStatusHistory(new TimeSlotStatusHistory(slot, false, "user:" + userId, "Booked"));
        timeSlotRepository.save(slot);

        try {
            Booking booking = new Booking(user, slot, notes, paymentMethod, paymentRef);
            booking.addStatusHistory(new BookingStatusHistory(booking, booking.getStatus(), "user:" + userId, "Booking created"));
            return bookingRepository.save(booking);
        } catch (DataIntegrityViolationException ex) {
            throw new ConflictException("This slot was just booked by someone else. Please choose another slot.");
        }
    }

    /**
     * Attaches a settled gateway payment to a booking that is already holding its slot.
     *
     * <p>The booking and the slot hold are created up front by
     * {@link #createPaidBooking} when the payment is initiated, carrying the gateway's
     * transaction uuid as a placeholder reference. This swaps in the real reference once the
     * gateway has confirmed the money moved. The booking stays PENDING - an admin still approves
     * it, exactly as with a cash booking.
     */
    @Transactional
    public Booking settleGatewayPayment(Long bookingId, String gatewayReference) {
        Booking booking = bookingRepository.findByIdForUpdate(bookingId)
                .orElseThrow(() -> new NotFoundException("Booking not found"));
        booking.setPaymentRef(gatewayReference);
        booking.setPaidAt(LocalDateTime.now());
        booking.addStatusHistory(new BookingStatusHistory(
                booking, booking.getStatus(), "payment", "Payment confirmed by gateway"));
        return bookingRepository.save(booking);
    }

    /**
     * Admin listing with the filters the console actually offers: status, slot date and a free
     * text match over the customer and venue. Built as a Specification so absent filters simply
     * contribute no predicate, mirroring FutsalService.searchSpec.
     */
    public Page<Booking> searchBookings(BookingStatus status, LocalDate slotDate, String query, Pageable pageable) {
        String term = query == null ? "" : query.trim().toLowerCase();

        Specification<Booking> spec = (root, criteriaQuery, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            if (slotDate != null) {
                predicates.add(cb.equal(root.get("timeSlot").get("slotDate"), slotDate));
            }
            if (!term.isBlank()) {
                String pattern = "%" + term + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("user").get("name")), pattern),
                        cb.like(cb.lower(root.get("user").get("email")), pattern),
                        cb.like(cb.lower(root.get("user").get("phone")), pattern),
                        cb.like(cb.lower(root.get("timeSlot").get("futsal").get("name")), pattern),
                        cb.like(cb.lower(root.get("paymentRef")), pattern)
                ));
            }
            return predicates.isEmpty() ? null : cb.and(predicates.toArray(new Predicate[0]));
        };

        Pageable sorted = PageRequest.of(
                pageable.getPageNumber(), pageable.getPageSize(), Sort.by(Sort.Order.desc("bookedAt")));
        return bookingRepository.findAll(spec, sorted);
    }

    // ── Get bookings by user ──────────────────────────────────────────────────
    public Page<Booking> getBookingsByUser(Long userId, BookingStatus status, Pageable pageable) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("User not found"));
        if (status != null) {
            return bookingRepository.findByUserAndStatusOrderByBookedAtDesc(user, status, pageable);
        }
        return bookingRepository.findByUserOrderByBookedAtDesc(user, pageable);
    }

    // ── Get booking by ID ─────────────────────────────────────────────────────
    public Booking getBookingById(Long id) {
        return bookingRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Booking not found"));
    }

    // ── Update booking status (admin: approve/reject, user: cancel) ───────────
    @Transactional
    public Booking updateStatus(Long bookingId, BookingStatus newStatus, String changedBy) {
        if (newStatus == null) {
            throw new IllegalArgumentException("Booking status is required.");
        }

        Booking booking = bookingRepository.findByIdForUpdate(bookingId)
                .orElseThrow(() -> new NotFoundException("Booking not found"));

        BookingStatus current = booking.getStatus();

        if (current == newStatus) {
            return booking;
        }

        if (!canTransition(current, newStatus)) {
            throw new ConflictException("Invalid booking status transition from " + current + " to " + newStatus + ".");
        }

        TimeSlot slot = timeSlotRepository.findByIdForUpdate(booking.getTimeSlot().getSlotId())
                .orElseThrow(() -> new NotFoundException("Time slot not found"));
        booking.setTimeSlot(slot);

        // Approving a slot that has already finished confirms a match that did not happen, and
        // races the expiry sweep for the same row. Refused for everyone, admins included.
        if (newStatus == BookingStatus.APPROVED && hasSlotEnded(slot)) {
            throw new ConflictException(
                    "This booking's slot has already passed, so it can no longer be approved. "
                            + "It will be marked expired.");
        }

        if (releasesSlot(newStatus)) {
            if (!slot.isAvailable()) {
                slot.setAvailable(true);
                slot.addStatusHistory(new TimeSlotStatusHistory(slot, true, changedBy, slotReleaseNote(newStatus)));
                timeSlotRepository.save(slot);
            }
        } else if (newStatus == BookingStatus.APPROVED && slot.isAvailable()) {
            slot.setAvailable(false);
            slot.addStatusHistory(new TimeSlotStatusHistory(slot, false, changedBy, "Booking approved"));
            timeSlotRepository.save(slot);
        }

        booking.setStatus(newStatus);
        booking.addStatusHistory(new BookingStatusHistory(booking, newStatus, changedBy, "Status updated"));
        Booking saved = bookingRepository.save(booking);
        notifyStatusChanged(saved, newStatus);
        if (releasesSlot(newStatus)) {
            markRefundIfPaid(saved, newStatus, changedBy);
        }
        return saved;
    }

    /** The three terminal states that hand the slot back and may owe the customer money. */
    private static boolean releasesSlot(BookingStatus status) {
        return status == BookingStatus.REJECTED
                || status == BookingStatus.CANCELLED
                || status == BookingStatus.EXPIRED;
    }

    private static String slotReleaseNote(BookingStatus status) {
        return switch (status) {
            case CANCELLED -> "Booking cancelled";
            case EXPIRED -> "Booking expired unconfirmed";
            default -> "Booking rejected";
        };
    }

    /**
     * Records that a cancelled or rejected booking owes a refund.
     *
     * <p>Safe to call unconditionally: RefundService ignores anything that did not settle through a
     * gateway. That matters because PaymentGatewayService.releaseHold cancels abandoned checkouts
     * through this very method, and those must not produce a refund for money never taken.
     */
    private void markRefundIfPaid(Booking booking, BookingStatus newStatus, String changedBy) {
        if (refundService == null) {
            return;
        }
        String reason = switch (newStatus) {
            case CANCELLED -> "Booking cancelled";
            case EXPIRED -> "Booking expired without confirmation";
            default -> "Booking rejected by the venue";
        };
        refundService.markRefundDue(booking, reason, changedBy);
    }

    /**
     * Cancels a booking on behalf of its owner, subject to the cancellation window.
     *
     * <p>Separate from {@link #updateStatus} so the window applies only to customers. The
     * controller decides which of the two to call based on who is authenticated.
     */
    @Transactional
    public Booking cancelAsCustomer(Long bookingId, String changedBy) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new NotFoundException("Booking not found"));

        TimeSlot slot = booking.getTimeSlot();
        if (slot != null && slot.getSlotDate() != null && slot.getStartTime() != null) {
            LocalDateTime startsAt = LocalDateTime.of(slot.getSlotDate(), slot.getStartTime());
            LocalDateTime cutoff = now().plusHours(cancellationCutoffHours);
            // The window protects the venue from last-minute cancellations of bookings that are
            // still to come. Once the slot has started there is nothing left to protect, and
            // applying it there would leave the customer unable to close their own booking at all.
            if (startsAt.isAfter(now()) && startsAt.isBefore(cutoff)) {
                throw new ConflictException(
                        "This booking starts within " + cancellationCutoffHours + " hours and can no "
                                + "longer be cancelled online. Please contact the venue.");
            }
        }
        return updateStatus(bookingId, BookingStatus.CANCELLED, changedBy);
    }

    private LocalDateTime now() {
        return clock == null ? LocalDateTime.now() : LocalDateTime.now(clock);
    }

    /**
     * Ids of bookings still awaiting a decision whose slot has already finished.
     *
     * <p>Read-only and outside any transaction: {@code BookingExpirySweeper} resolves each id in
     * its own unit of work so one bad row cannot roll the whole batch back.
     */
    public List<Long> findLapsedPendingBookingIds() {
        LocalDateTime now = now();
        return bookingRepository.findIdsByStatusAndSlotEndedBy(
                BookingStatus.PENDING, now.toLocalDate(), now.toLocalTime());
    }

    /**
     * Ids of bookings the venue has run out of time to answer.
     *
     * <p>A booking still awaiting a decision this close to its slot leaves the customer with no idea
     * whether they have a court, so silence is treated as acceptance. Returns nothing when the lead
     * time is zero or negative, which switches the deadline off rather than approving everything on
     * the spot.
     */
    public List<Long> findUnansweredBookingIds() {
        if (autoApproveLeadHours <= 0) {
            return List.of();
        }
        LocalDateTime now = now();
        LocalDateTime deadline = now.plusHours(autoApproveLeadHours);
        return bookingRepository.findIdsByStatusAndSlotStartingBy(
                BookingStatus.PENDING,
                deadline.toLocalDate(), deadline.toLocalTime(),
                now.toLocalDate(), now.toLocalTime());
    }

    private boolean hasSlotEnded(TimeSlot slot) {
        if (slot == null || slot.getSlotDate() == null || slot.getEndTime() == null) {
            return false;
        }
        LocalDate date = slot.getSlotDate();
        LocalTime end = slot.getEndTime();
        return !LocalDateTime.of(date, end).isAfter(now());
    }

    /**
     * Tells the customer their booking was approved, rejected or cancelled. Deferred to commit so
     * a rollback sends nothing, and skipped entirely when no notifier is wired in.
     */
    private void notifyStatusChanged(Booking booking, BookingStatus newStatus) {
        if (bookingNotificationService == null) {
            return;
        }
        BookingNotification snapshot = BookingNotification.from(booking, null);
        if (snapshot == null) {
            return;
        }
        AfterCommit.run(() -> bookingNotificationService.sendStatusChanged(snapshot, newStatus));
    }

    static boolean canTransition(BookingStatus current, BookingStatus next) {
        if (current == null || next == null || current == next) {
            return false;
        }
        return switch (current) {
            case PENDING -> next == BookingStatus.APPROVED
                    || next == BookingStatus.REJECTED
                    || next == BookingStatus.CANCELLED
                    || next == BookingStatus.EXPIRED;
            case APPROVED -> next == BookingStatus.CANCELLED;
            // EXPIRED is terminal like the other two: the slot has already passed, so there is
            // nothing left to approve, reject or cancel.
            case REJECTED, CANCELLED, EXPIRED -> false;
        };
    }

    // ── Get bookings by status ────────────────────────────────────────────────
    public List<Booking> getBookingsByStatus(BookingStatus status) {
        return bookingRepository.findByStatus(status);
    }

    // ── Delete booking (admin only) ───────────────────────────────────────────

    /**
     * Removes a booking and everything that points at it.
     *
     * <p>The payment and review rows carry a foreign key to this booking. The migration schema
     * declares both with {@code ON DELETE CASCADE}, but a database built by {@code ddl-auto=update}
     * gets Hibernate-generated keys without it, so relying on the database to clean up works in
     * production and fails in development. The dependants are therefore removed explicitly, which
     * behaves the same either way.
     */
    @Transactional
    public void deleteBooking(Long id) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Booking not found"));

        // A booking in a closed state already handed its slot back.
        if (!CLOSED_STATUSES.contains(booking.getStatus())) {
            booking.getTimeSlot().setAvailable(true);
            timeSlotRepository.save(booking.getTimeSlot());
        }

        deleteReviewFor(id);
        if (paymentTransactionRepository != null) {
            paymentTransactionRepository.findByBooking(booking)
                    .ifPresent(paymentTransactionRepository::delete);
        }

        bookingRepository.deleteById(id);
    }

    /**
     * Drops the review left on this booking, if any, and rewrites the venue's rating.
     *
     * <p>Deleting the row alone would leave {@code futsals.rating} and {@code review_count} counting
     * a review that no longer exists, so the aggregate is recomputed in the same transaction.
     */
    private void deleteReviewFor(Long bookingId) {
        if (reviewRepository == null) {
            return;
        }
        reviewRepository.findByBooking_BookingId(bookingId).ifPresent(review -> {
            Long futsalId = review.getFutsal().getFutsalId();
            reviewRepository.delete(review);
            reviewRepository.flush();
            if (reviewService != null) {
                reviewService.recalculateRating(futsalId);
            }
        });
    }
}
