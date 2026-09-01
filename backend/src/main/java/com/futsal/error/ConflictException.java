package com.futsal.error;

/**
 * The request is well-formed but conflicts with the current state - a slot already booked, a
 * venue that still has bookings, an email already registered. Rendered as HTTP 409.
 */
public class ConflictException extends RuntimeException {
    public ConflictException(String message) {
        super(message);
    }
}
