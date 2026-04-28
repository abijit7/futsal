package com.futsal.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@Table(name = "time_slots")
public class TimeSlot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long slotId;

    @NotNull(message = "Slot date is required")
    @Column(nullable = false)
    private LocalDate slotDate;

    @NotNull(message = "Start time is required")
    @Column(nullable = false)
    private LocalTime startTime;

    @NotNull(message = "End time is required")
    @Column(nullable = false)
    private LocalTime endTime;

    @NotNull(message = "Price is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Price must be positive")
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    @Column(nullable = false)
    private boolean available = true;

    // ── Constructors ──────────────────────────────────────────
    public TimeSlot() {}

    public TimeSlot(LocalDate slotDate, LocalTime startTime, LocalTime endTime, BigDecimal price) {
        this.slotDate = slotDate;
        this.startTime = startTime;
        this.endTime = endTime;
        this.price = price;
    }

    // ── Getters & Setters ─────────────────────────────────────
    public Long getSlotId()                    { return slotId; }
    public void setSlotId(Long slotId)         { this.slotId = slotId; }

    public LocalDate getSlotDate()             { return slotDate; }
    public void setSlotDate(LocalDate slotDate){ this.slotDate = slotDate; }

    public LocalTime getStartTime()            { return startTime; }
    public void setStartTime(LocalTime t)      { this.startTime = t; }

    public LocalTime getEndTime()              { return endTime; }
    public void setEndTime(LocalTime t)        { this.endTime = t; }

    public BigDecimal getPrice()               { return price; }
    public void setPrice(BigDecimal price)     { this.price = price; }

    public boolean isAvailable()               { return available; }
    public void setAvailable(boolean available){ this.available = available; }
}
