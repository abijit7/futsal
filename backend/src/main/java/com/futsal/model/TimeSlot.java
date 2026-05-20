package com.futsal.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@Table(name = "time_slots")
public class TimeSlot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long slotId;

    @NotNull(message = "Futsal is required")
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "futsal_id", nullable = false)
    private Futsal futsal;

    @NotNull(message = "Slot date is required")
    @Column(nullable = false)
    private LocalDate slotDate;

    @NotNull(message = "Start time is required")
    @Column(nullable = false)
    private LocalTime startTime;

    @NotNull(message = "End time is required")
    @Column(nullable = false)
    private LocalTime endTime;

    @Column(nullable = false)
    private boolean available = true;

    // ── Constructors ──────────────────────────────────────────
    public TimeSlot() {}

    public TimeSlot(Futsal futsal, LocalDate slotDate, LocalTime startTime, LocalTime endTime) {
        this.futsal = futsal;
        this.slotDate = slotDate;
        this.startTime = startTime;
        this.endTime = endTime;
    }

    // ── Getters & Setters ─────────────────────────────────────
    public Long getSlotId()                    { return slotId; }
    public void setSlotId(Long slotId)         { this.slotId = slotId; }

    public Futsal getFutsal()                  { return futsal; }
    public void setFutsal(Futsal futsal)       { this.futsal = futsal; }

    public LocalDate getSlotDate()             { return slotDate; }
    public void setSlotDate(LocalDate slotDate){ this.slotDate = slotDate; }

    public LocalTime getStartTime()            { return startTime; }
    public void setStartTime(LocalTime t)      { this.startTime = t; }

    public LocalTime getEndTime()              { return endTime; }
    public void setEndTime(LocalTime t)        { this.endTime = t; }

    public boolean isAvailable()               { return available; }
    public void setAvailable(boolean available){ this.available = available; }
}
