package com.futsal.security;

public class AuthRequiredException extends RuntimeException {
    public AuthRequiredException(String message) {
        super(message);
    }
}
