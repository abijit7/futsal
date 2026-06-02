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
import com.futsal.security.SimpleAuth;

import jakarta.validation.Valid;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/bookings")
@CrossOrigin(origins = "*")
public class BookingController {

    @Autowired
    private BookingService bookingService;

    // POST /api/bookings — create booking
    @PostMapping
    public ResponseEntity<?> createBooking(@Valid @RequestBody BookingCreateRequest body,
                                          @RequestHeader(value = "Authorization", required = false) String authorizationHeader) {
        try {
            SimpleAuth.requireUserOrAdmin(body.getUserId(), authorizationHeader);
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
            @RequestParam(required = false) String status,
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader
    ) {
        try {
            SimpleAuth.requireAdmin(authorizationHeader);
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
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader
    ) {
        try {
            SimpleAuth.requireUserOrAdmin(userId, authorizationHeader);
            Pageable pageable = PageRequest.of(page, size);
            Page<BookingResponse> result = bookingService.getBookingsByUser(userId, pageable)
                    .map(DtoMapper::toBookingResponse);
            return ResponseEntity.ok(PagedResponse.fromPage(result));
        } catch (RuntimeException e) {
            return toErrorResponse(e);
        }
    }

    // GET /api/bookings/{id} — get single booking
    @GetMapping("/{id}")
    public ResponseEntity<?> getBookingById(@PathVariable Long id,
                                            @RequestHeader(value = "Authorization", required = false) String authorizationHeader) {
        try {
            Booking booking = bookingService.getBookingById(id);
            if (!SimpleAuth.isAdmin(authorizationHeader)) {
                SimpleAuth.requireUserOrAdmin(booking.getUser().getUserId(), authorizationHeader);
            }
            return ResponseEntity.ok(DtoMapper.toBookingResponse(booking));
        } catch (RuntimeException e) {
            return toErrorResponse(e);
        }
    }

    // PUT /api/bookings/{id}/status — update status (admin: approve/reject, user: cancel)
    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Long id,
                                           @Valid @RequestBody BookingStatusRequest body,
                                           @RequestHeader(value = "Authorization", required = false) String authorizationHeader) {
        try {
            String statusStr = body.getStatus();
            BookingStatus status = BookingStatus.valueOf(statusStr.toUpperCase());

            Booking booking = bookingService.getBookingById(id);
            if (status == BookingStatus.CANCELLED) {
                SimpleAuth.requireUserOrAdmin(booking.getUser().getUserId(), authorizationHeader);
            } else {
                SimpleAuth.requireAdmin(authorizationHeader);
            }

            String actor = SimpleAuth.isAdmin(authorizationHeader)
                    ? "admin"
                    : "user:" + booking.getUser().getUserId();
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
    public ResponseEntity<?> deleteBooking(@PathVariable Long id,
                                           @RequestHeader(value = "Authorization", required = false) String authorizationHeader) {
        try {
            SimpleAuth.requireAdmin(authorizationHeader);
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
        if ("Admin authorization required".equals(e.getMessage()) || "User authorization required".equals(e.getMessage())) {
            return ResponseEntity.status(401).body(errorMap(e.getMessage()));
        }
        return ResponseEntity.badRequest().body(errorMap(e.getMessage()));
    }
}
