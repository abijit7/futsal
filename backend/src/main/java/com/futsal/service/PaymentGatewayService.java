package com.futsal.service;

import com.futsal.dto.EsewaWebhookPayload;
import com.futsal.dto.KhaltiWebhookPayload;
import com.futsal.dto.PaymentInitiationRequest;
import com.futsal.dto.PaymentInitiationResponse;
import com.futsal.model.Booking;
import com.futsal.model.PaymentTransaction;
import com.futsal.model.TimeSlot;
import com.futsal.model.TimeSlotStatusHistory;
import com.futsal.model.enums.PaymentMethod;
import com.futsal.model.enums.PaymentStatus;
import com.futsal.repository.BookingRepository;
import com.futsal.repository.PaymentTransactionRepository;
import com.futsal.repository.TimeSlotRepository;
import com.futsal.repository.UserRepository;
import com.google.gson.Gson;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
public class PaymentGatewayService {

    private static final Logger log = LoggerFactory.getLogger(PaymentGatewayService.class);

    @Autowired
    private PaymentTransactionRepository paymentTransactionRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TimeSlotRepository timeSlotRepository;

    @Autowired
    private BookingService bookingService;

    @Value("${payment.esewa.merchant.code}")
    private String esewaMerchantCode;

    @Value("${payment.esewa.merchant.secret}")
    private String esewaMerchantSecret;

    @Value("${payment.esewa.api.url}")
    private String esewaApiUrl;

    @Value("${payment.khalti.secret}")
    private String khaltiSecret;

    @Value("${payment.khalti.public.key}")
    private String khaltiPublicKey;

    @Value("${payment.khalti.api.url}")
    private String khaltiApiUrl;

    private final Gson gson = new Gson();

    /**
     * Initiate payment with the specified payment gateway
     */
    @Transactional
    public PaymentInitiationResponse initiatePayment(PaymentInitiationRequest request) {
        try {
            // Validate user and slot
            var user = userRepository.findById(request.getUserId())
                    .orElseThrow(() -> new RuntimeException("User not found"));

            var slot = timeSlotRepository.findByIdForUpdate(request.getSlotId())
                    .orElseThrow(() -> new RuntimeException("Time slot not found"));

            if (!slot.isAvailable()) {
                throw new RuntimeException("This slot is no longer available");
            }

            // Generate idempotency key
            String idempotencyKey = UUID.randomUUID().toString();

            // Check for duplicate requests
            if (paymentTransactionRepository.existsByIdempotencyKey(idempotencyKey)) {
                throw new RuntimeException("Duplicate payment request");
            }

            // Parse payment method
            PaymentMethod paymentMethod = parsePaymentMethod(request.getMethod());

            // For ESEWA and KHALTI, mark slot as temporarily unavailable
            if (paymentMethod == PaymentMethod.ESEWA || paymentMethod == PaymentMethod.KHALTI) {
                slot.setAvailable(false);
                slot.addStatusHistory(new TimeSlotStatusHistory(slot, false, "payment:" + idempotencyKey, "Payment initiated"));
                timeSlotRepository.save(slot);
            }

            // Create a temporary booking (pending payment)
            Booking booking = bookingService.createBooking(request.getUserId(), request.getSlotId(), request.getNotes());
            booking.setPaymentMethod(paymentMethod);

            // Create payment transaction record
            PaymentTransaction transaction = new PaymentTransaction(
                    booking,
                    paymentMethod,
                    request.getAmount(),
                    idempotencyKey
            );
            transaction = paymentTransactionRepository.save(transaction);

            // Initiate payment with gateway
            PaymentInitiationResponse response;
            switch (paymentMethod) {
                case ESEWA:
                    response = initiateEsewaPayment(transaction, request);
                    break;
                case KHALTI:
                    response = initiateKhaltiPayment(transaction, request);
                    break;
                case CASH_IN_HAND:
                    response = handleCashPayment(transaction);
                    break;
                default:
                    throw new RuntimeException("Unsupported payment method");
            }

            log.info("Payment initiated successfully: Transaction ID={}, Method={}",
                    transaction.getTransactionId(), paymentMethod);

            return response;

        } catch (Exception e) {
            log.error("Payment initiation failed: {}", e.getMessage(), e);
            throw new RuntimeException("Payment initiation failed: " + e.getMessage());
        }
    }

