package com.futsal.controller;

public class ApiServerException extends RuntimeException {
    public ApiServerException(String message, Throwable cause) {
        super(message, cause);
    }
}
