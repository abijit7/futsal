package com.futsal.service;

import com.futsal.dto.SlotGenerationRequest;
import com.futsal.dto.SlotGenerationResponse;
import com.futsal.error.ConflictException;
import com.futsal.error.NotFoundException;
import com.futsal.model.Futsal;
import com.futsal.model.TimeSlot;
import com.futsal.model.TimeSlotStatusHistory;
import com.futsal.repository.BookingRepository;
import com.futsal.repository.FutsalRepository;
import com.futsal.repository.TimeSlotRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.HashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;

@Service
public class TimeSlotService {

    // A null closing time means "no closing-time filter", which the queries test for explicitly.
    // This used to be LocalTime.MAX as a sentinel, and every listing that omitted a futsalId came
    // back empty because of it: 23:59:59.999999999 carries nanoseconds that a MySQL TIME column
    // cannot hold, so the comparison never matched. A null has no value to round.
    private static final LocalTime NO_CLOSING_TIME_FILTER = null;

    @Autowired
    private TimeSlotRepository timeSlotRepository;

    @Autowired
    private FutsalRepository futsalRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private Clock appClock;

    // ── Get all available slots (from today onwards) ─────���────────────────────
    public Page<TimeSlot> getAvailableSlots(Long futsalId, LocalDate slotDate, Pageable pageable) {
        LocalDate today = currentDate();
        LocalTime minStartTime = nextBookableStartTime();

        if (futsalId != null) {
            Futsal futsal = getFutsal(futsalId);
            if (slotDate != null) {
                return timeSlotRepository.findAvailableForFutsalOnDate(
                        futsalId,
                        slotDate,
                        slotDate.equals(today),
                        minStartTime,
                        closingTime(futsal),
                        pageable
                );
            }

            return timeSlotRepository.findAvailableForFutsalAfter(
                    futsalId, today, minStartTime, closingTime(futsal), pageable
            );
        }

        if (slotDate != null) {
            return timeSlotRepository.findAvailableOnDate(
                    slotDate,
                    slotDate.equals(today),
                    minStartTime,
                    NO_CLOSING_TIME_FILTER,
                    pageable
            );
        }

        return timeSlotRepository.findAvailableAfter(today, minStartTime, NO_CLOSING_TIME_FILTER, pageable);
    }

    // ── Public slot grid: available + booked slots for users ──────────────────
    public Page<TimeSlot> getPublicSlots(Long futsalId, LocalDate slotDate, Pageable pageable) {
        LocalDate today = currentDate();
        LocalTime minStartTime = nextBookableStartTime();

        if (futsalId != null) {
            Futsal futsal = getFutsal(futsalId);
            if (slotDate != null) {
                return timeSlotRepository.findPublicForFutsalOnDate(
                        futsalId,
                        slotDate,
                        slotDate.equals(today),
                        minStartTime,
                        closingTime(futsal),
                        pageable
                );
            }

            return timeSlotRepository.findPublicForFutsalAfter(
                    futsalId, today, minStartTime, closingTime(futsal), pageable
            );
        }

        if (slotDate != null) {
            return timeSlotRepository.findPublicOnDate(
                    slotDate,
                    slotDate.equals(today),
                    minStartTime,
                    NO_CLOSING_TIME_FILTER,
                    pageable
            );
        }

        return timeSlotRepository.findPublicAfter(today, minStartTime, NO_CLOSING_TIME_FILTER, pageable);
    }

    // ── Get all slots (admin view) ────────────────────────────────────────────
    public Page<TimeSlot> getAllSlots(Long futsalId, LocalDate slotDate, Pageable pageable) {
        LocalDate today = currentDate();
        if (futsalId != null) {
            if (slotDate != null) {
                return timeSlotRepository.findByFutsal_FutsalIdAndSlotDateOrderBySlotDateAscStartTimeAsc(
                        futsalId, slotDate, pageable
                );
            }
            return timeSlotRepository.findByFutsal_FutsalIdAndSlotDateGreaterThanEqualOrderBySlotDateAscStartTimeAsc(
                    futsalId, today, pageable
            );
        }
        if (slotDate != null) {
            return timeSlotRepository.findBySlotDateOrderBySlotDateAscStartTimeAsc(slotDate, pageable);
        }
        return timeSlotRepository.findBySlotDateGreaterThanEqualOrderBySlotDateAscStartTimeAsc(today, pageable);
    }

