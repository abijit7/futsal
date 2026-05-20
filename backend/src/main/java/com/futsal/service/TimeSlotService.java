package com.futsal.service;

import com.futsal.model.Futsal;
import com.futsal.model.TimeSlot;
import com.futsal.repository.FutsalRepository;
import com.futsal.repository.TimeSlotRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Service
public class TimeSlotService {

    private static final LocalTime CLOSING_TIME = LocalTime.of(23, 0);

    @Autowired
    private TimeSlotRepository timeSlotRepository;

    @Autowired
    private FutsalRepository futsalRepository;

    // ── Get all available slots (from today onwards) ─────���────────────────────
    @Transactional
    public List<TimeSlot> getAvailableSlots(Long futsalId) {
        LocalDate today = LocalDate.now();
        LocalTime now = LocalTime.now();
        LocalTime minStartTime = now.getMinute() == 0 && now.getSecond() == 0
                ? now
                : now.plusHours(1).withMinute(0).withSecond(0).withNano(0);

        if (futsalId != null) {
            for (int i = 0; i <= 7; i++) {
                LocalDate date = today.plusDays(i);
                LocalTime minTimeForDate = i == 0 ? minStartTime : LocalTime.MIDNIGHT;
                ensureHourlySlotsForDate(futsalId, date, minTimeForDate);
            }
            return timeSlotRepository
                    .findByFutsal_FutsalIdAndSlotDateGreaterThanEqualAndAvailableTrueOrderBySlotDateAscStartTimeAsc(
                            futsalId, today
                    )
                    .stream()
                    .filter(slot -> {
                        if (slot.getSlotDate().isAfter(today)) {
                            return true;
                        }
                        return !slot.getStartTime().isBefore(minStartTime)
                                && !slot.getEndTime().isAfter(CLOSING_TIME);
                    })
                    .toList();
        }
        return timeSlotRepository
                .findBySlotDateGreaterThanEqualOrderBySlotDateAscStartTimeAsc(today)
                .stream()
                .filter(TimeSlot::isAvailable)
                .filter(slot -> {
                    if (slot.getSlotDate().isAfter(today)) {
                        return true;
                    }
                    return !slot.getStartTime().isBefore(minStartTime)
                            && !slot.getEndTime().isAfter(CLOSING_TIME);
                })
                .toList();
    }

    // ── Get all slots (admin view) ────────────────────────────────────────────
    public List<TimeSlot> getAllSlots(Long futsalId) {
        LocalDate today = LocalDate.now();
        if (futsalId != null) {
            return timeSlotRepository
                    .findByFutsal_FutsalIdAndSlotDateGreaterThanEqualOrderBySlotDateAscStartTimeAsc(
                            futsalId, today
                    );
        }
        return timeSlotRepository
                .findBySlotDateGreaterThanEqualOrderBySlotDateAscStartTimeAsc(today);
    }

    // ── Get slot by ID ────────────────────────────────────────────────────────
    public TimeSlot getSlotById(Long id) {
        return timeSlotRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Slot not found with ID: " + id));
    }

    // ── Add new slot (admin) ──────────────────────────────────────────────────
    public TimeSlot addSlot(TimeSlot slot, Long futsalId) {
        Futsal futsal = futsalRepository.findById(futsalId)
                .orElseThrow(() -> new RuntimeException("Futsal not found"));
        slot.setFutsal(futsal);

        LocalDate today = LocalDate.now();
        if (slot.getSlotDate().isBefore(today)) {
            throw new RuntimeException("Cannot add slots for past dates.");
        }
        if (slot.getSlotDate().isEqual(today)) {
            LocalTime now = LocalTime.now();
            if (slot.getStartTime().isBefore(now)) {
                throw new RuntimeException("Cannot add slots for times that have already passed today.");
            }
        }
        if (slot.getEndTime().isBefore(slot.getStartTime()) ||
            slot.getEndTime().equals(slot.getStartTime())) {
            throw new RuntimeException("End time must be after start time.");
        }
        if (slot.getEndTime().isAfter(CLOSING_TIME)) {
            throw new RuntimeException("Closing time is 11:00 PM.");
        }
        if (futsal.getOpeningTime() != null && slot.getStartTime().isBefore(futsal.getOpeningTime())) {
            throw new RuntimeException("Slot starts before the futsal opening time.");
        }

        boolean exists = timeSlotRepository
                .existsByFutsalAndSlotDateAndStartTimeLessThanAndEndTimeGreaterThan(
                        futsal,
                        slot.getSlotDate(),
                        slot.getEndTime(),
                        slot.getStartTime()
                );

        if (exists) {
            throw new RuntimeException("Slot overlaps with an existing slot for this futsal.");
        }
        slot.setAvailable(true);
        return timeSlotRepository.save(slot);
    }

