package com.futsal.dto;

import jakarta.validation.constraints.NotNull;

public class BookingCreateRequest {
    @NotNull(message = "User ID is required")
    private Long userId;

    @NotNull(message = "Slot ID is required")
    private Long slotId;

    private String notes;

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public Long getSlotId() { return slotId; }
    public void setSlotId(Long slotId) { this.slotId = slotId; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}

