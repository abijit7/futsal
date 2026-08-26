package com.futsal.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public class PaymentInitiationRequest {
    @NotNull(message = "User ID is required")
    private Long userId;

    @NotNull(message = "Slot ID is required")
    private Long slotId;

    @NotNull(message = "Payment method is required")
    private String method;

    @NotNull(message = "Amount is required")
    @DecimalMin(value = "0.01", message = "Amount must be positive")
    private BigDecimal amount;

    private String notes;

    private String successUrl;
    private String failureUrl;
    private String cancelUrl;

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public Long getSlotId() { return slotId; }
    public void setSlotId(Long slotId) { this.slotId = slotId; }

    public String getMethod() { return method; }
    public void setMethod(String method) { this.method = method; }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public String getSuccessUrl() { return successUrl; }
    public void setSuccessUrl(String successUrl) { this.successUrl = successUrl; }

    public String getFailureUrl() { return failureUrl; }
    public void setFailureUrl(String failureUrl) { this.failureUrl = failureUrl; }

    public String getCancelUrl() { return cancelUrl; }
    public void setCancelUrl(String cancelUrl) { this.cancelUrl = cancelUrl; }
}
