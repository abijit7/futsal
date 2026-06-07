package com.futsal.security;

public class AuthForbiddenException extends RuntimeException {
    public AuthForbiddenException(String message) {
        super(message);
    }
}