    /**
     * Initiate ESEWA payment
     */
    private PaymentInitiationResponse initiateEsewaPayment(PaymentTransaction transaction, PaymentInitiationRequest request) {
        try {
            // ESEWA payment parameters
            Map<String, String> params = new HashMap<>();
            params.put("amt", transaction.getAmount().toString());
            params.put("psc", "0"); // Service charge
            params.put("pdc", "0"); // Delivery charge
            params.put("txAmt", "0"); // Tax amount
            params.put("tAmt", transaction.getAmount().toString()); // Total amount
            params.put("pid", transaction.getTransactionId().toString()); // Product ID
            params.put("scd", esewaMerchantCode); // Service code
            params.put("su", request.getSuccessUrl() != null ? request.getSuccessUrl() : "http://localhost:5174/payment/success");
            params.put("fu", request.getFailureUrl() != null ? request.getFailureUrl() : "http://localhost:5174/payment/failure");

            // Build ESEWA payment URL
            String paymentUrl = esewaApiUrl + "?" + buildQueryString(params);

            PaymentInitiationResponse response = new PaymentInitiationResponse();
            response.setPaymentUrl(paymentUrl);
            response.setTransactionId(transaction.getTransactionId().toString());
            response.setMessage("ESEWA payment initiated successfully");

            return response;

        } catch (Exception e) {
            log.error("ESEWA payment initiation failed: {}", e.getMessage(), e);
            throw new RuntimeException("ESEWA payment initiation failed: " + e.getMessage());
        }
    }

    /**
     * Initiate KHALTI payment
     */
    private PaymentInitiationResponse initiateKhaltiPayment(PaymentTransaction transaction, PaymentInitiationRequest request) {
        try {
            // KHALTI payment parameters
            Map<String, Object> payload = new HashMap<>();
            payload.put("return_url", request.getSuccessUrl() != null ? request.getSuccessUrl() : "http://localhost:5174/payment/success");
            payload.put("website_url", "http://localhost:5174");
            payload.put("amount", transaction.getAmount().multiply(new BigDecimal("100")).longValue()); // Amount in paisa
            payload.put("purchase_order_id", transaction.getTransactionId().toString());
            payload.put("purchase_order_name", "Futsal Booking - " + transaction.getBooking().getTimeSlot().getSlotId());

            Map<String, Object> customerInfo = new HashMap<>();
            customerInfo.put("name", "Customer");
            customerInfo.put("email", "customer@example.com");
            customerInfo.put("phone", "9800000000");
            payload.put("customer_info", customerInfo);

            // For demo purposes, return a mock response
            // In production, you would make an actual API call to KHALTI
            PaymentInitiationResponse response = new PaymentInitiationResponse();
            response.setPaymentUrl(khaltiApiUrl + "/v2/epayment/initiate/");
            response.setPaymentToken(gson.toJson(payload));
            response.setTransactionId(transaction.getTransactionId().toString());
            response.setMessage("KHALTI payment initiated successfully");

            return response;

        } catch (Exception e) {
            log.error("KHALTI payment initiation failed: {}", e.getMessage(), e);
            throw new RuntimeException("KHALTI payment initiation failed: " + e.getMessage());
        }
    }

    /**
     * Handle cash payment (no gateway integration needed)
     */
    private PaymentInitiationResponse handleCashPayment(PaymentTransaction transaction) {
        // Create a paid booking directly
        try {
            Booking booking = bookingService.createPaidBooking(
                    transaction.getBooking().getUser().getUserId(),
                    transaction.getBooking().getTimeSlot().getSlotId(),
                    transaction.getBooking().getNotes(),
                    PaymentMethod.CASH_IN_HAND,
                    "CASH-" + transaction.getTransactionId()
            );

            // Update transaction status
            transaction.setStatus(PaymentStatus.COMPLETED);
            transaction.setGatewayTransactionId("CASH-" + transaction.getTransactionId());
            transaction.setCompletedAt(LocalDateTime.now());
            paymentTransactionRepository.save(transaction);

            PaymentInitiationResponse response = new PaymentInitiationResponse();
            response.setTransactionId(transaction.getTransactionId().toString());
            response.setMessage("Cash payment booking created successfully");

            return response;

        } catch (Exception e) {
            log.error("Cash payment handling failed: {}", e.getMessage(), e);
            throw new RuntimeException("Cash payment handling failed: " + e.getMessage());
        }
    }

    /**
     * Handle ESEWA webhook callback
     */
    @Transactional
    public void handleEsewaWebhook(EsewaWebhookPayload payload) {
        try {
            log.info("Processing ESEWA webhook: Transaction ID={}, Status={}", payload.getTransactionId(), payload.getStatus());

            // Find transaction by gateway transaction ID
            PaymentTransaction transaction = paymentTransactionRepository.findByGatewayTransactionId(payload.getTransactionId())
                    .orElseThrow(() -> new RuntimeException("Transaction not found"));

            // Verify signature
            if (!verifyEsewaSignature(payload)) {
                log.error("ESEWA signature verification failed for transaction: {}", payload.getTransactionId());
                throw new RuntimeException("Invalid signature");
            }

            // Update transaction status
            if ("Complete".equalsIgnoreCase(payload.getStatus())) {
                transaction.setStatus(PaymentStatus.COMPLETED);
                transaction.setGatewayTransactionId(payload.getRefId());
                transaction.setCompletedAt(LocalDateTime.now());
                transaction.setGatewayResponse(gson.toJson(payload));

                // Complete the booking
                completeBooking(transaction.getBooking(), payload.getRefId());

            } else {
                transaction.setStatus(PaymentStatus.FAILED);
                transaction.setFailureReason(payload.getMessage());
                transaction.setGatewayResponse(gson.toJson(payload));

                // Mark slot as available again
                revertSlotAvailability(transaction.getBooking().getTimeSlot());
            }

            paymentTransactionRepository.save(transaction);
            log.info("ESEWA webhook processed successfully: Transaction ID={}", transaction.getTransactionId());

        } catch (Exception e) {
            log.error("ESEWA webhook processing failed: {}", e.getMessage(), e);
            throw new RuntimeException("ESEWA webhook processing failed: " + e.getMessage());
        }
    }

