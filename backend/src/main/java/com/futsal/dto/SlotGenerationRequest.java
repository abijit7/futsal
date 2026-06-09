package com.futsal.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

public class SlotGenerationRequest {

    @NotNull(message = "Futsal ID is required")
    private Long futsalId;

    @NotNull(message = "Start date is required")
    private LocalDate startDate;

    @NotNull(message = "End date is required")
    private LocalDate endDate;

    private LocalTime startTime;

    private LocalTime endTime;

    @Min(value = 15, message = "Slot duration must be at least 15 minutes")
    @Max(value = 240, message = "Slot duration must be 240 minutes or less")
    private int slotMinutes = 60;

    private List<LocalDate> holidayDates = new ArrayList<>();

    @Valid
    private List<MaintenanceBlockRequest> maintenanceBlocks = new ArrayList<>();

    public Long getFutsalId() { return futsalId; }
    public void setFutsalId(Long futsalId) { this.futsalId = futsalId; }

    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }

    public LocalDate getEndDate() { return endDate; }
    public void setEndDate(LocalDate endDate) { this.endDate = endDate; }

    public LocalTime getStartTime() { return startTime; }
    public void setStartTime(LocalTime startTime) { this.startTime = startTime; }

    public LocalTime getEndTime() { return endTime; }
    public void setEndTime(LocalTime endTime) { this.endTime = endTime; }

    public int getSlotMinutes() { return slotMinutes; }
    public void setSlotMinutes(int slotMinutes) { this.slotMinutes = slotMinutes; }

    public List<LocalDate> getHolidayDates() { return holidayDates; }
    public void setHolidayDates(List<LocalDate> holidayDates) { this.holidayDates = holidayDates; }

    public List<MaintenanceBlockRequest> getMaintenanceBlocks() { return maintenanceBlocks; }
    public void setMaintenanceBlocks(List<MaintenanceBlockRequest> maintenanceBlocks) { this.maintenanceBlocks = maintenanceBlocks; }

    public static class MaintenanceBlockRequest {
        @NotNull(message = "Maintenance date is required")
        private LocalDate date;

        @NotNull(message = "Maintenance start time is required")
        private LocalTime startTime;

        @NotNull(message = "Maintenance end time is required")
        private LocalTime endTime;

        public LocalDate getDate() { return date; }
        public void setDate(LocalDate date) { this.date = date; }

        public LocalTime getStartTime() { return startTime; }
        public void setStartTime(LocalTime startTime) { this.startTime = startTime; }

        public LocalTime getEndTime() { return endTime; }
        public void setEndTime(LocalTime endTime) { this.endTime = endTime; }
    }
}
