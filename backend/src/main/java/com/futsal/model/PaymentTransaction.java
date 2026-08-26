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
}
