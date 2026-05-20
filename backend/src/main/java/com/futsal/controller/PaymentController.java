package com.futsal.controller;

import com.futsal.model.Booking;
import com.futsal.model.enums.PaymentMethod;
import com.futsal.service.BookingService;
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
    public ResponseEntity<?> confirmPayment(@RequestBody Map<String, Object> body) {
        try {
            if (body.get("userId") == null || body.get("slotId") == null || body.get("method") == null) {
                return ResponseEntity.badRequest().body(errorMap("User, slot, and payment method are required"));
            }

            Long userId = Long.parseLong(body.get("userId").toString());
            Long slotId = Long.parseLong(body.get("slotId").toString());
            String notes = body.containsKey("notes") ? body.get("notes").toString() : "";
            String methodStr = body.get("method").toString();

            PaymentMethod method = PaymentMethod.valueOf(methodStr.toUpperCase());
            String paymentRef = generateRef(method);

            Booking booking = bookingService.createPaidBooking(userId, slotId, notes, method, paymentRef);
            return ResponseEntity.ok(booking);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(errorMap("Invalid payment method"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(errorMap(e.getMessage()));
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
}
