package com.futsal.controller;

import com.futsal.dto.*;
import com.futsal.model.Booking;
import com.futsal.model.enums.PaymentMethod;
import com.futsal.security.SecurityAuth;
import com.futsal.service.BookingService;
import com.futsal.service.PaymentGatewayService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    @Autowired
    private BookingService bookingService;

    @Autowired
    private PaymentGatewayService paymentGatewayService;

    @Autowired
    private SecurityAuth securityAuth;

    // POST /api/payments/initiate — initiate payment with gateway
    @PostMapping("/initiate")
    public ResponseEntity<?> initiatePayment(@Valid @RequestBody PaymentInitiationRequest body) {
        securityAuth.requireUserOrAdmin(body.getUserId());
        try {
            PaymentInitiationResponse response = paymentGatewayService.initiatePayment(body);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    // POST /api/payments/confirm — dummy payment confirmation (legacy support)
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

    // POST /api/payments/webhook/esewa — ESEWA webhook endpoint
    @PostMapping("/webhook/esewa")
    public ResponseEntity<?> handleEsewaWebhook(@RequestBody EsewaWebhookPayload payload) {
        try {
            paymentGatewayService.handleEsewaWebhook(payload);
            Map<String, String> response = new HashMap<>();
            response.put("status", "success");
            response.put("message", "ESEWA webhook processed successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    // POST /api/payments/webhook/khalti — KHALTI webhook endpoint
    @PostMapping("/webhook/khalti")
    public ResponseEntity<?> handleKhaltiWebhook(@RequestBody KhaltiWebhookPayload payload) {
        try {
            paymentGatewayService.handleKhaltiWebhook(payload);
            Map<String, String> response = new HashMap<>();
            response.put("status", "success");
            response.put("message", "KHALTI webhook processed successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
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
