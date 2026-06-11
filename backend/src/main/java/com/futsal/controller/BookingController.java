package com.futsal.controller;

import com.futsal.model.Booking;
import com.futsal.model.enums.BookingStatus;
import com.futsal.service.BookingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.futsal.dto.PagedResponse;
import com.futsal.dto.BookingCreateRequest;
import com.futsal.dto.BookingResponse;
import com.futsal.dto.BookingStatusRequest;
import com.futsal.dto.DtoMapper;
import com.futsal.security.AuthForbiddenException;
import com.futsal.security.AuthRequiredException;
import com.futsal.security.SecurityAuth;

import jakarta.validation.Valid;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/bookings")
public class BookingController {

    @Autowired
    private BookingService bookingService;

    @Autowired
    private SecurityAuth securityAuth;

    // POST /api/bookings — create booking
    @PostMapping
    public ResponseEntity<?> createBooking(@Valid @RequestBody BookingCreateRequest body) {
        try {
            securityAuth.requireUserOrAdmin(body.getUserId());
            Booking booking = bookingService.createBooking(body.getUserId(), body.getSlotId(), body.getNotes());
            return ResponseEntity.ok(DtoMapper.toBookingResponse(booking));
        } catch (RuntimeException e) {
            return toErrorResponse(e);
        }
    }

    // GET /api/bookings — all bookings (admin)
    @GetMapping
    public ResponseEntity<?> getAllBookings(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String status
    ) {
        try {
            Pageable pageable = PageRequest.of(page, size);
            Page<Booking> result;
            if (status != null && !status.isBlank() && !"ALL".equalsIgnoreCase(status)) {
                BookingStatus parsed = BookingStatus.valueOf(status.toUpperCase());
                result = bookingService.getBookingsByStatus(parsed, pageable);
            } else {
                result = bookingService.getAllBookings(pageable);
            }
            Page<BookingResponse> mapped = result.map(DtoMapper::toBookingResponse);
            return ResponseEntity.ok(PagedResponse.fromPage(mapped));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(errorMap("Invalid status value"));
        } catch (RuntimeException e) {
            return toErrorResponse(e);
        }
    }

    // GET /api/bookings/user/{userId} — bookings for a specific user
    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getBookingsByUser(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String status
    ) {
        try {
            securityAuth.requireUserOrAdmin(userId);
            Pageable pageable = PageRequest.of(page, size);
            BookingStatus parsedStatus = null;
            if (status != null && !status.isBlank() && !"ALL".equalsIgnoreCase(status)) {
                parsedStatus = BookingStatus.valueOf(status.toUpperCase());
            }
            Page<BookingResponse> result = bookingService.getBookingsByUser(userId, parsedStatus, pageable)
                    .map(DtoMapper::toBookingResponse);
            return ResponseEntity.ok(PagedResponse.fromPage(result));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(errorMap("Invalid status value"));
        } catch (RuntimeException e) {
            return toErrorResponse(e);
        }
    }

    // GET /api/bookings/{id} — get single booking
    @GetMapping("/{id}")
    public ResponseEntity<?> getBookingById(@PathVariable Long id) {
        try {
            Booking booking = bookingService.getBookingById(id);
            securityAuth.requireUserOrAdmin(booking.getUser().getUserId());
            return ResponseEntity.ok(DtoMapper.toBookingResponse(booking));
        } catch (RuntimeException e) {
            return toErrorResponse(e);
        }
    }

    // PUT /api/bookings/{id}/status — update status (admin: approve/reject, user: cancel)
    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Long id,
                                           @Valid @RequestBody BookingStatusRequest body) {
        try {
            String statusStr = body.getStatus();
            BookingStatus status = BookingStatus.valueOf(statusStr.toUpperCase());

            Booking booking = bookingService.getBookingById(id);
            if (status == BookingStatus.CANCELLED) {
                securityAuth.requireUserOrAdmin(booking.getUser().getUserId());
            } else {
                securityAuth.requireAdmin();
            }

            String actor = securityAuth.actorFor(booking.getUser().getUserId());
            Booking updated = bookingService.updateStatus(id, status, actor);
            return ResponseEntity.ok(DtoMapper.toBookingResponse(updated));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(errorMap("Invalid status value"));
        } catch (RuntimeException e) {
            return toErrorResponse(e);
        }
    }

    // DELETE /api/bookings/{id} — delete booking (admin)
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteBooking(@PathVariable Long id) {
        try {
            bookingService.deleteBooking(id);
            Map<String, String> res = new HashMap<>();
            res.put("message", "Booking deleted successfully");
            return ResponseEntity.ok(res);
        } catch (RuntimeException e) {
            return toErrorResponse(e);
        }
    }

    private Map<String, String> errorMap(String message) {
        Map<String, String> map = new HashMap<>();
        map.put("error", message);
        return map;
    }

    private ResponseEntity<?> toErrorResponse(RuntimeException e) {
        if (e instanceof AuthForbiddenException) {
            return ResponseEntity.status(403).body(errorMap(e.getMessage()));
        }
        if (e instanceof AuthRequiredException) {
            return ResponseEntity.status(401).body(errorMap(e.getMessage()));
        }
        return ResponseEntity.badRequest().body(errorMap(e.getMessage()));
    }
}
