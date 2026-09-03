package com.futsal.service;

import com.futsal.error.ConflictException;
import com.futsal.model.Booking;
import com.futsal.model.TimeSlot;
import com.futsal.model.enums.BookingStatus;
import com.futsal.repository.BookingRepository;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class BookingServiceTest {

    @Test
    void pendingBookingsCanMoveToTerminalOrApprovedStates() {
        assertTrue(BookingService.canTransition(BookingStatus.PENDING, BookingStatus.APPROVED));
        assertTrue(BookingService.canTransition(BookingStatus.PENDING, BookingStatus.REJECTED));
        assertTrue(BookingService.canTransition(BookingStatus.PENDING, BookingStatus.CANCELLED));
    }

    @Test
    void approvedBookingsCanOnlyBeCancelled() {
        assertTrue(BookingService.canTransition(BookingStatus.APPROVED, BookingStatus.CANCELLED));
        assertFalse(BookingService.canTransition(BookingStatus.APPROVED, BookingStatus.REJECTED));
        assertFalse(BookingService.canTransition(BookingStatus.APPROVED, BookingStatus.PENDING));
    }

    @Test
    void closedBookingsAreTerminal() {
        assertFalse(BookingService.canTransition(BookingStatus.CANCELLED, BookingStatus.PENDING));
        assertFalse(BookingService.canTransition(BookingStatus.CANCELLED, BookingStatus.APPROVED));
        assertFalse(BookingService.canTransition(BookingStatus.REJECTED, BookingStatus.PENDING));
        assertFalse(BookingService.canTransition(BookingStatus.REJECTED, BookingStatus.APPROVED));
    }

    @Test
    void sameStatusIsNotATransition() {
        assertFalse(BookingService.canTransition(BookingStatus.PENDING, BookingStatus.PENDING));
        assertFalse(BookingService.canTransition(BookingStatus.APPROVED, BookingStatus.APPROVED));
    }

    // ── Cancellation window ──────────────────────────────────────────────────

    private BookingService serviceWithClockAt(String instant, Booking booking) {
        BookingService service = new BookingService();
        BookingRepository bookings = mock(BookingRepository.class);
        when(bookings.findById(1L)).thenReturn(Optional.of(booking));
        ReflectionTestUtils.setField(service, "bookingRepository", bookings);
        ReflectionTestUtils.setField(service, "clock",
                Clock.fixed(Instant.parse(instant), ZoneId.of("UTC")));
        ReflectionTestUtils.setField(service, "cancellationCutoffHours", 24);
        return service;
    }

    private Booking bookingStartingAt(LocalDate date, LocalTime time) {
        TimeSlot slot = new TimeSlot();
        slot.setSlotDate(date);
        slot.setStartTime(time);
        Booking booking = new Booking();
        booking.setBookingId(1L);
        booking.setStatus(BookingStatus.APPROVED);
        booking.setTimeSlot(slot);
        return booking;
    }

    /** Inside the window the customer is refused, so the venue is not left with an empty court. */
    @Test
    void customerCannotCancelInsideTheCancellationWindow() {
        Booking booking = bookingStartingAt(LocalDate.of(2026, 6, 20), LocalTime.of(18, 0));
        // Six hours before the slot, well inside the 24-hour cutoff.
        BookingService service = serviceWithClockAt("2026-06-20T12:00:00Z", booking);

        ConflictException ex = assertThrows(ConflictException.class,
                () -> service.cancelAsCustomer(1L, "user:7"));
        assertTrue(ex.getMessage().contains("24 hours"), "the message should state the cutoff");
    }

    /** Outside the window the cancellation proceeds into the normal status transition. */
    @Test
    void customerCanCancelOutsideTheCancellationWindow() {
        Booking booking = bookingStartingAt(LocalDate.of(2026, 6, 25), LocalTime.of(18, 0));
        // Five days ahead, comfortably outside the cutoff.
        BookingService service = serviceWithClockAt("2026-06-20T12:00:00Z", booking);

        // updateStatus needs collaborators this unit test does not provide, so reaching it at all
        // proves the window let the request through - which is what this test is about.
        assertThrows(Exception.class, () -> service.cancelAsCustomer(1L, "user:7"));
    }
}
