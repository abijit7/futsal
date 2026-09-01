package com.futsal.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.futsal.dto.DtoMapper;
import com.futsal.dto.PaymentInitiationRequest;
import com.futsal.dto.PaymentInitiationResponse;
import com.futsal.dto.PaymentVerifyRequest;
import com.futsal.dto.PaymentVerifyResponse;
import com.futsal.model.Booking;
import com.futsal.model.Futsal;
import com.futsal.model.PaymentTransaction;
import com.futsal.model.TimeSlot;
import com.futsal.model.enums.BookingStatus;
import com.futsal.model.enums.PaymentMethod;
import com.futsal.model.enums.PaymentStatus;
import com.futsal.repository.PaymentTransactionRepository;
import com.futsal.repository.TimeSlotRepository;
import com.futsal.security.SecurityAuth;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.UriComponentsBuilder;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Clock;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * eSewa ePay v2 and Khalti ePayment v2 integration.
 *
 * <p>Neither gateway uses a server-to-server webhook, so there is no webhook endpoint here:
 *
 * <ul>
 *   <li><b>eSewa</b> takes an auto-submitted HTML form POST carrying an HMAC-SHA256 signature over
 *       {@code total_amount,transaction_uuid,product_code}, and returns a base64-encoded JSON blob
 *       on the success URL. That blob's signature is recomputed here and then confirmed against
 *       eSewa's transaction status API.</li>
 *   <li><b>Khalti</b> is API-first: the server initiates and receives a {@code pidx}, and the
 *       browser is redirected. The return URL's query string is trivially forgeable, so the
 *       lookup API is the only thing treated as proof of payment.</li>
 * </ul>
 *
 * <p>The price is always computed here from the venue's hourly rate and the slot duration; it is
 * never taken from the client.
 */
@Service
public class PaymentGatewayService {

    private static final Logger log = LoggerFactory.getLogger(PaymentGatewayService.class);

    /** eSewa signs these fields, in this order. */
    private static final List<String> ESEWA_SIGNED_FIELDS = List.of("total_amount", "transaction_uuid", "product_code");

    private final PaymentTransactionRepository paymentTransactionRepository;
    private final TimeSlotRepository timeSlotRepository;
    private final BookingService bookingService;
    private final ObjectMapper objectMapper;
    private final Clock clock;
    private final SecurityAuth securityAuth;
    private final RestClient restClient = RestClient.create();

    @Value("${payment.esewa.merchant.code}")
    private String esewaMerchantCode;

    @Value("${payment.esewa.merchant.secret}")
    private String esewaMerchantSecret;

    @Value("${payment.esewa.form-url}")
    private String esewaFormUrl;

    @Value("${payment.esewa.status-url}")
    private String esewaStatusUrl;

    @Value("${payment.khalti.secret}")
    private String khaltiSecret;

    @Value("${payment.khalti.api.url}")
    private String khaltiApiUrl;

    @Value("${app.payment.return-base-url}")
    private String returnBaseUrl;

    @Value("${app.payment.hold-minutes:60}")
    private int holdMinutes;

    public PaymentGatewayService(
            PaymentTransactionRepository paymentTransactionRepository,
            TimeSlotRepository timeSlotRepository,
            BookingService bookingService,
            ObjectMapper objectMapper,
            Clock clock,
            SecurityAuth securityAuth
    ) {
        this.paymentTransactionRepository = paymentTransactionRepository;
        this.timeSlotRepository = timeSlotRepository;
        this.bookingService = bookingService;
        this.objectMapper = objectMapper;
        this.clock = clock;
        this.securityAuth = securityAuth;
    }

    // ── Initiation ────────────────────────────────────────────────────────────

