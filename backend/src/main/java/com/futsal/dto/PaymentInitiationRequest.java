package com.futsal.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Starts a payment for a slot.
 *
 * <p>Deliberately carries no amount and no redirect URLs. The price is derived server-side from
 * the venue's hourly rate and the slot duration, and the gateway return URLs come from
 * {@code app.payment.return-base-url}. Accepting either from the client would allow a caller to
 * pay an arbitrary price or to redirect the gateway callback to a site they control.
 */
public class PaymentInitiationRequest {

    @NotNull(message = "User ID is required")
    private Long userId;

    @NotNull(message = "Slot ID is required")
    private Long slotId;

    @NotBlank(message = "Payment method is required")
    private String method;

    @Size(max = 500, message = "Notes must be up to 500 characters")
    private String notes;

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public Long getSlotId() { return slotId; }
    public void setSlotId(Long slotId) { this.slotId = slotId; }

    public String getMethod() { return method; }
    public void setMethod(String method) { this.method = method; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
