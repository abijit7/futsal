package com.futsal.model.enums;

public enum BookingStatus {
    PENDING,
    APPROVED,
    REJECTED,
    CANCELLED,

    /**
     * Nobody confirmed the booking and its slot has now passed.
     *
     * <p>Written only by {@code BookingService.expirePastPendingBookings}, never by a user action,
     * which is why no transition leads out of it. Kept distinct from REJECTED so the customer is
     * not told the venue turned them down, and so a refund owed on one reads as an expiry rather
     * than a rejection.
     */
    EXPIRED
}
