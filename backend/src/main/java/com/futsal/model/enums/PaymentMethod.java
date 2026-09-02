package com.futsal.model.enums;

public enum PaymentMethod {
    ESEWA,

    /**
     * No longer offered. Retained only so that bookings taken while Khalti was available still
     * deserialize - the column is a MySQL ENUM that already contains this value, and dropping the
     * constant would make those rows unreadable. {@code PaymentGatewayService} rejects it.
     */
    @Deprecated
    KHALTI,

    CASH_IN_HAND
}
