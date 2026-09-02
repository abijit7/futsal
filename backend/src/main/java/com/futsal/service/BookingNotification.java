package com.futsal.service;

import com.futsal.model.Booking;
import com.futsal.model.Futsal;
import com.futsal.model.TimeSlot;
import com.futsal.model.enums.BookingStatus;
import com.futsal.model.enums.PaymentMethod;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;

/**
 * A flat snapshot of everything a booking email needs.
 *
 * <p>Built inside the transaction that changed the booking and handed to the async sender, so
 * that the mail thread never touches a JPA entity. The associations are all EAGER today, but
 * depending on that from another thread is the kind of coupling that breaks quietly the first
 * time someone tunes a fetch type.
 */
public record BookingNotification(
        Long bookingId,
        String recipientEmail,
        String recipientName,
        String venueName,
        String venueAddress,
        LocalDate slotDate,
        LocalTime startTime,
        LocalTime endTime,
        BigDecimal amount,
        PaymentMethod paymentMethod,
        String paymentReference,
        BookingStatus status
) {

    /** Returns null when the booking cannot produce a deliverable email. */
    public static BookingNotification from(Booking booking, BigDecimal amount) {
        if (booking == null || booking.getUser() == null) {
            return null;
        }
        String email = booking.getUser().getEmail();
        if (email == null || email.isBlank()) {
            return null;
        }
        TimeSlot slot = booking.getTimeSlot();
        Futsal futsal = slot == null ? null : slot.getFutsal();
        return new BookingNotification(
                booking.getBookingId(),
                email,
                booking.getUser().getName(),
                futsal == null ? "your venue" : futsal.getName(),
                futsal == null ? null : futsal.getAddress(),
                slot == null ? null : slot.getSlotDate(),
                slot == null ? null : slot.getStartTime(),
                slot == null ? null : slot.getEndTime(),
                amount,
                booking.getPaymentMethod(),
                booking.getPaymentRef(),
                booking.getStatus());
    }
}
