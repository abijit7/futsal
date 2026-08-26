package com.futsal.service;

import com.futsal.model.enums.BookingStatus;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

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
}