    // ── Get slot by ID ────────────────────────────────────────────────────────
    public TimeSlot getSlotById(Long id) {
        return timeSlotRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Slot not found with ID: " + id));
    }

    // ── Add new slot (admin) ──────────────────────────────────────────────────
    public TimeSlot addSlot(TimeSlot slot, Long futsalId) {
        Futsal futsal = getFutsal(futsalId);
        slot.setFutsal(futsal);

        LocalDate today = currentDate();
        if (slot.getSlotDate().isBefore(today)) {
            throw new IllegalArgumentException("Cannot add slots for past dates.");
        }
        if (slot.getSlotDate().isEqual(today)) {
            LocalTime now = currentTime();
            if (slot.getStartTime().isBefore(now)) {
                throw new IllegalArgumentException("Cannot add slots for times that have already passed today.");
            }
        }
        validateSlotWindow(slot.getStartTime(), slot.getEndTime(), futsal);
        boolean exactExists = timeSlotRepository
                .existsByFutsalAndSlotDateAndStartTimeAndEndTime(
                        futsal,
                        slot.getSlotDate(),
                        slot.getStartTime(),
                        slot.getEndTime()
                );
        if (exactExists) {
            throw new ConflictException("Slot with this exact time already exists for this futsal.");
        }
        boolean overlaps = timeSlotRepository
                .existsByFutsalAndSlotDateAndStartTimeLessThanAndEndTimeGreaterThan(
                        futsal,
                        slot.getSlotDate(),
                        slot.getEndTime(),
                        slot.getStartTime()
                );

        if (overlaps) {
            throw new ConflictException("Slot overlaps with an existing slot for this futsal.");
        }
        slot.setAvailable(true);
        slot.addStatusHistory(new TimeSlotStatusHistory(slot, true, "admin", "Slot created"));
        return timeSlotRepository.save(slot);
    }

    // ── Update slot (admin) ───────────────────────────────────────────────────
    @Transactional
    public TimeSlot updateSlot(Long id, TimeSlot updatedSlot, Long futsalId, Boolean requestedAvailable) {
        TimeSlot existing = timeSlotRepository.findByIdForUpdate(id)
                .orElseThrow(() -> new NotFoundException("Slot not found with ID: " + id));
        Futsal futsal = getFutsal(futsalId);

        LocalDate today = currentDate();
        if (updatedSlot.getSlotDate().isBefore(today)) {
            throw new IllegalArgumentException("Cannot set slots for past dates.");
        }
        if (updatedSlot.getSlotDate().isEqual(today)) {
            LocalTime now = currentTime();
            if (updatedSlot.getStartTime().isBefore(now)) {
                throw new IllegalArgumentException("Cannot set slots for times that have already passed today.");
            }
        }
        validateSlotWindow(updatedSlot.getStartTime(), updatedSlot.getEndTime(), futsal);

        boolean hasActiveBooking = bookingRepository.existsByTimeSlotAndStatusNotIn(existing, BookingService.CLOSED_STATUSES);
        if (hasActiveBooking && slotDetailsChanged(existing, updatedSlot, futsal)) {
            throw new ConflictException("Cannot edit date, time, or futsal for a slot with an active booking.");
        }
        if (hasActiveBooking && Boolean.TRUE.equals(requestedAvailable)) {
            throw new ConflictException("Cannot mark a slot with an active booking as available.");
        }

        boolean previousAvailable = existing.isAvailable();

        existing.setFutsal(futsal);
        existing.setSlotDate(updatedSlot.getSlotDate());
        existing.setStartTime(updatedSlot.getStartTime());
        existing.setEndTime(updatedSlot.getEndTime());
        if (requestedAvailable != null) {
            existing.setAvailable(requestedAvailable);
        }
        if (hasActiveBooking && existing.isAvailable()) {
            existing.setAvailable(false);
        }

        boolean overlaps = timeSlotRepository
                .existsByFutsalAndSlotDateAndStartTimeLessThanAndEndTimeGreaterThanAndSlotIdNot(
                        futsal,
                        existing.getSlotDate(),
                        existing.getEndTime(),
                        existing.getStartTime(),
                        existing.getSlotId()
                );
        if (overlaps) {
            throw new ConflictException("Slot overlaps with an existing slot for this futsal.");
        }

        boolean exactExists = timeSlotRepository
                .existsByFutsalAndSlotDateAndStartTimeAndEndTimeAndSlotIdNot(
                        futsal,
                        existing.getSlotDate(),
                        existing.getStartTime(),
                        existing.getEndTime(),
                        existing.getSlotId()
                );
        if (exactExists) {
            throw new ConflictException("Slot with this exact time already exists for this futsal.");
        }

        if (previousAvailable != existing.isAvailable()) {
            String note = existing.isAvailable() ? "Slot marked available" : "Slot marked unavailable";
            existing.addStatusHistory(new TimeSlotStatusHistory(existing, existing.isAvailable(), "admin", note));
        }

        return timeSlotRepository.save(existing);
    }

