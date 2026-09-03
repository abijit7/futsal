package com.futsal.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.futsal.error.ConflictException;
import com.futsal.error.NotFoundException;
import com.futsal.model.Booking;
import com.futsal.model.PaymentTransaction;
import com.futsal.model.enums.PaymentMethod;
import com.futsal.model.enums.PaymentStatus;
import com.futsal.repository.PaymentTransactionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Clock;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.function.Supplier;

/**
 * Tracks refunds owed to customers, and confirms them once eSewa reports the money went back.
 *
 * <p>eSewa exposes no merchant refund API — their documentation states that only eSewa initiates
 * refunds and that merchants cannot trigger them programmatically. The money is therefore moved by
 * hand in the merchant dashboard, and this service cannot change that. What it removes is every
 * other manual step: the obligation is recorded the moment a paid booking is cancelled, an admin
 * gets a queue with the gateway reference to work from, and a sweep watches eSewa's status API so
 * a dashboard refund closes itself out.
 *
 * <p>Deliberately depends on neither {@code BookingService} nor {@code PaymentGatewayService}.
 * {@code PaymentGatewayService} already depends on {@code BookingService}, so a refund service
 * referenced by {@code BookingService} must sit at the bottom of the graph or the context fails to
 * start with a cycle.
 */
@Service
public class RefundService {

    private static final Logger log = LoggerFactory.getLogger(RefundService.class);

    private final PaymentTransactionRepository paymentTransactionRepository;
    private final EsewaStatusClient esewaStatusClient;
    private final BookingNotificationService bookingNotificationService;
    private final Clock clock;
    private final PlatformTransactionManager transactionManager;

    @Value("${app.refund.overdue-hours:48}")
    private int overdueHours;

    public RefundService(PaymentTransactionRepository paymentTransactionRepository,
                         EsewaStatusClient esewaStatusClient,
                         BookingNotificationService bookingNotificationService,
                         Clock clock,
                         PlatformTransactionManager transactionManager) {
        this.paymentTransactionRepository = paymentTransactionRepository;
        this.esewaStatusClient = esewaStatusClient;
        this.bookingNotificationService = bookingNotificationService;
        this.clock = clock;
        this.transactionManager = transactionManager;
    }

    // ── Recording that a refund is owed ──────────────────────────────────────

    /**
     * Records that a cancelled or rejected booking owes its customer a refund.
     *
     * <p>Silently does nothing unless money actually moved through a gateway. That guard is not
     * merely defensive: {@code PaymentGatewayService.releaseHold} cancels bookings through the same
     * {@code BookingService.updateStatus} path this is called from, so an abandoned checkout would
     * otherwise create a phantom refund. An abandoned hold is {@code PENDING} and a reconciled
     * refund is already {@code REFUNDED}, so neither qualifies.
     */
    @Transactional
    public void markRefundDue(Booking booking, String reason, String actor) {
        if (booking == null) {
            return;
        }
        PaymentTransaction unlocked = paymentTransactionRepository.findByBooking(booking).orElse(null);
        if (unlocked == null || unlocked.getTransactionId() == null) {
            return;
        }
        PaymentTransaction transaction =
                paymentTransactionRepository.findByIdForUpdate(unlocked.getTransactionId()).orElse(null);
        if (transaction == null || !refundable(transaction)) {
            return;
        }

        transaction.setStatus(PaymentStatus.REFUND_PENDING);
        transaction.setRefundDueAt(LocalDateTime.now(clock));
        transaction.setRefundReason(reason);
        transaction.setRefundRequestedBy(actor);
        paymentTransactionRepository.save(transaction);

        log.warn("Refund owed: transactionId={}, booking={}, amount={}, reason={}",
                transaction.getTransactionId(), booking.getBookingId(), transaction.getAmount(), reason);

        notify(booking, transaction.getAmount(), false);
    }

    /** Only a settled gateway payment can owe a refund. Cash is handed back at the venue. */
    private boolean refundable(PaymentTransaction transaction) {
        return transaction.getStatus() == PaymentStatus.COMPLETED
                && transaction.getPaymentMethod() != PaymentMethod.CASH_IN_HAND;
    }

    // ── Confirming refunds ───────────────────────────────────────────────────

    /**
     * Watches eSewa for refunds issued in the merchant dashboard.
     *
     * <p>Not {@code @Transactional}: each transaction is reconciled in its own unit of work so one
     * bad row cannot roll the batch back, mirroring the payment hold sweep.
     */
    @Scheduled(fixedDelayString = "${app.refund.sweep-interval-ms:900000}")
    public void reconcileRefunds() {
        List<Long> pending = paymentTransactionRepository.findByStatus(PaymentStatus.REFUND_PENDING)
                .stream()
                .map(PaymentTransaction::getTransactionId)
                .toList();
        if (pending.isEmpty()) {
            return;
        }

        int confirmed = 0;
        int outstanding = 0;
        for (Long id : pending) {
            try {
                if (inNewTransaction(() -> reconcileRefund(id)) == PaymentStatus.REFUNDED) {
                    confirmed++;
                } else {
                    outstanding++;
                }
            } catch (RuntimeException ex) {
                outstanding++;
                log.error("Could not reconcile refund for transactionId={}", id, ex);
            }
        }
        log.info("Reconciled {} pending refund(s): {} confirmed, {} still outstanding",
                pending.size(), confirmed, outstanding);
    }

