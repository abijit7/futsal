package com.futsal.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;

@Entity
@Table(name = "time_slot_status_history")
public class TimeSlotStatusHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long historyId;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "slot_id", nullable = false)
    private TimeSlot timeSlot;

    @Column(nullable = false)
    private boolean available;

    @Column(nullable = false)
    private LocalDateTime changedAt = LocalDateTime.now();

    @Column(length = 60)
    private String changedBy;

    @Column(length = 200)
    private String note;

    public TimeSlotStatusHistory() {}

    public TimeSlotStatusHistory(TimeSlot timeSlot, boolean available, String changedBy, String note) {
        this.timeSlot = timeSlot;
        this.available = available;
        this.changedBy = changedBy;
        this.note = note;
    }

    public Long getHistoryId() { return historyId; }
    public void setHistoryId(Long historyId) { this.historyId = historyId; }

    public TimeSlot getTimeSlot() { return timeSlot; }
    public void setTimeSlot(TimeSlot timeSlot) { this.timeSlot = timeSlot; }

    public boolean isAvailable() { return available; }
    public void setAvailable(boolean available) { this.available = available; }

    public LocalDateTime getChangedAt() { return changedAt; }
    public void setChangedAt(LocalDateTime changedAt) { this.changedAt = changedAt; }

    public String getChangedBy() { return changedBy; }
    public void setChangedBy(String changedBy) { this.changedBy = changedBy; }

    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }
}

