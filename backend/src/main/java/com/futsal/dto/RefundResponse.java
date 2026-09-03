package com.futsal.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * One outstanding refund, as shown in the admin queue.
 *
 * <p>Carries the gateway reference because that is what an operator pastes into the eSewa merchant
 * dashboard to find the original payment — the system cannot issue the refund itself.
 */
public class RefundResponse {

    private Long transactionId;
    private Long bookingId;
    private BigDecimal amount;
    private String currency;
    private String customerName;
    private String customerEmail;
    private String venueName;
    private String gatewayReference;
    private String reason;
    private String requestedBy;
    private LocalDateTime refundDueAt;
    /** Hours since the refund became owed, so the queue can surface the stalest first. */
    private long outstandingHours;

    public Long getTransactionId() { return transactionId; }
    public void setTransactionId(Long transactionId) { this.transactionId = transactionId; }

    public Long getBookingId() { return bookingId; }
    public void setBookingId(Long bookingId) { this.bookingId = bookingId; }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }

    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }

    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }

    public String getCustomerEmail() { return customerEmail; }
    public void setCustomerEmail(String customerEmail) { this.customerEmail = customerEmail; }

    public String getVenueName() { return venueName; }
    public void setVenueName(String venueName) { this.venueName = venueName; }

    public String getGatewayReference() { return gatewayReference; }
    public void setGatewayReference(String gatewayReference) { this.gatewayReference = gatewayReference; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }

    public String getRequestedBy() { return requestedBy; }
    public void setRequestedBy(String requestedBy) { this.requestedBy = requestedBy; }

    public LocalDateTime getRefundDueAt() { return refundDueAt; }
    public void setRefundDueAt(LocalDateTime refundDueAt) { this.refundDueAt = refundDueAt; }

    public long getOutstandingHours() { return outstandingHours; }
    public void setOutstandingHours(long outstandingHours) { this.outstandingHours = outstandingHours; }
}
