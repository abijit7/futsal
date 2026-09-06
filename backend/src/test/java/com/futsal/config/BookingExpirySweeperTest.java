package com.futsal.config;

import com.futsal.error.ConflictException;
import com.futsal.model.enums.BookingStatus;
import com.futsal.service.BookingService;
import org.junit.jupiter.api.Test;
import org.mockito.InOrder;

import java.util.List;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class BookingExpirySweeperTest {

    @Test
    void expiresEveryLapsedBooking() {
        BookingService bookings = mock(BookingService.class);
        when(bookings.findLapsedPendingBookingIds()).thenReturn(List.of(4L, 8L));

        new BookingExpirySweeper(bookings).resolveUndecidedBookings();

        verify(bookings).updateStatus(eq(4L), eq(BookingStatus.EXPIRED), eq("system:expiry"));
        verify(bookings).updateStatus(eq(8L), eq(BookingStatus.EXPIRED), eq("system:expiry"));
    }

    @Test
    void approvesBookingsTheVenueDidNotAnswerInTime() {
        BookingService bookings = mock(BookingService.class);
        when(bookings.findLapsedPendingBookingIds()).thenReturn(List.of());
        when(bookings.findUnansweredBookingIds()).thenReturn(List.of(11L));

        new BookingExpirySweeper(bookings).resolveUndecidedBookings();

        verify(bookings).updateStatus(eq(11L), eq(BookingStatus.APPROVED), eq("system:auto-approve"));
    }

    /**
     * Expiry must run first. A booking whose slot has passed leaves PENDING on that pass, so the
     * approval pass behind it cannot pick the same row up and confirm a match that never happened.
     */
    @Test
    void expiryRunsBeforeApproval() {
        BookingService bookings = mock(BookingService.class);
        when(bookings.findLapsedPendingBookingIds()).thenReturn(List.of(4L));
        when(bookings.findUnansweredBookingIds()).thenReturn(List.of(11L));

        new BookingExpirySweeper(bookings).resolveUndecidedBookings();

        InOrder order = inOrder(bookings);
        order.verify(bookings).findLapsedPendingBookingIds();
        order.verify(bookings).updateStatus(eq(4L), eq(BookingStatus.EXPIRED), eq("system:expiry"));
        order.verify(bookings).findUnansweredBookingIds();
        order.verify(bookings).updateStatus(eq(11L), eq(BookingStatus.APPROVED), eq("system:auto-approve"));
    }

    /** A failed auto-approval must not stop the expiry pass that already succeeded, or vice versa. */
    @Test
    void aFailedApprovalDoesNotStopTheSweep() {
        BookingService bookings = mock(BookingService.class);
        when(bookings.findLapsedPendingBookingIds()).thenReturn(List.of());
        when(bookings.findUnansweredBookingIds()).thenReturn(List.of(11L, 12L));
        when(bookings.updateStatus(eq(11L), eq(BookingStatus.APPROVED), eq("system:auto-approve")))
                .thenThrow(new ConflictException("slot has already passed"));

        new BookingExpirySweeper(bookings).resolveUndecidedBookings();

        verify(bookings).updateStatus(eq(12L), eq(BookingStatus.APPROVED), eq("system:auto-approve"));
    }

    /**
     * An admin may decide on a booking between the listing and the update, which makes the
     * transition illegal. That must not cost the rest of the batch.
     */
    @Test
    void oneFailureDoesNotStopTheBatch() {
        BookingService bookings = mock(BookingService.class);
        when(bookings.findLapsedPendingBookingIds()).thenReturn(List.of(4L, 8L));
        when(bookings.updateStatus(eq(4L), eq(BookingStatus.EXPIRED), eq("system:expiry")))
                .thenThrow(new ConflictException("Invalid booking status transition"));

        new BookingExpirySweeper(bookings).resolveUndecidedBookings();

        verify(bookings).updateStatus(eq(8L), eq(BookingStatus.EXPIRED), eq("system:expiry"));
    }

    @Test
    void doesNothingWhenNothingIsUndecided() {
        BookingService bookings = mock(BookingService.class);
        when(bookings.findLapsedPendingBookingIds()).thenReturn(List.of());
        when(bookings.findUnansweredBookingIds()).thenReturn(List.of());

        new BookingExpirySweeper(bookings).resolveUndecidedBookings();

        verify(bookings, never()).updateStatus(org.mockito.ArgumentMatchers.anyLong(),
                org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.anyString());
    }
}
