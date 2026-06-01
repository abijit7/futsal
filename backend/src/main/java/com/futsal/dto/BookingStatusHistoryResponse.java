package com.futsal.dto;

import com.futsal.model.enums.BookingStatus;
import java.time.LocalDateTime;

public class BookingStatusHistoryResponse {
    private BookingStatus status;
    private LocalDateTime changedAt;
    private String changedBy;
    private String note;

    public BookingStatus getStatus() { return status; }
    public void setStatus(BookingStatus status) { this.status = status; }

    public LocalDateTime getChangedAt() { return changedAt; }
    public void setChangedAt(LocalDateTime changedAt) { this.changedAt = changedAt; }

    public String getChangedBy() { return changedBy; }
    public void setChangedBy(String changedBy) { this.changedBy = changedBy; }

    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }
}