    @Transactional
    public PaymentInitiationResponse initiate(PaymentInitiationRequest request) {
        PaymentMethod method = parsePaymentMethod(request.getMethod());

        // Locks the slot row, so two concurrent checkouts for the same slot serialise here.
        TimeSlot slot = timeSlotRepository.findByIdForUpdate(request.getSlotId())
                .orElseThrow(() -> new IllegalArgumentException("Time slot not found"));

        BigDecimal amount = priceFor(slot);
        String transactionUuid = newTransactionUuid();

        // createPaidBooking performs the availability checks and marks the slot unavailable,
        // holding it for the duration of the checkout. The uuid stands in as the payment
        // reference until the gateway confirms and settleGatewayPayment swaps in the real one.
        Booking booking = bookingService.createPaidBooking(
                request.getUserId(), request.getSlotId(), request.getNotes(), method, transactionUuid);

        PaymentTransaction transaction = new PaymentTransaction(booking, method, amount, transactionUuid);
        transaction.setCreatedAt(LocalDateTime.now(clock));
        transaction = paymentTransactionRepository.save(transaction);

        PaymentInitiationResponse response = new PaymentInitiationResponse();
        response.setTransactionId(String.valueOf(transaction.getTransactionId()));
        response.setMethod(method);
        response.setAmount(amount);

        switch (method) {
            case ESEWA -> {
                response.setFormUrl(esewaFormUrl);
                response.setFormFields(esewaFormFields(transactionUuid, amount));
                response.setMessage("Submit the returned form fields to eSewa to complete payment.");
            }
            case KHALTI -> {
                response.setRedirectUrl(startKhaltiPayment(transaction, booking, amount));
                response.setMessage("Redirect to Khalti to complete payment.");
            }
            case CASH_IN_HAND -> {
                transaction.setStatus(PaymentStatus.COMPLETED);
                transaction.setGatewayTransactionId(transactionUuid);
                transaction.setCompletedAt(LocalDateTime.now(clock));
                paymentTransactionRepository.save(transaction);
                response.setBooking(DtoMapper.toBookingResponse(booking));
                response.setMessage("Booking created. Pay at the venue.");
            }
        }

        log.info("Payment initiated: transactionId={}, method={}, amount={}",
                transaction.getTransactionId(), method, amount);
        return response;
    }

    private Map<String, String> esewaFormFields(String transactionUuid, BigDecimal amount) {
        // The signature must cover the exact strings submitted, so format once and reuse.
        String totalAmount = amount.setScale(2, RoundingMode.HALF_UP).toPlainString();

        Map<String, String> fields = new LinkedHashMap<>();
        fields.put("amount", totalAmount);
        fields.put("tax_amount", "0");
        fields.put("total_amount", totalAmount);
        fields.put("transaction_uuid", transactionUuid);
        fields.put("product_code", esewaMerchantCode);
        fields.put("product_service_charge", "0");
        fields.put("product_delivery_charge", "0");
        fields.put("success_url", returnUrl("/payment/success"));
        fields.put("failure_url", returnUrl("/payment/failure"));
        fields.put("signed_field_names", String.join(",", ESEWA_SIGNED_FIELDS));
        fields.put("signature", esewaSignature(Map.of(
                "total_amount", totalAmount,
                "transaction_uuid", transactionUuid,
                "product_code", esewaMerchantCode
        ), ESEWA_SIGNED_FIELDS));
        return fields;
    }

    private String startKhaltiPayment(PaymentTransaction transaction, Booking booking, BigDecimal amount) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("return_url", returnUrl("/payment/success"));
        payload.put("website_url", returnBaseUrl);
        payload.put("amount", toPaisa(amount));
        payload.put("purchase_order_id", transaction.getIdempotencyKey());
        payload.put("purchase_order_name", "Futsal booking " + booking.getBookingId());
        payload.put("customer_info", Map.of(
                "name", booking.getUser().getName(),
                "email", booking.getUser().getEmail(),
                "phone", booking.getUser().getPhone()
        ));

        JsonNode body = khaltiPost("/epayment/initiate/", payload);
        String pidx = text(body, "pidx");
        String paymentUrl = text(body, "payment_url");
        if (pidx == null || paymentUrl == null) {
            throw new IllegalStateException("Khalti did not return a payment link");
        }

