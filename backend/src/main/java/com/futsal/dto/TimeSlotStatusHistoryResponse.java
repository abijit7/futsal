package com.futsal.dto;

import java.time.LocalDateTime;

public class TimeSlotStatusHistoryResponse {
    private boolean available;
    private LocalDateTime changedAt;
    private String changedBy;
    private String note;

    public boolean isAvailable() { return available; }
    public void setAvailable(boolean available) { this.available = available; }

    public LocalDateTime getChangedAt() { return changedAt; }
    public void setChangedAt(LocalDateTime changedAt) { this.changedAt = changedAt; }

    public String getChangedBy() { return changedBy; }
    public void setChangedBy(String changedBy) { this.changedBy = changedBy; }

    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }
}

