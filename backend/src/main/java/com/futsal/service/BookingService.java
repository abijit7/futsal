package com.futsal.service;

import com.futsal.model.Booking;
import com.futsal.model.TimeSlot;
import com.futsal.model.User;
import com.futsal.model.enums.BookingStatus;
import com.futsal.model.enums.PaymentMethod;
import com.futsal.repository.BookingRepository;
import com.futsal.repository.TimeSlotRepository;
import com.futsal.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class BookingService {

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

        TimeSlot slot = timeSlotRepository.findById(slotId)
                .orElseThrow(() -> new RuntimeException("Time slot not found"));

        java.util.List<BookingStatus> closed = java.util.List.of(BookingStatus.CANCELLED, BookingStatus.REJECTED);
        if (bookingRepository.existsByTimeSlotAndStatusNotIn(slot, closed)) {
            throw new RuntimeException("This slot has already been booked.");
        }

        if (!slot.isAvailable()) {
            throw new RuntimeException("This slot is no longer available. Please choose another slot.");
        }

        // Mark slot as unavailable
        slot.setAvailable(false);
        timeSlotRepository.save(slot);

        try {
            Booking booking = new Booking(user, slot, notes, paymentMethod, paymentRef);
            return bookingRepository.save(booking);
        } catch (DataIntegrityViolationException ex) {
            throw new RuntimeException("This slot was just booked by someone else. Please choose another slot.");
        }
    }

    // ── Create a new booking (payment required) ─────────────────────────────
    @Transactional
    public Booking createBooking(Long userId, Long slotId, String notes) {
        throw new RuntimeException("Payment required. Use the payment confirmation flow.");
    }

    // ── Get all bookings (admin) ──────────────────────────────────────────────
    public List<Booking> getAllBookings() {
        return bookingRepository.findAllByOrderByBookedAtDesc();
    }

    // ── Get bookings by user ──────────────────────────────────────────────────
    public List<Booking> getBookingsByUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return bookingRepository.findByUserOrderByBookedAtDesc(user);
    }

    // ── Get booking by ID ─────────────────────────────────────────────────────
    public Booking getBookingById(Long id) {
        return bookingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Booking not found"));
    }

    // ── Update booking status (admin: approve/reject, user: cancel) ───────────
    @Transactional
    public Booking updateStatus(Long bookingId, BookingStatus newStatus) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        BookingStatus current = booking.getStatus();

        // Validate status transitions
        if (current == BookingStatus.CANCELLED) {
            throw new RuntimeException("Cannot update a cancelled booking.");
        }

        // If rejected or cancelled, free up the slot
        if (newStatus == BookingStatus.REJECTED || newStatus == BookingStatus.CANCELLED) {
            TimeSlot slot = booking.getTimeSlot();
            slot.setAvailable(true);
            timeSlotRepository.save(slot);
        }

        booking.setStatus(newStatus);
        return bookingRepository.save(booking);
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
