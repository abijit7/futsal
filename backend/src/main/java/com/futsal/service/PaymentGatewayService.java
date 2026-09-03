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
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

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
import java.util.function.Supplier;

/**
 * eSewa ePay v2 integration.
 *
 * <p>eSewa takes an auto-submitted HTML form POST carrying an HMAC-SHA256 signature over
 * {@code total_amount,transaction_uuid,product_code}, and returns a base64-encoded JSON blob on the
 * success URL. That blob's signature is recomputed here and then confirmed against eSewa's
 * transaction status API, because the return URL's query string is trivially forgeable and is
 * never treated as proof of payment on its own.
 *
 * <p>eSewa exposes no server-to-server webhook, so there is no webhook endpoint here. Settlement
 * that the browser never completes is recovered by {@link #reconcileExpiredHolds()}.
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
    /** eSewa's status API, shared with the refund sweep; see {@code EsewaStatusClient}. */
    private final EsewaStatusClient esewaStatusClient;

    @Value("${payment.esewa.merchant.code}")
    private String esewaMerchantCode;

    @Value("${payment.esewa.merchant.secret}")
    private String esewaMerchantSecret;

    @Value("${payment.esewa.form-url}")
    private String esewaFormUrl;


    private final BookingNotificationService bookingNotificationService;
    private final PlatformTransactionManager transactionManager;

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
            SecurityAuth securityAuth,
            BookingNotificationService bookingNotificationService,
            PlatformTransactionManager transactionManager,
            EsewaStatusClient esewaStatusClient
    ) {
        this.paymentTransactionRepository = paymentTransactionRepository;
        this.timeSlotRepository = timeSlotRepository;
        this.bookingService = bookingService;
        this.objectMapper = objectMapper;
        this.clock = clock;
        this.securityAuth = securityAuth;
        this.bookingNotificationService = bookingNotificationService;
        this.transactionManager = transactionManager;
        this.esewaStatusClient = esewaStatusClient;
    }

    /**
     * Sends a receipt once the settling transaction commits. Tolerates a missing collaborator so
     * unit tests can construct the service with nulls.
     */
    private void notifyConfirmed(Booking booking, BigDecimal amount) {
        if (bookingNotificationService == null) {
            return;
        }
        BookingNotification snapshot = BookingNotification.from(booking, amount);
        if (snapshot == null) {
            return;
        }
        AfterCommit.run(() -> bookingNotificationService.sendBookingConfirmed(snapshot));
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
            case CASH_IN_HAND -> {
                transaction.setStatus(PaymentStatus.COMPLETED);
                transaction.setGatewayTransactionId(transactionUuid);
                transaction.setCompletedAt(LocalDateTime.now(clock));
                paymentTransactionRepository.save(transaction);
                response.setBooking(DtoMapper.toBookingResponse(booking));
                response.setMessage("Booking created. Pay at the venue.");
                notifyConfirmed(booking, amount);
            }
        }

        log.info("Payment initiated: transactionId={}, method={}, amount={}",
                transaction.getTransactionId(), method, amount);
        return response;
    }

    private Map<String, String> esewaFormFields(String transactionUuid, BigDecimal amount) {
        // The signature must cover the exact strings submitted, so format once and reuse.
        String totalAmount = formatAmount(amount);

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

    // ── Verification ──────────────────────────────────────────────────────────

    @Transactional
    public PaymentVerifyResponse verify(PaymentVerifyRequest request) {
        if (request.getData() != null && !request.getData().isBlank()) {
            return verifyEsewa(request.getData());
        }
        throw new IllegalArgumentException("Nothing to verify: expected an eSewa 'data' payload.");
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
        String totalAmount = formatAmount(transaction.getAmount());
        JsonNode status = esewaStatusClient.fetch(transactionUuid, totalAmount);
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
        notifyConfirmed(booking, transaction.getAmount());
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
     * Settles or frees checkouts the browser never finished.
     *
     * <p>eSewa has no server-to-server webhook, so settlement otherwise depends entirely on the
     * customer's browser coming back and calling {@code /verify}. A customer who pays and then
     * closes the tab, loses signal, or whose token has expired would previously have had their
     * booking cancelled by this sweep while their money was already gone.
     *
     * <p>So an expired hold is never cancelled on the assumption that it went unpaid: eSewa is
     * asked first, and the hold is only released when eSewa gives a definitive "not paid" answer.
     * Anything ambiguous keeps its hold and is logged for a human, because holding one slot is far
     * cheaper than taking money without giving a booking.
     *
     * <p>Deliberately not {@code @Transactional}: each transaction is reconciled in its own unit of
     * work, so one bad row cannot roll the whole batch back.
     */
    @Scheduled(fixedDelayString = "${app.payment.sweep-interval-ms:300000}")
    public void reconcileExpiredHolds() {
        LocalDateTime cutoff = LocalDateTime.now(clock).minusMinutes(holdMinutes);
        List<Long> expiredIds = paymentTransactionRepository
                .findByStatusAndCreatedAtBefore(PaymentStatus.PENDING, cutoff)
                .stream()
                .map(PaymentTransaction::getTransactionId)
                .toList();
        if (expiredIds.isEmpty()) {
            return;
        }

        int settled = 0;
        int released = 0;
        int unresolved = 0;
        for (Long id : expiredIds) {
            try {
                switch (inNewTransaction(() -> reconcileExpiredHold(id))) {
                    case COMPLETED, REFUNDED -> settled++;
                    case CANCELLED, FAILED -> released++;
                    default -> unresolved++;
                }
            } catch (RuntimeException ex) {
                // This item's transaction rolled back on its own; the rest of the batch continues.
                unresolved++;
                log.error("Could not reconcile expired hold for transactionId={}", id, ex);
            }
        }
        log.info("Reconciled {} expired hold(s): {} settled, {} released, {} still unresolved",
                expiredIds.size(), settled, released, unresolved);
    }

    /**
     * Reconciles one expired hold against eSewa. Returns the status it ended in; {@code PENDING}
     * means "still unresolved, hold kept".
     *
     * <p>Package-private so the decision table can be tested without a scheduler.
     */
    PaymentStatus reconcileExpiredHold(Long transactionId) {
        PaymentTransaction transaction = paymentTransactionRepository.findByIdForUpdate(transactionId)
                .orElse(null);
        if (transaction == null || transaction.getStatus() != PaymentStatus.PENDING) {
            // Verified by the browser between listing and locking; nothing to do.
            return transaction == null ? PaymentStatus.CANCELLED : transaction.getStatus();
        }

        // Khalti is no longer offered and can no longer be looked up, so any stale hold left from
        // it is simply released. No Khalti payment ever settled outside the sandbox.
        if (transaction.getPaymentMethod() != PaymentMethod.ESEWA) {
            return releaseUnpaid(transaction,
                    "Checkout abandoned; hold expired after " + holdMinutes + " minutes");
        }

        JsonNode status;
        try {
            status = esewaStatusClient.fetch(transaction.getIdempotencyKey(), formatAmount(transaction.getAmount()));
        } catch (RuntimeException ex) {
            // Unreachable is not the same as unpaid. Keep the hold and try again next sweep.
            log.warn("eSewa unreachable while reconciling transactionId={}; keeping the hold", transactionId);
            return PaymentStatus.PENDING;
        }

        String state = text(status, "status");
        if (state == null) {
            log.error("eSewa returned no status for transactionId={}; keeping the hold", transactionId);
            return PaymentStatus.PENDING;
        }

        switch (state.toUpperCase()) {
            case "COMPLETE" -> {
                // The customer paid and never made it back. Give them the booking they paid for.
                if (!amountMatches(transaction.getAmount(), text(status, "total_amount"))) {
                    log.error("PAYMENT NEEDS REVIEW: transactionId={} paid an amount that does not "
                            + "match the booking price; keeping the hold", transactionId);
                    return PaymentStatus.PENDING;
                }
                String reference = firstNonBlank(text(status, "ref_id"), transaction.getIdempotencyKey());
                log.warn("Settling transactionId={} from reconciliation; the browser never returned",
                        transactionId);
                succeed(transaction, reference, status);
                return PaymentStatus.COMPLETED;
            }
            case "NOT_FOUND", "CANCELED", "CANCELLED", "EXPIRED" -> {
                // eSewa is certain no money was taken.
                return releaseUnpaid(transaction,
                        "eSewa reports the payment as " + state + " after " + holdMinutes + " minutes");
            }
            case "FULL_REFUND", "PARTIAL_REFUND" -> {
                // Money moved and came back. Free the slot, but record it as refunded rather than
                // as an abandoned checkout, because the two mean very different things in a ledger.
                transaction.setStatus(PaymentStatus.REFUNDED);
                transaction.setFailureReason("eSewa reports the payment as " + state);
                transaction.setGatewayResponse(status.toString());
                paymentTransactionRepository.save(transaction);
                releaseHold(transaction, "Payment refunded");
                return PaymentStatus.REFUNDED;
            }
            default -> {
                // PENDING, AMBIGUOUS, or anything eSewa adds later. Never guess with money.
                log.error("PAYMENT NEEDS REVIEW: transactionId={} is still '{}' at eSewa after {} "
                        + "minutes; the slot stays held until this is resolved manually",
                        transactionId, state, holdMinutes);
                return PaymentStatus.PENDING;
            }
        }
    }

    private PaymentStatus releaseUnpaid(PaymentTransaction transaction, String reason) {
        transaction.setStatus(PaymentStatus.CANCELLED);
        transaction.setFailureReason(reason);
        paymentTransactionRepository.save(transaction);
        releaseHold(transaction, "Payment hold expired");
        return PaymentStatus.CANCELLED;
    }

    /** Runs one reconciliation in its own transaction so failures stay isolated. */
    private <T> T inNewTransaction(Supplier<T> work) {
        TransactionTemplate template = new TransactionTemplate(transactionManager);
        template.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
        return template.execute(statusIgnored -> work.get());
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

    /** The exact string eSewa is sent and signs; it must be identical everywhere it appears. */
    private String formatAmount(BigDecimal amount) {
        return amount.setScale(2, RoundingMode.HALF_UP).toPlainString();
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
        PaymentMethod parsed;
        try {
            parsed = PaymentMethod.valueOf(method.trim().toUpperCase());
        } catch (RuntimeException ex) {
            throw new IllegalArgumentException("Invalid payment method: " + method);
        }
        // The constant still exists so historical bookings deserialize, but it can no longer be
        // chosen for a new checkout.
        if (parsed == PaymentMethod.KHALTI) {
            throw new IllegalArgumentException("Khalti is no longer accepted. Please pay with eSewa or cash.");
        }
        return parsed;
    }
}