        // pidx is how the payment is looked up later, so it must be persisted before redirecting.
        transaction.setGatewayTransactionId(pidx);
        paymentTransactionRepository.save(transaction);
        return paymentUrl;
    }

    // ── Verification ──────────────────────────────────────────────────────────

    @Transactional
    public PaymentVerifyResponse verify(PaymentVerifyRequest request) {
        if (request.getData() != null && !request.getData().isBlank()) {
            return verifyEsewa(request.getData());
        }
        if (request.getPidx() != null && !request.getPidx().isBlank()) {
            return verifyKhalti(request.getPidx());
        }
        throw new IllegalArgumentException("Nothing to verify: expected eSewa 'data' or Khalti 'pidx'.");
    }

    private PaymentVerifyResponse verifyEsewa(String encodedData) {
        JsonNode payload;
        try {
            payload = objectMapper.readTree(Base64.getDecoder().decode(encodedData.trim()));
        } catch (Exception ex) {
            throw new IllegalArgumentException("Malformed eSewa response payload");
        }

        String transactionUuid = text(payload, "transaction_uuid");
        if (transactionUuid == null) {
            throw new IllegalArgumentException("eSewa response is missing transaction_uuid");
        }

        PaymentTransaction transaction = paymentTransactionRepository.findByIdempotencyKey(transactionUuid)
                .orElseThrow(() -> new IllegalArgumentException("Unknown payment transaction"));
        requireOwner(transaction);

        PaymentVerifyResponse settled = alreadySettled(transaction);
        if (settled != null) {
            return settled;
        }

        // 1. The blob is signed. Recompute over exactly the fields eSewa says it signed, using the
        //    strings as returned - eSewa formats total_amount inconsistently and any normalisation
        //    here would break the comparison.
        List<String> signedFields = List.of(String.valueOf(text(payload, "signed_field_names")).split(","));
        String expected = esewaSignature(flatten(payload), signedFields);
        String actual = text(payload, "signature");
        if (actual == null || !MessageDigest.isEqual(
                expected.getBytes(StandardCharsets.UTF_8), actual.getBytes(StandardCharsets.UTF_8))) {
            log.warn("eSewa signature mismatch for transaction_uuid={}", transactionUuid);
            return fail(transaction, "Payment signature verification failed");
        }

        // 2. A valid signature only proves the blob came from eSewa, not that it is current.
        //    The status API is authoritative.
        String totalAmount = transaction.getAmount().setScale(2, RoundingMode.HALF_UP).toPlainString();
        JsonNode status = esewaStatus(transactionUuid, totalAmount);
        if (!"COMPLETE".equalsIgnoreCase(text(status, "status"))) {
            return fail(transaction, "eSewa reports the payment as " + text(status, "status"));
        }

        // 3. The amount eSewa settled must match what we asked for.
        if (!amountMatches(transaction.getAmount(), text(status, "total_amount"))) {
            log.warn("eSewa amount mismatch for {}: expected {}, gateway reported {}",
                    transactionUuid, transaction.getAmount(), text(status, "total_amount"));
            return fail(transaction, "Paid amount does not match the booking price");
        }

        String reference = firstNonBlank(text(status, "ref_id"), text(payload, "transaction_code"), transactionUuid);
        return succeed(transaction, reference, payload);
    }

    private PaymentVerifyResponse verifyKhalti(String pidx) {
        PaymentTransaction transaction = paymentTransactionRepository.findByGatewayTransactionId(pidx)
                .orElseThrow(() -> new IllegalArgumentException("Unknown payment transaction"));
        requireOwner(transaction);

        PaymentVerifyResponse settled = alreadySettled(transaction);
        if (settled != null) {
            return settled;
        }

        JsonNode lookup = khaltiPost("/epayment/lookup/", Map.of("pidx", pidx));
        String status = text(lookup, "status");
        if (!"Completed".equalsIgnoreCase(status)) {
            // Pending and Initiated are not failures yet; leave the hold for the sweep to expire.
            if ("Pending".equalsIgnoreCase(status) || "Initiated".equalsIgnoreCase(status)) {
                return new PaymentVerifyResponse(PaymentStatus.PENDING,
                        "Khalti is still processing this payment.", pidx, null);
            }
            return fail(transaction, "Khalti reports the payment as " + status);
        }

        long expectedPaisa = toPaisa(transaction.getAmount());
        long paidPaisa = lookup.path("total_amount").asLong(-1);
        if (paidPaisa != expectedPaisa) {
            log.warn("Khalti amount mismatch for pidx={}: expected {} paisa, gateway reported {}",
                    pidx, expectedPaisa, paidPaisa);
            return fail(transaction, "Paid amount does not match the booking price");
        }

        return succeed(transaction, firstNonBlank(text(lookup, "transaction_id"), pidx), lookup);
    }

    /**
     * Only the booking's owner (or an admin) may settle or cancel its payment. The owner is not
     * known until the transaction is resolved from the gateway identifier, so the check lives here
     * rather than in the controller.
     */
    private void requireOwner(PaymentTransaction transaction) {
        Booking booking = transaction.getBooking();
        if (booking == null || booking.getUser() == null) {
            throw new IllegalStateException("Payment transaction has no owning booking");
        }
        securityAuth.requireUserOrAdmin(booking.getUser().getUserId());
    }

    /** Verification is idempotent: a replayed callback returns the booking rather than re-settling. */
    private PaymentVerifyResponse alreadySettled(PaymentTransaction transaction) {
        if (transaction.getStatus() != PaymentStatus.COMPLETED) {
            return null;
        }
        return new PaymentVerifyResponse(
                PaymentStatus.COMPLETED,
                "Payment already confirmed.",
                transaction.getGatewayTransactionId(),
                DtoMapper.toBookingResponse(transaction.getBooking()));
    }

    private PaymentVerifyResponse succeed(PaymentTransaction transaction, String reference, JsonNode raw) {
        transaction.setStatus(PaymentStatus.COMPLETED);
        transaction.setGatewayTransactionId(reference);
        transaction.setCompletedAt(LocalDateTime.now(clock));
        transaction.setGatewayResponse(raw.toString());
        paymentTransactionRepository.save(transaction);

        Booking booking = bookingService.settleGatewayPayment(
                transaction.getBooking().getBookingId(), reference);

        log.info("Payment confirmed: transactionId={}, reference={}", transaction.getTransactionId(), reference);
        return new PaymentVerifyResponse(PaymentStatus.COMPLETED, "Payment confirmed.", reference,
                DtoMapper.toBookingResponse(booking));
    }

    private PaymentVerifyResponse fail(PaymentTransaction transaction, String reason) {
        transaction.setStatus(PaymentStatus.FAILED);
        transaction.setFailureReason(reason);
        paymentTransactionRepository.save(transaction);
        releaseHold(transaction, "Payment failed");
        return new PaymentVerifyResponse(PaymentStatus.FAILED, reason, null, null);
    }

    // ── Cancellation and expiry ───────────────────────────────────────────────

    /** Called when the user abandons the gateway, so the slot does not stay held. */
    @Transactional
    public PaymentVerifyResponse cancel(Long transactionId) {
        PaymentTransaction transaction = paymentTransactionRepository.findByIdForUpdate(transactionId)
                .orElseThrow(() -> new IllegalArgumentException("Unknown payment transaction"));
        requireOwner(transaction);

        PaymentVerifyResponse settled = alreadySettled(transaction);
        if (settled != null) {
            return settled;
        }

        transaction.setStatus(PaymentStatus.CANCELLED);
        paymentTransactionRepository.save(transaction);
        releaseHold(transaction, "Payment cancelled");
        return new PaymentVerifyResponse(PaymentStatus.CANCELLED, "Payment cancelled.", null, null);
    }

    /**
     * Frees slots held by checkouts nobody finished.
     *
     * <p>Without this an abandoned checkout blocks its slot forever: the hold is taken at
     * initiation and only released on an explicit success or failure that never arrives.
     */
    @Scheduled(fixedDelayString = "${app.payment.sweep-interval-ms:300000}")
    @Transactional
    public void releaseExpiredHolds() {
        LocalDateTime cutoff = LocalDateTime.now(clock).minusMinutes(holdMinutes);
        List<PaymentTransaction> expired =
                paymentTransactionRepository.findByStatusAndCreatedAtBefore(PaymentStatus.PENDING, cutoff);
        if (expired.isEmpty()) {
            return;
        }
        for (PaymentTransaction transaction : expired) {
            try {
                transaction.setStatus(PaymentStatus.CANCELLED);
                transaction.setFailureReason("Checkout abandoned; hold expired after " + holdMinutes + " minutes");
                paymentTransactionRepository.save(transaction);
                releaseHold(transaction, "Payment hold expired");
            } catch (RuntimeException ex) {
                log.error("Could not release expired hold for transactionId={}",
                        transaction.getTransactionId(), ex);
            }
        }
        log.info("Released {} expired payment hold(s)", expired.size());
    }

    /**
     * Cancels the placeholder booking, which frees the slot and writes the history entries.
     * Reuses the normal status transition so the audit trail matches a user-initiated cancel.
     */
    private void releaseHold(PaymentTransaction transaction, String reason) {
        Booking booking = transaction.getBooking();
        if (booking == null) {
            return;
        }
        try {
            if (booking.getStatus() == BookingStatus.PENDING || booking.getStatus() == BookingStatus.APPROVED) {
                bookingService.updateStatus(booking.getBookingId(), BookingStatus.CANCELLED, "payment");
            }
        } catch (RuntimeException ex) {
            log.error("Could not release slot hold for bookingId={} ({})", booking.getBookingId(), reason, ex);
        }
    }

    // ── Gateway calls ─────────────────────────────────────────────────────────

    private JsonNode khaltiPost(String path, Object payload) {
        try {
            return restClient.post()
                    .uri(khaltiApiUrl + path)
                    .header("Authorization", "Key " + khaltiSecret)
                    .header("Content-Type", "application/json")
                    .body(payload)
                    .retrieve()
                    .body(JsonNode.class);
        } catch (RuntimeException ex) {
            log.error("Khalti call to {} failed: {}", path, ex.getMessage());
            throw new IllegalStateException("Could not reach Khalti. Please try again.");
        }
    }

    private JsonNode esewaStatus(String transactionUuid, String totalAmount) {
        try {
            String uri = UriComponentsBuilder.fromUriString(esewaStatusUrl)
                    .queryParam("product_code", esewaMerchantCode)
                    .queryParam("total_amount", totalAmount)
                    .queryParam("transaction_uuid", transactionUuid)
                    .toUriString();
            return restClient.get().uri(uri).retrieve().body(JsonNode.class);
        } catch (RuntimeException ex) {
            log.error("eSewa status check failed for {}: {}", transactionUuid, ex.getMessage());
            throw new IllegalStateException("Could not reach eSewa. Please try again.");
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    /**
     * eSewa's HMAC-SHA256 covers {@code name=value} pairs joined by commas, in the order given by
     * signed_field_names, base64 encoded.
     */
    String esewaSignature(Map<String, String> values, List<String> signedFields) {
        StringBuilder message = new StringBuilder();
        for (String field : signedFields) {
            String key = field.trim();
            if (!message.isEmpty()) {
                message.append(',');
            }
            message.append(key).append('=').append(values.getOrDefault(key, ""));
        }
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(esewaMerchantSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return Base64.getEncoder().encodeToString(mac.doFinal(message.toString().getBytes(StandardCharsets.UTF_8)));
        } catch (Exception ex) {
            throw new IllegalStateException("Could not sign the eSewa request", ex);
        }
    }

    /** Price = the venue's hourly rate pro-rated over the slot's duration. */
    private BigDecimal priceFor(TimeSlot slot) {
        Futsal futsal = slot.getFutsal();
        if (futsal == null || futsal.getHourlyPrice() == null || futsal.getHourlyPrice().signum() <= 0) {
            throw new IllegalStateException("This venue has no hourly price configured.");
        }
        long minutes = Duration.between(slot.getStartTime(), slot.getEndTime()).toMinutes();
        if (minutes <= 0) {
            throw new IllegalStateException("This slot has an invalid duration.");
        }
        return futsal.getHourlyPrice()
                .multiply(BigDecimal.valueOf(minutes))
                .divide(BigDecimal.valueOf(60), 2, RoundingMode.HALF_UP);
    }

    private long toPaisa(BigDecimal amount) {
        return amount.multiply(BigDecimal.valueOf(100)).setScale(0, RoundingMode.HALF_UP).longValueExact();
    }

    /** eSewa may return amounts with grouping separators, e.g. "1,800.0". */
    private boolean amountMatches(BigDecimal expected, String reported) {
        if (reported == null) {
            return false;
        }
        try {
            BigDecimal actual = new BigDecimal(reported.replace(",", "").trim());
            return expected.compareTo(actual) == 0;
        } catch (NumberFormatException ex) {
            return false;
        }
    }

    private Map<String, String> flatten(JsonNode node) {
        Map<String, String> values = new LinkedHashMap<>();
        node.fields().forEachRemaining(entry -> values.put(entry.getKey(), entry.getValue().asText()));
        return values;
    }

    private String text(JsonNode node, String field) {
        if (node == null) {
            return null;
        }
        JsonNode value = node.get(field);
        return value == null || value.isNull() ? null : value.asText();
    }

    private String firstNonBlank(String... candidates) {
        for (String candidate : candidates) {
            if (candidate != null && !candidate.isBlank()) {
                return candidate;
            }
        }
        return null;
    }

    private String returnUrl(String path) {
        return returnBaseUrl.replaceAll("/+$", "") + path;
    }

    private String newTransactionUuid() {
        // eSewa requires an alphanumeric/hyphen transaction_uuid that is unique per attempt.
        return "FUTSAL-" + UUID.randomUUID().toString().replace("-", "").substring(0, 20).toUpperCase();
    }

    private PaymentMethod parsePaymentMethod(String method) {
        try {
            return PaymentMethod.valueOf(method.trim().toUpperCase());
        } catch (RuntimeException ex) {
            throw new IllegalArgumentException("Invalid payment method: " + method);
        }
    }
}
