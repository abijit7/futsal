package com.futsal.controller;

import com.futsal.dto.DtoMapper;
import com.futsal.dto.PaymentConfirmRequest;
import com.futsal.dto.PaymentInitiationRequest;
import com.futsal.dto.PaymentInitiationResponse;
import com.futsal.dto.PaymentVerifyRequest;
import com.futsal.dto.PaymentVerifyResponse;
import com.futsal.model.Booking;
import com.futsal.model.enums.PaymentMethod;
import com.futsal.security.SecurityAuth;
import com.futsal.service.BookingService;
import com.futsal.service.PaymentGatewayService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    private final BookingService bookingService;
    private final PaymentGatewayService paymentGatewayService;
    private final SecurityAuth securityAuth;

    public PaymentController(BookingService bookingService,
                             PaymentGatewayService paymentGatewayService,
                             SecurityAuth securityAuth) {
        this.bookingService = bookingService;
        this.paymentGatewayService = paymentGatewayService;
        this.securityAuth = securityAuth;
    }

    /**
     * Starts a payment. Returns an eSewa form to submit, or - for
     * cash - the finished booking.
     */
    @PostMapping("/initiate")
    public ResponseEntity<PaymentInitiationResponse> initiate(@Valid @RequestBody PaymentInitiationRequest body) {
        securityAuth.requireUserOrAdmin(body.getUserId());
        return ResponseEntity.ok(paymentGatewayService.initiate(body));
    }

    /** Confirms a gateway payment once the browser returns from eSewa. */
    @PostMapping("/verify")
    public ResponseEntity<PaymentVerifyResponse> verify(@RequestBody PaymentVerifyRequest body) {
        return ResponseEntity.ok(paymentGatewayService.verify(body));
    }

    /** Releases the slot hold when the user abandons checkout. */
    @PostMapping("/cancel/{transactionId}")
    public ResponseEntity<PaymentVerifyResponse> cancel(@PathVariable Long transactionId) {
        return ResponseEntity.ok(paymentGatewayService.cancel(transactionId));
    }

    /**
     * Cash bookings only.
     *
     * <p>This endpoint used to accept any method and fabricate a payment reference from
     * {@code System.currentTimeMillis()}, so choosing eSewa in the UI booked the slot
     * without any money changing hands. Online methods must go through {@code /initiate}.
     */
    @PostMapping("/confirm")
    public ResponseEntity<?> confirmPayment(@Valid @RequestBody PaymentConfirmRequest body) {
        securityAuth.requireUserOrAdmin(body.getUserId());

        PaymentMethod method = parsePaymentMethod(body.getMethod());
        if (method != PaymentMethod.CASH_IN_HAND) {
            throw new IllegalArgumentException(
                    "Online payments must be started with /api/payments/initiate and confirmed by the gateway.");
        }

        String notes = body.getNotes() != null ? body.getNotes() : "";
        Booking booking = bookingService.createPaidBooking(
                body.getUserId(), body.getSlotId(), notes, method, cashReference());
        return ResponseEntity.ok(DtoMapper.toBookingResponse(booking));
    }

    private String cashReference() {
        return PaymentMethod.CASH_IN_HAND.name() + "-" + java.util.UUID.randomUUID()
                .toString().replace("-", "").substring(0, 16).toUpperCase();
    }

    private PaymentMethod parsePaymentMethod(String method) {
        try {
            return PaymentMethod.valueOf(method.trim().toUpperCase());
        } catch (RuntimeException e) {
            throw new IllegalArgumentException("Invalid payment method");
        }
    }
}