    // ── Delete slot (admin) ───────────────────────────────────────────────────
    @Transactional
    public void deleteSlot(Long id) {
        TimeSlot slot = timeSlotRepository.findByIdForUpdate(id)
                .orElseThrow(() -> new NotFoundException("Slot not found"));
        if (bookingRepository.existsByTimeSlotAndStatusNotIn(slot, BookingService.CLOSED_STATUSES)) {
            throw new ConflictException("Cannot delete a slot with active bookings.");
        }
        if (bookingRepository.existsByTimeSlot(slot)) {
            throw new ConflictException("Cannot delete a slot with booking history. Add an archive flow before deleting historical slots.");
        }
        timeSlotRepository.delete(slot);
    }

    @Transactional
    public SlotGenerationResponse generateSlots(SlotGenerationRequest request) {
        Futsal futsal = getFutsal(request.getFutsalId());
        validateGenerationRequest(request, futsal);

        Set<LocalDate> holidays = request.getHolidayDates() == null
                ? Set.of()
                : new HashSet<>(request.getHolidayDates());
        List<SlotGenerationRequest.MaintenanceBlockRequest> maintenanceBlocks =
                request.getMaintenanceBlocks() == null ? List.of() : request.getMaintenanceBlocks();

        LocalTime dailyStart = request.getStartTime() == null ? futsal.getOpeningTime() : request.getStartTime();
        LocalTime dailyEnd = request.getEndTime() == null ? closingTime(futsal) : request.getEndTime();
        int created = 0;
        int skippedExisting = 0;
        int skippedBlocked = 0;

        for (LocalDate date = request.getStartDate(); !date.isAfter(request.getEndDate()); date = date.plusDays(1)) {
            if (holidays.contains(date)) {
                skippedBlocked += slotsInWindow(dailyStart, dailyEnd, request.getSlotMinutes());
                continue;
            }

            for (LocalTime start = dailyStart; start.plusMinutes(request.getSlotMinutes()).compareTo(dailyEnd) <= 0; start = start.plusMinutes(request.getSlotMinutes())) {
                LocalTime end = start.plusMinutes(request.getSlotMinutes());
                if (date.equals(currentDate()) && start.isBefore(nextBookableStartTime())) {
                    skippedBlocked++;
                    continue;
                }
                if (overlapsMaintenance(date, start, end, maintenanceBlocks)) {
                    skippedBlocked++;
                    continue;
                }
                boolean exactExists = timeSlotRepository
                        .existsByFutsalAndSlotDateAndStartTimeAndEndTime(
                                futsal,
                                date,
                                start,
                                end
                        );
                if (exactExists) {
                    skippedExisting++;
                    continue;
                }
                boolean overlaps = timeSlotRepository
                        .existsByFutsalAndSlotDateAndStartTimeLessThanAndEndTimeGreaterThan(
                                futsal,
                                date,
                                end,
                                start
                        );
                if (overlaps) {
                    skippedExisting++;
                    continue;
                }

                TimeSlot slot = new TimeSlot();
                slot.setFutsal(futsal);
                slot.setSlotDate(date);
                slot.setStartTime(start);
                slot.setEndTime(end);
                slot.setAvailable(true);
                slot.addStatusHistory(new TimeSlotStatusHistory(slot, true, "admin", "Bulk generated slot"));
                timeSlotRepository.save(slot);
                created++;
            }
        }

        return new SlotGenerationResponse(created, skippedExisting, skippedBlocked);
    }

