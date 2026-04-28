package com.futsal.service;

import com.futsal.model.TimeSlot;
import com.futsal.repository.TimeSlotRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
public class TimeSlotService {

    @Autowired
    private TimeSlotRepository timeSlotRepository;

    // ── Get all available slots (from today onwards) ──────────────────────────
    public List<TimeSlot> getAvailableSlots() {
        return timeSlotRepository
                .findBySlotDateGreaterThanEqualOrderBySlotDateAscStartTimeAsc(LocalDate.now())
                .stream()
                .filter(TimeSlot::isAvailable)
                .toList();
    }

    // ── Get all slots (admin view) ────────────────────────────────────────────
    public List<TimeSlot> getAllSlots() {
        return timeSlotRepository
                .findBySlotDateGreaterThanEqualOrderBySlotDateAscStartTimeAsc(LocalDate.now());
    }

    // ── Get slot by ID ────────────────────────────────────────────────────────
    public TimeSlot getSlotById(Long id) {
        return timeSlotRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Slot not found with ID: " + id));
    }

    // ── Add new slot (admin) ──────────────────────────────────────────────────
    public TimeSlot addSlot(TimeSlot slot) {
        LocalDate today = LocalDate.now();
        if (slot.getSlotDate().isBefore(today)) {
            throw new RuntimeException("Cannot add slots for past dates.");
        }
        if (slot.getSlotDate().isEqual(today)) {
            java.time.LocalTime now = java.time.LocalTime.now();
            if (slot.getStartTime().isBefore(now)) {
                throw new RuntimeException("Cannot add slots for times that have already passed today.");
            }
        }
        if (slot.getEndTime().isBefore(slot.getStartTime()) ||
            slot.getEndTime().equals(slot.getStartTime())) {
            throw new RuntimeException("End time must be after start time.");
        }
        boolean exists = timeSlotRepository
                .existsBySlotDateAndStartTimeLessThanAndEndTimeGreaterThan(
                        slot.getSlotDate(),
                        slot.getEndTime(),
                        slot.getStartTime()
                );

        if (exists) {
            throw new RuntimeException("Slot overlaps with an existing slot.");
        }
        slot.setAvailable(true);
        return timeSlotRepository.save(slot);
    }

    // ── Update slot (admin) ───────────────────────────────────────────────────
    public TimeSlot updateSlot(Long id, TimeSlot updatedSlot) {
        TimeSlot existing = getSlotById(id);
        existing.setSlotDate(updatedSlot.getSlotDate());
        existing.setStartTime(updatedSlot.getStartTime());
        existing.setEndTime(updatedSlot.getEndTime());
        existing.setPrice(updatedSlot.getPrice());
        existing.setAvailable(updatedSlot.isAvailable());
        return timeSlotRepository.save(existing);
    }

    // ── Delete slot (admin) ───────────────────────────────────────────────────
    public void deleteSlot(Long id) {
        if (!timeSlotRepository.existsById(id)) {
            throw new RuntimeException("Slot not found");
        }
        timeSlotRepository.deleteById(id);
    }
}
