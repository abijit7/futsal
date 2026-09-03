package com.futsal.model.enums;

public enum PaymentStatus {
    PENDING,
    COMPLETED,
    FAILED,

    /**
     * Money was taken and is owed back, but nobody has issued the refund yet.
     *
     * <p>eSewa has no merchant refund API, so the money itself is moved by hand in the merchant
     * dashboard. This state is what makes that obligation visible instead of silent.
     */
    REFUND_PENDING,

    REFUNDED,
    CANCELLED
}
