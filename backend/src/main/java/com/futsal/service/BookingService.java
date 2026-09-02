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
import com.futsal.repository.TimeSlotRepository;
import com.futsal.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class BookingService {

    static final List<BookingStatus> CLOSED_STATUSES = List.of(BookingStatus.CANCELLED, BookingStatus.REJECTED);

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TimeSlotRepository timeSlotRepository;

    @Autowired(required = false)
    private BookingNotificationService bookingNotificationService;

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

        if (newStatus == BookingStatus.REJECTED || newStatus == BookingStatus.CANCELLED) {
            if (!slot.isAvailable()) {
                slot.setAvailable(true);
                String note = newStatus == BookingStatus.CANCELLED ? "Booking cancelled" : "Booking rejected";
                slot.addStatusHistory(new TimeSlotStatusHistory(slot, true, changedBy, note));
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
        return saved;
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
                    || next == BookingStatus.CANCELLED;
            case APPROVED -> next == BookingStatus.CANCELLED;
            case REJECTED, CANCELLED -> false;
        };
    }

    // ── Get bookings by status ────────────────────────────────────────────────
    public List<Booking> getBookingsByStatus(BookingStatus status) {
        return bookingRepository.findByStatus(status);
    }

    // ── Delete booking (admin only) ───────────────────────────────────────────
    @Transactional
    public void deleteBooking(Long id) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Booking not found"));

        // Free the slot if deleting
        if (booking.getStatus() != BookingStatus.CANCELLED &&
            booking.getStatus() != BookingStatus.REJECTED) {
            booking.getTimeSlot().setAvailable(true);
            timeSlotRepository.save(booking.getTimeSlot());
        }

        bookingRepository.deleteById(id);
    }
}
