package com.futsal.service;

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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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

    // ── Create a new booking after payment confirmation ─────────────────────
    @Transactional
    public Booking createPaidBooking(Long userId, Long slotId, String notes, PaymentMethod paymentMethod, String paymentRef) {
        if (paymentMethod == null) {
            throw new RuntimeException("Payment method is required.");
        }
        if (paymentRef == null || paymentRef.trim().isEmpty()) {
            throw new RuntimeException("Payment reference is required.");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        TimeSlot slot = timeSlotRepository.findByIdForUpdate(slotId)
                .orElseThrow(() -> new RuntimeException("Time slot not found"));

        if (bookingRepository.existsByTimeSlotAndStatusNotIn(slot, CLOSED_STATUSES)) {
            throw new RuntimeException("This slot has already been booked.");
        }

        if (!slot.isAvailable()) {
            throw new RuntimeException("This slot is no longer available. Please choose another slot.");
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
            throw new RuntimeException("This slot was just booked by someone else. Please choose another slot.");
        }
    }

    // ── Create a new booking (payment required) ─────────────────────────────
    @Transactional
    public Booking createBooking(Long userId, Long slotId, String notes) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        TimeSlot slot = timeSlotRepository.findById(slotId)
                .orElseThrow(() -> new RuntimeException("Time slot not found"));

        // Create a pending booking without marking slot as unavailable
        Booking booking = new Booking(user, slot, notes, PaymentMethod.CASH_IN_HAND, "PENDING");
        booking.setStatus(BookingStatus.PENDING);
        booking.addStatusHistory(new BookingStatusHistory(booking, BookingStatus.PENDING, "user:" + userId, "Booking created - pending payment"));

        return bookingRepository.save(booking);
    }

    // ── Get all bookings (admin) ──────────────────────────────────────────────
    public Page<Booking> getAllBookings(Pageable pageable) {
        return bookingRepository.findAllByOrderByBookedAtDesc(pageable);
    }

    // ── Get bookings by status (admin) ────────────────────────────────────────
    public Page<Booking> getBookingsByStatus(BookingStatus status, Pageable pageable) {
        return bookingRepository.findByStatusOrderByBookedAtDesc(status, pageable);
    }

    // ── Get bookings by user ──────────────────────────────────────────────────
    public Page<Booking> getBookingsByUser(Long userId, BookingStatus status, Pageable pageable) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        if (status != null) {
            return bookingRepository.findByUserAndStatusOrderByBookedAtDesc(user, status, pageable);
        }
        return bookingRepository.findByUserOrderByBookedAtDesc(user, pageable);
    }

    // ── Get booking by ID ─────────────────────────────────────────────────────
    public Booking getBookingById(Long id) {
        return bookingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Booking not found"));
    }

    // ── Update booking status (admin: approve/reject, user: cancel) ───────────
    @Transactional
    public Booking updateStatus(Long bookingId, BookingStatus newStatus, String changedBy) {
        if (newStatus == null) {
            throw new RuntimeException("Booking status is required.");
        }

        Booking booking = bookingRepository.findByIdForUpdate(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        BookingStatus current = booking.getStatus();

        if (current == newStatus) {
            return booking;
        }

        if (!canTransition(current, newStatus)) {
            throw new RuntimeException("Invalid booking status transition from " + current + " to " + newStatus + ".");
        }

        TimeSlot slot = timeSlotRepository.findByIdForUpdate(booking.getTimeSlot().getSlotId())
                .orElseThrow(() -> new RuntimeException("Time slot not found"));
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
        return bookingRepository.save(booking);
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
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        // Free the slot if deleting
        if (booking.getStatus() != BookingStatus.CANCELLED &&
            booking.getStatus() != BookingStatus.REJECTED) {
            booking.getTimeSlot().setAvailable(true);
            timeSlotRepository.save(booking.getTimeSlot());
        }

        bookingRepository.deleteById(id);
    }
}
