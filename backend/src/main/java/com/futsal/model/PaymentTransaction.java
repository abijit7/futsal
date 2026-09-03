package com.futsal.model;

import com.futsal.model.enums.PaymentMethod;
import com.futsal.model.enums.PaymentStatus;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "payment_transactions")
public class PaymentTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long transactionId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "booking_id", nullable = false)
    private Booking booking;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentMethod paymentMethod;

    @Column(nullable = false, precision = 10, scale = 2)
    private java.math.BigDecimal amount;

    @Column(length = 3)
    private String currency = "NPR";

    @Column(length = 100)
    private String gatewayTransactionId;

    @Column(columnDefinition = "TEXT")
    private String gatewayResponse;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentStatus status = PaymentStatus.PENDING;

    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    private LocalDateTime completedAt;

    @Column(length = 500)
    private String failureReason;

    @Column(length = 100, unique = true)
    private String idempotencyKey;

    // ── Refund tracking ──────────────────────────────────────────────────────
    // Deliberately separate from completedAt / gatewayResponse / failureReason: those hold
    // settlement evidence for the original payment and must survive a later refund.

    /** When the refund became owed, i.e. when the paid booking was cancelled or rejected. */
    private LocalDateTime refundDueAt;

    @Column(length = 500)
    private String refundReason;

    /** Actor who caused the refund to be owed, in the same form as booking history: "admin" or "user:{id}". */
    @Column(length = 60)
    private String refundRequestedBy;

    /** When the refund was confirmed, either by eSewa reporting FULL_REFUND or by an admin. */
    private LocalDateTime refundedAt;

    /** Gateway or manual reference for the refund itself, distinct from the original payment reference. */
    @Column(length = 100)
    private String refundReference;

    // ── Constructors ──────────────────────────────────────────
    public PaymentTransaction() {}

    public PaymentTransaction(Booking booking, PaymentMethod paymentMethod, java.math.BigDecimal amount, String idempotencyKey) {
        this.booking = booking;
        this.paymentMethod = paymentMethod;
        this.amount = amount;
        this.idempotencyKey = idempotencyKey;
    }

    // ── Getters & Setters ─────────────────────────────────────
    public Long getTransactionId() { return transactionId; }
    public void setTransactionId(Long transactionId) { this.transactionId = transactionId; }

    public Booking getBooking() { return booking; }
    public void setBooking(Booking booking) { this.booking = booking; }

    public PaymentMethod getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(PaymentMethod paymentMethod) { this.paymentMethod = paymentMethod; }

    public java.math.BigDecimal getAmount() { return amount; }
    public void setAmount(java.math.BigDecimal amount) { this.amount = amount; }

    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }

    public String getGatewayTransactionId() { return gatewayTransactionId; }
    public void setGatewayTransactionId(String gatewayTransactionId) { this.gatewayTransactionId = gatewayTransactionId; }

    public String getGatewayResponse() { return gatewayResponse; }
    public void setGatewayResponse(String gatewayResponse) { this.gatewayResponse = gatewayResponse; }

    public PaymentStatus getStatus() { return status; }
    public void setStatus(PaymentStatus status) { this.status = status; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getCompletedAt() { return completedAt; }
    public void setCompletedAt(LocalDateTime completedAt) { this.completedAt = completedAt; }

    public String getFailureReason() { return failureReason; }
    public void setFailureReason(String failureReason) { this.failureReason = failureReason; }

    public String getIdempotencyKey() { return idempotencyKey; }
    public void setIdempotencyKey(String idempotencyKey) { this.idempotencyKey = idempotencyKey; }

    public LocalDateTime getRefundDueAt()                    { return refundDueAt; }
    public void setRefundDueAt(LocalDateTime refundDueAt)    { this.refundDueAt = refundDueAt; }

    public String getRefundReason()                          { return refundReason; }
    public void setRefundReason(String refundReason)         { this.refundReason = refundReason; }

    public String getRefundRequestedBy()                             { return refundRequestedBy; }
    public void setRefundRequestedBy(String refundRequestedBy)       { this.refundRequestedBy = refundRequestedBy; }

    public LocalDateTime getRefundedAt()                     { return refundedAt; }
    public void setRefundedAt(LocalDateTime refundedAt)      { this.refundedAt = refundedAt; }

    public String getRefundReference()                       { return refundReference; }
    public void setRefundReference(String refundReference)   { this.refundReference = refundReference; }
}
