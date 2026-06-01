package com.futsal.dto;

import java.time.LocalDate;
import java.time.LocalTime;

public class TimeSlotResponse {
    private Long slotId;
    private LocalDate slotDate;
    private LocalTime startTime;
    private LocalTime endTime;
    private boolean available;
    private FutsalSummary futsal;
    private java.util.List<TimeSlotStatusHistoryResponse> statusHistory;

    public Long getSlotId() { return slotId; }
    public void setSlotId(Long slotId) { this.slotId = slotId; }

    public LocalDate getSlotDate() { return slotDate; }
    public void setSlotDate(LocalDate slotDate) { this.slotDate = slotDate; }

    public LocalTime getStartTime() { return startTime; }
    public void setStartTime(LocalTime startTime) { this.startTime = startTime; }

    public LocalTime getEndTime() { return endTime; }
    public void setEndTime(LocalTime endTime) { this.endTime = endTime; }

    public boolean isAvailable() { return available; }
    public void setAvailable(boolean available) { this.available = available; }

    public FutsalSummary getFutsal() { return futsal; }
    public void setFutsal(FutsalSummary futsal) { this.futsal = futsal; }

    public java.util.List<TimeSlotStatusHistoryResponse> getStatusHistory() { return statusHistory; }
    public void setStatusHistory(java.util.List<TimeSlotStatusHistoryResponse> statusHistory) { this.statusHistory = statusHistory; }
}


