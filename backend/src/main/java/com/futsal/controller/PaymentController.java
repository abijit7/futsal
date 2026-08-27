package com.futsal.controller;

import com.futsal.dto.DtoMapper;
import com.futsal.dto.PaymentConfirmRequest;
import com.futsal.model.Booking;
import com.futsal.model.enums.PaymentMethod;
import com.futsal.security.SecurityAuth;
import com.futsal.service.BookingService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    @Autowired
    private BookingService bookingService;

    @Autowired
    private SecurityAuth securityAuth;

    // POST /api/payments/confirm — dummy payment confirmation
    @PostMapping("/confirm")
    public ResponseEntity<?> confirmPayment(@Valid @RequestBody PaymentConfirmRequest body) {
        securityAuth.requireUserOrAdmin(body.getUserId());
        Long userId = body.getUserId();
        Long slotId = body.getSlotId();
        String notes = body.getNotes() != null ? body.getNotes() : "";
        PaymentMethod method = parsePaymentMethod(body.getMethod());
        String paymentRef = generateRef(method);

        Booking booking = bookingService.createPaidBooking(userId, slotId, notes, method, paymentRef);
        return ResponseEntity.ok(DtoMapper.toBookingResponse(booking));
    }

    private String generateRef(PaymentMethod method) {
        return method.name() + "-" + System.currentTimeMillis();
    }

    private PaymentMethod parsePaymentMethod(String method) {
        try {
            return PaymentMethod.valueOf(method.toUpperCase());
        } catch (RuntimeException e) {
            throw new IllegalArgumentException("Invalid payment method");
        }
    }
}
