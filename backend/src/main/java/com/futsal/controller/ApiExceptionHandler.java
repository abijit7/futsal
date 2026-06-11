package com.futsal.controller;

import com.futsal.security.AuthForbiddenException;
import com.futsal.security.AuthRequiredException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.multipart.support.MissingServletRequestPartException;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class ApiExceptionHandler {

    @ExceptionHandler(AuthForbiddenException.class)
    public ResponseEntity<Map<String, String>> handleForbidden(AuthForbiddenException ex) {
        return error(HttpStatus.FORBIDDEN, ex.getMessage());
    }

    @ExceptionHandler(AuthRequiredException.class)
    public ResponseEntity<Map<String, String>> handleRequired(AuthRequiredException ex) {
        return error(HttpStatus.UNAUTHORIZED, ex.getMessage());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleValidation(MethodArgumentNotValidException ex) {
        String message = ex.getBindingResult().getFieldErrors().isEmpty()
                ? "Invalid request."
                : ex.getBindingResult().getFieldErrors().get(0).getDefaultMessage();
        return error(HttpStatus.BAD_REQUEST, message);
    }

    @ExceptionHandler({
            ConstraintViolationException.class,
            MissingServletRequestParameterException.class,
            MissingServletRequestPartException.class,
            MethodArgumentTypeMismatchException.class,
            HttpMessageNotReadableException.class,
            IllegalArgumentException.class
    })
    public ResponseEntity<Map<String, String>> handleBadRequest(Exception ex) {
        return error(HttpStatus.BAD_REQUEST, safeMessage(ex, "Invalid request."));
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<Map<String, String>> handleMaxUploadSize() {
        return error(HttpStatus.BAD_REQUEST, "Uploaded file is too large.");
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<Map<String, String>> handleMethodNotSupported(HttpRequestMethodNotSupportedException ex) {
        return error(HttpStatus.METHOD_NOT_ALLOWED, safeMessage(ex, "Method not allowed."));
    }

    @ExceptionHandler(IOException.class)
    public ResponseEntity<Map<String, String>> handleIo(IOException ex) {
        return error(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to process request.");
    }

    @ExceptionHandler(ApiServerException.class)
    public ResponseEntity<Map<String, String>> handleServer(ApiServerException ex) {
        return error(HttpStatus.INTERNAL_SERVER_ERROR, safeMessage(ex, "Server error."));
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, String>> handleRuntime(RuntimeException ex) {
        return error(HttpStatus.BAD_REQUEST, safeMessage(ex, "Request failed."));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, String>> handleUnexpected(Exception ex, HttpServletRequest request) {
        return error(HttpStatus.INTERNAL_SERVER_ERROR, "Unexpected server error.");
    }

    private ResponseEntity<Map<String, String>> error(HttpStatus status, String message) {
        Map<String, String> body = new HashMap<>();
        body.put("error", message);
        return ResponseEntity.status(status).body(body);
    }

    private String safeMessage(Exception ex, String fallback) {
        return ex.getMessage() == null || ex.getMessage().isBlank() ? fallback : ex.getMessage();
    }
}