    // ── Update slot (admin) ───────────────────────────────────────────────────
    public TimeSlot updateSlot(Long id, TimeSlot updatedSlot, Long futsalId) {
        TimeSlot existing = getSlotById(id);
        Futsal futsal = futsalRepository.findById(futsalId)
                .orElseThrow(() -> new RuntimeException("Futsal not found"));

        LocalDate today = LocalDate.now();
        if (updatedSlot.getSlotDate().isBefore(today)) {
            throw new RuntimeException("Cannot set slots for past dates.");
        }
        if (updatedSlot.getSlotDate().isEqual(today)) {
            LocalTime now = LocalTime.now();
            if (updatedSlot.getStartTime().isBefore(now)) {
                throw new RuntimeException("Cannot set slots for times that have already passed today.");
            }
        }
        if (updatedSlot.getEndTime().isBefore(updatedSlot.getStartTime()) ||
            updatedSlot.getEndTime().equals(updatedSlot.getStartTime())) {
            throw new RuntimeException("End time must be after start time.");
        }
        if (updatedSlot.getEndTime().isAfter(CLOSING_TIME)) {
            throw new RuntimeException("Closing time is 11:00 PM.");
        }
        if (futsal.getOpeningTime() != null && updatedSlot.getStartTime().isBefore(futsal.getOpeningTime())) {
            throw new RuntimeException("Slot starts before the futsal opening time.");
        }

        existing.setFutsal(futsal);
        existing.setSlotDate(updatedSlot.getSlotDate());
        existing.setStartTime(updatedSlot.getStartTime());
        existing.setEndTime(updatedSlot.getEndTime());
        existing.setAvailable(updatedSlot.isAvailable());

        boolean exists = timeSlotRepository
                .existsByFutsalAndSlotDateAndStartTimeLessThanAndEndTimeGreaterThanAndSlotIdNot(
                        futsal,
                        existing.getSlotDate(),
                        existing.getEndTime(),
                        existing.getStartTime(),
                        existing.getSlotId()
                );
        if (exists) {
            throw new RuntimeException("Slot overlaps with an existing slot for this futsal.");
        }

        return timeSlotRepository.save(existing);
    }

    // ── Delete slot (admin) ───────────────────────────────────────────────────
    public void deleteSlot(Long id) {
        if (!timeSlotRepository.existsById(id)) {
            throw new RuntimeException("Slot not found");
        }
        timeSlotRepository.deleteById(id);
    }

    private void ensureHourlySlotsForDate(Long futsalId, LocalDate date, LocalTime minStartTime) {
        Futsal futsal = futsalRepository.findById(futsalId)
                .orElseThrow(() -> new RuntimeException("Futsal not found"));
        if (futsal.getHourlyPrice() == null || futsal.getHourlyPrice().signum() <= 0) {
            throw new RuntimeException("Set a positive hourly price for this futsal before generating slots.");
        }
        if (futsal.getOpeningTime() == null) {
            throw new RuntimeException("Set an opening time for this futsal before generating slots.");
        }

        LocalTime openingTime = futsal.getOpeningTime();
        LocalTime start = date.equals(LocalDate.now())
                ? (minStartTime.isAfter(openingTime) ? minStartTime : openingTime)
                : openingTime;
        LocalTime end = CLOSING_TIME;

        List<TimeSlot> existingSlots = timeSlotRepository.findByFutsal_FutsalIdAndSlotDate(futsalId, date);
        java.util.Set<String> existingKeys = existingSlots.stream()
                .map(s -> s.getStartTime() + "|" + s.getEndTime())
                .collect(java.util.stream.Collectors.toSet());

        for (LocalTime t = start; t.isBefore(end); t = t.plusHours(1)) {
            LocalTime slotEnd = t.plusHours(1);
            if (slotEnd.isAfter(end)) {
                break;
            }
            String key = t + "|" + slotEnd;
            if (existingKeys.contains(key)) {
                continue;
            }
            TimeSlot slot = new TimeSlot();
            slot.setFutsal(futsal);
            slot.setSlotDate(date);
            slot.setStartTime(t);
            slot.setEndTime(slotEnd);
            slot.setAvailable(true);
            timeSlotRepository.save(slot);
        }
    }
}
