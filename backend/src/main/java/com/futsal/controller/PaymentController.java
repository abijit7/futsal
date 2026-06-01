package com.futsal.controller;

import com.futsal.dto.DtoMapper;
import com.futsal.dto.PaymentConfirmRequest;
import com.futsal.model.Booking;
import com.futsal.model.enums.PaymentMethod;
import com.futsal.service.BookingService;
import com.futsal.security.SimpleAuth;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/payments")
@CrossOrigin(origins = "*")
public class PaymentController {

    @Autowired
    private BookingService bookingService;

    // POST /api/payments/confirm — dummy payment confirmation
    @PostMapping("/confirm")
    public ResponseEntity<?> confirmPayment(@Valid @RequestBody PaymentConfirmRequest body,
                                            @RequestHeader(value = "X-User-Id", required = false) String userHeader,
                                            @RequestHeader(value = "X-Admin-Token", required = false) String adminHeader) {
        try {
            SimpleAuth.requireUserOrAdmin(body.getUserId(), userHeader, adminHeader);
            Long userId = body.getUserId();
            Long slotId = body.getSlotId();
            String notes = body.getNotes() != null ? body.getNotes() : "";
            String methodStr = body.getMethod();

            PaymentMethod method = PaymentMethod.valueOf(methodStr.toUpperCase());
            String paymentRef = generateRef(method);

            Booking booking = bookingService.createPaidBooking(userId, slotId, notes, method, paymentRef);
            return ResponseEntity.ok(DtoMapper.toBookingResponse(booking));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(errorMap("Invalid payment method"));
        } catch (RuntimeException e) {
            return toErrorResponse(e);
        }
    }

    private String generateRef(PaymentMethod method) {
        return method.name() + "-" + System.currentTimeMillis();
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
