package com.futsal.service;

import com.futsal.error.ConflictException;
import com.futsal.model.Booking;
import com.futsal.model.TimeSlot;
import com.futsal.model.enums.BookingStatus;
import com.futsal.repository.BookingRepository;
import com.futsal.repository.TimeSlotRepository;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verifyNoInteractions;
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

    // ── Expiry ───────────────────────────────────────────────────────────────

    @Test
    void aPendingBookingCanExpire() {
        assertTrue(BookingService.canTransition(BookingStatus.PENDING, BookingStatus.EXPIRED));
    }

    /** Only the sweep writes EXPIRED, and the slot has passed, so nothing leads back out of it. */
    @Test
    void expiredBookingsAreTerminal() {
        for (BookingStatus next : BookingStatus.values()) {
            assertFalse(BookingService.canTransition(BookingStatus.EXPIRED, next),
                    "EXPIRED must not transition to " + next);
        }
        assertFalse(BookingService.canTransition(BookingStatus.APPROVED, BookingStatus.EXPIRED),
                "a match that was approved and played is not expired");
    }

    /**
     * The sweep frees the slot, so the slot must also stop counting as booked. Without EXPIRED in
     * CLOSED_STATUSES the slot would read as available while createPaidBooking still refused it.
     */
    @Test
    void anExpiredBookingNoLongerHoldsItsSlot() {
        assertTrue(BookingService.CLOSED_STATUSES.contains(BookingStatus.EXPIRED));
    }

    @Test
    void approvingABookingWhoseSlotHasAlreadyPassedIsRefused() {
        BookingService service = serviceWithSlot(
                BookingStatus.PENDING, LocalDate.of(2026, 6, 19), LocalTime.of(18, 0), LocalTime.of(19, 0),
                "2026-06-20T12:00:00Z");

        ConflictException ex = assertThrows(ConflictException.class,
                () -> service.updateStatus(1L, BookingStatus.APPROVED, "admin:1"));
        assertTrue(ex.getMessage().contains("already passed"));
    }

    /** The same booking may still be expired — that is the whole point of the sweep. */
    @Test
    void aLapsedBookingCanStillBeExpired() {
        BookingService service = serviceWithSlot(
                BookingStatus.PENDING, LocalDate.of(2026, 6, 19), LocalTime.of(18, 0), LocalTime.of(19, 0),
                "2026-06-20T12:00:00Z");

        Booking expired = service.updateStatus(1L, BookingStatus.EXPIRED, "system:expiry");

        assertEquals(BookingStatus.EXPIRED, expired.getStatus());
        assertTrue(expired.getTimeSlot().isAvailable(), "the slot must be handed back");
    }

    /** A slot still running today has not ended, so it stays approvable. */
    @Test
    void aSlotThatHasNotFinishedYetIsStillApprovable() {
        BookingService service = serviceWithSlot(
                BookingStatus.PENDING, LocalDate.of(2026, 6, 20), LocalTime.of(18, 0), LocalTime.of(19, 0),
                "2026-06-20T12:00:00Z");

        Booking approved = service.updateStatus(1L, BookingStatus.APPROVED, "admin:1");

        assertEquals(BookingStatus.APPROVED, approved.getStatus());
    }

    // ── Auto-approval deadline ───────────────────────────────────────────────

    @Test
    void unansweredBookingsAreLookedUpAgainstTheDeadlineNotNow() {
        BookingService service = new BookingService();
        BookingRepository bookings = mock(BookingRepository.class);
        ReflectionTestUtils.setField(service, "bookingRepository", bookings);
        ReflectionTestUtils.setField(service, "clock",
                Clock.fixed(Instant.parse("2026-06-20T12:00:00Z"), ZoneId.of("UTC")));
        ReflectionTestUtils.setField(service, "autoApproveLeadHours", 2);
        // 12:00 plus the two-hour lead: bookings starting by 14:00 are out of time, and the second
        // bound excludes anything that has already finished by 12:00.
        when(bookings.findIdsByStatusAndSlotStartingBy(BookingStatus.PENDING,
                LocalDate.of(2026, 6, 20), LocalTime.of(14, 0),
                LocalDate.of(2026, 6, 20), LocalTime.of(12, 0))).thenReturn(List.of(3L));

        assertEquals(List.of(3L), service.findUnansweredBookingIds());
    }

    /** Zero must switch the deadline off, not approve everything on the spot. */
    @Test
    void aZeroLeadTimeDisablesTheDeadlineEntirely() {
        BookingService service = new BookingService();
        BookingRepository bookings = mock(BookingRepository.class);
        ReflectionTestUtils.setField(service, "bookingRepository", bookings);
        ReflectionTestUtils.setField(service, "clock",
                Clock.fixed(Instant.parse("2026-06-20T12:00:00Z"), ZoneId.of("UTC")));
        ReflectionTestUtils.setField(service, "autoApproveLeadHours", 0);

        assertEquals(List.of(), service.findUnansweredBookingIds());
        verifyNoInteractions(bookings);
    }

    @Test
    void lapsedPendingBookingsAreLookedUpAgainstTheCurrentInstant() {
        BookingService service = new BookingService();
        BookingRepository bookings = mock(BookingRepository.class);
        ReflectionTestUtils.setField(service, "bookingRepository", bookings);
        ReflectionTestUtils.setField(service, "clock",
                Clock.fixed(Instant.parse("2026-06-20T12:30:00Z"), ZoneId.of("UTC")));
        when(bookings.findIdsByStatusAndSlotEndedBy(BookingStatus.PENDING,
                LocalDate.of(2026, 6, 20), LocalTime.of(12, 30))).thenReturn(List.of(7L, 9L));

        assertEquals(List.of(7L, 9L), service.findLapsedPendingBookingIds());
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

    /**
     * A service wired with just enough of the repositories for {@code updateStatus} to run end to
     * end: the booking, its slot, and a fixed clock. The notification and refund collaborators stay
     * absent, which both of them tolerate.
     */
    private BookingService serviceWithSlot(BookingStatus status, LocalDate date,
                                           LocalTime start, LocalTime end, String instant) {
        TimeSlot slot = new TimeSlot();
        slot.setSlotId(5L);
        slot.setSlotDate(date);
        slot.setStartTime(start);
        slot.setEndTime(end);
        slot.setAvailable(false);

        Booking booking = new Booking();
        booking.setBookingId(1L);
        booking.setStatus(status);
        booking.setTimeSlot(slot);

        BookingService service = new BookingService();
        BookingRepository bookings = mock(BookingRepository.class);
        TimeSlotRepository slots = mock(TimeSlotRepository.class);
        when(bookings.findById(1L)).thenReturn(Optional.of(booking));
        when(bookings.findByIdForUpdate(1L)).thenReturn(Optional.of(booking));
        when(bookings.save(any(Booking.class))).thenAnswer(call -> call.getArgument(0));
        when(slots.findByIdForUpdate(5L)).thenReturn(Optional.of(slot));
        ReflectionTestUtils.setField(service, "bookingRepository", bookings);
        ReflectionTestUtils.setField(service, "timeSlotRepository", slots);
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

    /**
     * The window exists to protect the venue from last-minute cancellations of bookings still to
     * come. Applied to a slot that has already started it protected nothing and simply left the
     * customer unable to close their own booking, forever.
     */
    @Test
    void customerCanCancelABookingWhoseSlotHasAlreadyStarted() {
        BookingService service = serviceWithSlot(
                BookingStatus.APPROVED, LocalDate.of(2026, 6, 19), LocalTime.of(18, 0), LocalTime.of(19, 0),
                "2026-06-20T12:00:00Z");

        Booking cancelled = service.cancelAsCustomer(1L, "user:7");

        assertEquals(BookingStatus.CANCELLED, cancelled.getStatus());
        assertTrue(cancelled.getTimeSlot().isAvailable(), "the slot must be handed back");
    }
}