    /**
     * Reconciles one owed refund against eSewa. Returns the status it ended in;
     * {@code REFUND_PENDING} means "still owed".
     *
     * <p>Package-private so the decision table is testable without a scheduler.
     */
    PaymentStatus reconcileRefund(Long transactionId) {
        PaymentTransaction transaction =
                paymentTransactionRepository.findByIdForUpdate(transactionId).orElse(null);
        if (transaction == null) {
            return PaymentStatus.CANCELLED;
        }
        if (transaction.getStatus() != PaymentStatus.REFUND_PENDING) {
            return transaction.getStatus();
        }

        JsonNode status;
        try {
            status = esewaStatusClient.fetch(
                    transaction.getIdempotencyKey(), formatAmount(transaction.getAmount()));
        } catch (RuntimeException ex) {
            // Unreachable is not the same as unrefunded. Keep the obligation and retry.
            log.warn("eSewa unreachable while reconciling refund transactionId={}", transactionId);
            return PaymentStatus.REFUND_PENDING;
        }

        String state = status == null || status.path("status").isMissingNode()
                ? null
                : status.path("status").asText(null);
        if (state == null) {
            log.error("eSewa returned no status for refund transactionId={}", transactionId);
            return PaymentStatus.REFUND_PENDING;
        }

        switch (state.toUpperCase()) {
            case "FULL_REFUND" -> {
                return confirm(transaction, null, "eSewa", status.toString());
            }
            case "PARTIAL_REFUND" -> {
                // The policy is full refunds only, so a partial one is a disagreement between the
                // dashboard and this system that a person has to settle.
                log.error("REFUND NEEDS REVIEW: transactionId={} was partially refunded, but the "
                        + "policy is full refunds only", transactionId);
                return PaymentStatus.REFUND_PENDING;
            }
            default -> {
                // COMPLETE means nobody has issued the refund yet, which is normal soon after
                // cancellation and a problem if it persists.
                LocalDateTime due = transaction.getRefundDueAt();
                if (due != null && Duration.between(due, LocalDateTime.now(clock)).toHours() >= overdueHours) {
                    log.error("REFUND OVERDUE: transactionId={} has been owed for over {} hours "
                            + "and eSewa still reports '{}'", transactionId, overdueHours, state);
                }
                return PaymentStatus.REFUND_PENDING;
            }
        }
    }

    /**
     * Records a refund eSewa cannot confirm — cash handed back, a bank transfer, or a partial
     * refund settled by agreement.
     */
    @Transactional
    public PaymentTransaction confirmManually(Long transactionId, String reference, String actor) {
        PaymentTransaction transaction = paymentTransactionRepository.findByIdForUpdate(transactionId)
                .orElseThrow(() -> new NotFoundException("Payment transaction not found"));
        if (transaction.getStatus() == PaymentStatus.REFUNDED) {
            return transaction;
        }
        if (transaction.getStatus() != PaymentStatus.REFUND_PENDING) {
            throw new ConflictException("This payment does not have a refund outstanding.");
        }
        confirm(transaction, reference, actor, null);
        return transaction;
    }

    private PaymentStatus confirm(PaymentTransaction transaction, String reference,
                                  String actor, String gatewayEvidence) {
        transaction.setStatus(PaymentStatus.REFUNDED);
        transaction.setRefundedAt(LocalDateTime.now(clock));
        transaction.setRefundReference(reference);
        if (gatewayEvidence != null) {
            // Kept alongside, not over, the original settlement response.
            transaction.setRefundReason(appendEvidence(transaction.getRefundReason(), gatewayEvidence));
        }
        paymentTransactionRepository.save(transaction);

        log.info("Refund confirmed by {}: transactionId={}, amount={}",
                actor, transaction.getTransactionId(), transaction.getAmount());

        notify(transaction.getBooking(), transaction.getAmount(), true);
        return PaymentStatus.REFUNDED;
    }

    private String appendEvidence(String reason, String evidence) {
        String trimmed = evidence.length() > 300 ? evidence.substring(0, 300) : evidence;
        String base = reason == null ? "" : reason + " | ";
        String combined = base + "confirmed by eSewa: " + trimmed;
        return combined.length() > 500 ? combined.substring(0, 500) : combined;
    }

    // ── Queue ────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Page<PaymentTransaction> outstandingRefunds(Pageable pageable) {
        return paymentTransactionRepository
                .findByStatusOrderByRefundDueAtAsc(PaymentStatus.REFUND_PENDING, pageable);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private void notify(Booking booking, BigDecimal amount, boolean completed) {
        if (bookingNotificationService == null) {
            return;
        }
        BookingNotification snapshot = BookingNotification.from(booking, amount);
        if (snapshot == null) {
            return;
        }
        AfterCommit.run(() -> {
            if (completed) {
                bookingNotificationService.sendRefundCompleted(snapshot, amount);
            } else {
                bookingNotificationService.sendRefundDue(snapshot, amount);
            }
        });
    }

    private String formatAmount(BigDecimal amount) {
        return amount.setScale(2, RoundingMode.HALF_UP).toPlainString();
    }

    /** Runs one reconciliation in its own transaction so failures stay isolated. */
    private <T> T inNewTransaction(Supplier<T> work) {
        TransactionTemplate template = new TransactionTemplate(transactionManager);
        template.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
        return template.execute(ignored -> work.get());
    }
}
