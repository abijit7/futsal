package com.futsal.controller;

import com.futsal.model.Booking;
import com.futsal.model.enums.BookingStatus;
import com.futsal.service.BookingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.futsal.dto.PagedResponse;
import com.futsal.dto.BookingCreateRequest;
import com.futsal.dto.BookingResponse;
import com.futsal.dto.BookingStatusRequest;
import com.futsal.dto.DtoMapper;
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
    public ResponseEntity<BookingResponse> createBooking(@Valid @RequestBody BookingCreateRequest body) {
        securityAuth.requireUserOrAdmin(body.getUserId());
        Booking booking = bookingService.createBooking(body.getUserId(), body.getSlotId(), body.getNotes());
        return ResponseEntity.ok(DtoMapper.toBookingResponse(booking));
    }

    // GET /api/bookings — all bookings (admin)
    @GetMapping
    public ResponseEntity<PagedResponse<BookingResponse>> getAllBookings(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String status
    ) {
        Pageable pageable = PageRequestFactory.create(page, size);
        Page<Booking> result;
        if (status != null && !status.isBlank() && !"ALL".equalsIgnoreCase(status)) {
            result = bookingService.getBookingsByStatus(parseStatus(status), pageable);
        } else {
            result = bookingService.getAllBookings(pageable);
        }
        Page<BookingResponse> mapped = result.map(DtoMapper::toBookingResponse);
        return ResponseEntity.ok(PagedResponse.fromPage(mapped));
    }

    // GET /api/bookings/user/{userId} — bookings for a specific user
    @GetMapping("/user/{userId}")
    public ResponseEntity<PagedResponse<BookingResponse>> getBookingsByUser(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String status
    ) {
        securityAuth.requireUserOrAdmin(userId);
        Pageable pageable = PageRequestFactory.create(page, size);
        BookingStatus parsedStatus = null;
        if (status != null && !status.isBlank() && !"ALL".equalsIgnoreCase(status)) {
            parsedStatus = parseStatus(status);
        }
        Page<BookingResponse> result = bookingService.getBookingsByUser(userId, parsedStatus, pageable)
                .map(DtoMapper::toBookingResponse);
        return ResponseEntity.ok(PagedResponse.fromPage(result));
    }

    // GET /api/bookings/{id} — get single booking
    @GetMapping("/{id}")
    public ResponseEntity<BookingResponse> getBookingById(@PathVariable Long id) {
        Booking booking = bookingService.getBookingById(id);
        securityAuth.requireUserOrAdmin(booking.getUser().getUserId());
        return ResponseEntity.ok(DtoMapper.toBookingResponse(booking));
    }

    // PUT /api/bookings/{id}/status — update status (admin: approve/reject, user: cancel)
    @PutMapping("/{id}/status")
    public ResponseEntity<BookingResponse> updateStatus(@PathVariable Long id,
                                                        @Valid @RequestBody BookingStatusRequest body) {
        BookingStatus status = parseStatus(body.getStatus());

        Booking booking = bookingService.getBookingById(id);
        if (status == BookingStatus.CANCELLED) {
            securityAuth.requireUserOrAdmin(booking.getUser().getUserId());
        } else {
            securityAuth.requireAdmin();
        }

        String actor = securityAuth.actorFor(booking.getUser().getUserId());
        Booking updated = bookingService.updateStatus(id, status, actor);
        return ResponseEntity.ok(DtoMapper.toBookingResponse(updated));
    }

    // DELETE /api/bookings/{id} — delete booking (admin)
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteBooking(@PathVariable Long id) {
        bookingService.deleteBooking(id);
        Map<String, String> res = new HashMap<>();
        res.put("message", "Booking deleted successfully");
        return ResponseEntity.ok(res);
    }

    private BookingStatus parseStatus(String status) {
        try {
            return BookingStatus.valueOf(status.toUpperCase());
        } catch (RuntimeException e) {
            throw new IllegalArgumentException("Invalid status value");
        }
    }
}
