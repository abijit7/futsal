package com.futsal.dto;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.time.LocalTime;

public class SlotRequest {

    @NotNull(message = "Futsal ID is required")
    private Long futsalId;

    @NotNull(message = "Slot date is required")
    private LocalDate slotDate;

    @NotNull(message = "Start time is required")
    private LocalTime startTime;

    @NotNull(message = "End time is required")
    private LocalTime endTime;

    private Boolean available;

    public Long getFutsalId()                 { return futsalId; }
    public void setFutsalId(Long futsalId)    { this.futsalId = futsalId; }

    public LocalDate getSlotDate()            { return slotDate; }
    public void setSlotDate(LocalDate slotDate){ this.slotDate = slotDate; }

    public LocalTime getStartTime()           { return startTime; }
    public void setStartTime(LocalTime startTime){ this.startTime = startTime; }

    public LocalTime getEndTime()             { return endTime; }
    public void setEndTime(LocalTime endTime) { this.endTime = endTime; }

    public Boolean getAvailable()             { return available; }
    public void setAvailable(Boolean available){ this.available = available; }
}
