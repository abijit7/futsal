package com.futsal.error;

/** A requested resource does not exist. Rendered as HTTP 404. */
public class NotFoundException extends RuntimeException {
    public NotFoundException(String message) {
        super(message);
    }
}