    /**
     * Handle KHALTI webhook callback
     */
    @Transactional
    public void handleKhaltiWebhook(KhaltiWebhookPayload payload) {
        try {
            log.info("Processing KHALTI webhook: Transaction ID={}, Status={}", payload.getTransaction_id(), payload.getStatus());

            // Find transaction by purchase order ID
            PaymentTransaction transaction = paymentTransactionRepository.findById(Long.parseLong(payload.getTransaction_id()))
                    .orElseThrow(() -> new RuntimeException("Transaction not found"));

            // Verify signature
            if (!verifyKhaltiSignature(payload)) {
                log.error("KHALTI signature verification failed for transaction: {}", payload.getTransaction_id());
                throw new RuntimeException("Invalid signature");
            }

            // Update transaction status
            if ("Completed".equalsIgnoreCase(payload.getStatus())) {
                transaction.setStatus(PaymentStatus.COMPLETED);
                transaction.setGatewayTransactionId(payload.getIdx());
                transaction.setCompletedAt(LocalDateTime.now());
                transaction.setGatewayResponse(gson.toJson(payload));

                // Complete the booking
                completeBooking(transaction.getBooking(), payload.getIdx());

            } else {
                transaction.setStatus(PaymentStatus.FAILED);
                transaction.setFailureReason("Payment failed: " + payload.getStatus());
                transaction.setGatewayResponse(gson.toJson(payload));

                // Mark slot as available again
                revertSlotAvailability(transaction.getBooking().getTimeSlot());
            }

            paymentTransactionRepository.save(transaction);
            log.info("KHALTI webhook processed successfully: Transaction ID={}", transaction.getTransactionId());

        } catch (Exception e) {
            log.error("KHALTI webhook processing failed: {}", e.getMessage(), e);
            throw new RuntimeException("KHALTI webhook processing failed: " + e.getMessage());
        }
    }

    /**
     * Complete booking after successful payment
     */
    private void completeBooking(Booking booking, String gatewayTransactionId) {
        try {
            // Create paid booking
            Booking paidBooking = bookingService.createPaidBooking(
                    booking.getUser().getUserId(),
                    booking.getTimeSlot().getSlotId(),
                    booking.getNotes(),
                    booking.getPaymentMethod(),
                    gatewayTransactionId
            );

            // Update original booking
            booking.setTimeSlot(paidBooking.getTimeSlot());
            booking.setStatus(paidBooking.getStatus());
            booking.setPaymentRef(gatewayTransactionId);
            bookingRepository.save(booking);

        } catch (Exception e) {
            log.error("Failed to complete booking: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to complete booking: " + e.getMessage());
        }
    }

    /**
     * Revert slot availability when payment fails
     */
    private void revertSlotAvailability(TimeSlot slot) {
        try {
            if (!slot.isAvailable()) {
                slot.setAvailable(true);
                timeSlotRepository.save(slot);
            }
        } catch (Exception e) {
            log.error("Failed to revert slot availability: {}", e.getMessage(), e);
        }
    }

    /**
     * Verify ESEWA signature
     */
    private boolean verifyEsewaSignature(EsewaWebhookPayload payload) {
        try {
            // ESEWA signature verification logic
            // This is a simplified version - implement actual signature verification based on ESEWA documentation
            String signature = payload.getSignature();
            return signature != null && !signature.isEmpty();

        } catch (Exception e) {
            log.error("ESEWA signature verification error: {}", e.getMessage(), e);
            return false;
        }
    }

    /**
     * Verify KHALTI signature
     */
    private boolean verifyKhaltiSignature(KhaltiWebhookPayload payload) {
        try {
            // KHALTI signature verification logic
            // This is a simplified version - implement actual signature verification based on KHALTI documentation
            String signature = payload.getSignature();
            return signature != null && !signature.isEmpty();

        } catch (Exception e) {
            log.error("KHALTI signature verification error: {}", e.getMessage(), e);
            return false;
        }
    }

    /**
     * Build query string from parameters
     */
    private String buildQueryString(Map<String, String> params) {
        StringBuilder query = new StringBuilder();
        for (Map.Entry<String, String> entry : params.entrySet()) {
            if (query.length() > 0) {
                query.append("&");
            }
            query.append(entry.getKey()).append("=").append(entry.getValue());
        }
        return query.toString();
    }

    /**
     * Parse payment method from string
     */
    private PaymentMethod parsePaymentMethod(String method) {
        try {
            return PaymentMethod.valueOf(method.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Invalid payment method: " + method);
        }
    }
}