    private boolean slotDetailsChanged(TimeSlot existing, TimeSlot updatedSlot, Futsal futsal) {
        return !Objects.equals(existing.getFutsal().getFutsalId(), futsal.getFutsalId())
                || !Objects.equals(existing.getSlotDate(), updatedSlot.getSlotDate())
                || !Objects.equals(existing.getStartTime(), updatedSlot.getStartTime())
                || !Objects.equals(existing.getEndTime(), updatedSlot.getEndTime());
    }

    private Futsal getFutsal(Long futsalId) {
        return futsalRepository.findById(futsalId)
                .orElseThrow(() -> new NotFoundException("Futsal not found"));
    }

    private LocalDate currentDate() {
        return LocalDate.now(appClock);
    }

    private LocalTime currentTime() {
        return LocalTime.now(appClock);
    }

    private LocalTime nextBookableStartTime() {
        LocalTime now = currentTime();
        return now.getMinute() == 0 && now.getSecond() == 0 && now.getNano() == 0
                ? now
                : now.plusHours(1).withMinute(0).withSecond(0).withNano(0);
    }

    private void validateSlotWindow(LocalTime startTime, LocalTime endTime, Futsal futsal) {
        if (endTime.isBefore(startTime) || endTime.equals(startTime)) {
            throw new IllegalArgumentException("End time must be after start time.");
        }
        if (futsal.getOpeningTime() != null && startTime.isBefore(futsal.getOpeningTime())) {
            throw new IllegalArgumentException("Slot starts before the futsal opening time.");
        }
        if (endTime.isAfter(closingTime(futsal))) {
            throw new IllegalArgumentException("Slot ends after the futsal closing time.");
        }
    }

    private void validateGenerationRequest(SlotGenerationRequest request, Futsal futsal) {
        if (futsal.getHourlyPrice() == null || futsal.getHourlyPrice().signum() <= 0) {
            throw new IllegalArgumentException("Set a positive hourly price for this futsal before generating slots.");
        }
        if (futsal.getOpeningTime() == null) {
            throw new IllegalArgumentException("Set opening and closing times for this futsal before generating slots.");
        }
        if (request.getStartDate().isAfter(request.getEndDate())) {
            throw new IllegalArgumentException("Generation end date must be on or after start date.");
        }
        if (request.getStartDate().isBefore(currentDate())) {
            throw new IllegalArgumentException("Cannot generate slots for past dates.");
        }
        LocalTime start = request.getStartTime() == null ? futsal.getOpeningTime() : request.getStartTime();
        LocalTime end = request.getEndTime() == null ? closingTime(futsal) : request.getEndTime();
        validateSlotWindow(start, end, futsal);
        if (Duration.between(start, end).toMinutes() < request.getSlotMinutes()) {
            throw new IllegalArgumentException("Generation window is shorter than the slot duration.");
        }
        if (request.getMaintenanceBlocks() != null) {
            for (SlotGenerationRequest.MaintenanceBlockRequest block : request.getMaintenanceBlocks()) {
                if (block.getEndTime().compareTo(block.getStartTime()) <= 0) {
                    throw new IllegalArgumentException("Maintenance end time must be after start time.");
                }
                if (block.getDate().isBefore(request.getStartDate()) || block.getDate().isAfter(request.getEndDate())) {
                    throw new IllegalArgumentException("Maintenance blocks must be within the generation date range.");
                }
            }
        }
    }

    private boolean overlapsMaintenance(
            LocalDate date,
            LocalTime start,
            LocalTime end,
            List<SlotGenerationRequest.MaintenanceBlockRequest> maintenanceBlocks
    ) {
        return maintenanceBlocks.stream().anyMatch(block ->
                date.equals(block.getDate())
                        && start.isBefore(block.getEndTime())
                        && end.isAfter(block.getStartTime())
        );
    }

    private int slotsInWindow(LocalTime start, LocalTime end, int slotMinutes) {
        return (int) (Duration.between(start, end).toMinutes() / slotMinutes);
    }

    private LocalTime closingTime(Futsal futsal) {
        return futsal.getClosingTime() == null ? LocalTime.of(23, 0) : futsal.getClosingTime();
    }
}
