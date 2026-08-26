package com.futsal.service;

import com.futsal.dto.SlotGenerationRequest;
import com.futsal.dto.SlotGenerationResponse;
import com.futsal.model.Futsal;
import com.futsal.model.TimeSlot;
import com.futsal.repository.BookingRepository;
import com.futsal.repository.FutsalRepository;
import com.futsal.repository.TimeSlotRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.lang.reflect.InvocationHandler;
import java.lang.reflect.Proxy;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;

class TimeSlotServiceTest {

    private TimeSlotService service;
    private final LocalDate tomorrow = LocalDate.of(2026, 6, 15);
    private final List<TimeSlot> savedSlots = new ArrayList<>();
    private boolean slotDeleted;

    @BeforeEach
    void setUp() {
        service = new TimeSlotService();
        savedSlots.clear();
        slotDeleted = false;
        Clock fixedClock = Clock.fixed(Instant.parse("2026-06-14T04:15:00Z"), ZoneId.of("Asia/Kathmandu"));
        ReflectionTestUtils.setField(service, "appClock", fixedClock);
    }

    @Test
    void addSlotRejectsWindowsOutsideVenueHours() {
        Futsal futsal = futsal();
        TimeSlot tooEarly = slot(tomorrow, LocalTime.of(5, 30), LocalTime.of(6, 30), futsal);
        wireRepositories(futsal, null, false, false, List.of());

        RuntimeException error = assertThrows(RuntimeException.class, () -> service.addSlot(tooEarly, 7L));

        assertEquals("Slot starts before the futsal opening time.", error.getMessage());
        assertEquals(0, savedSlots.size());
    }

    @Test
    void updateSlotRejectsDetailChangesWhenSlotHasActiveBooking() {
        Futsal futsal = futsal();
        TimeSlot existing = slot(tomorrow, LocalTime.of(10, 0), LocalTime.of(11, 0), futsal);
        existing.setSlotId(20L);
        TimeSlot update = slot(tomorrow, LocalTime.of(11, 0), LocalTime.of(12, 0), futsal);
        wireRepositories(futsal, existing, true, false, List.of());

        RuntimeException error = assertThrows(RuntimeException.class, () -> service.updateSlot(20L, update, 7L, null));

        assertEquals("Cannot edit date, time, or futsal for a slot with an active booking.", error.getMessage());
        assertEquals(0, savedSlots.size());
    }

    @Test
    void deleteSlotRejectsHistoricalBookingsEvenWhenClosed() {
        Futsal futsal = futsal();
        TimeSlot existing = slot(tomorrow, LocalTime.of(10, 0), LocalTime.of(11, 0), futsal);
        existing.setSlotId(20L);
        wireRepositories(futsal, existing, false, true, List.of());

        RuntimeException error = assertThrows(RuntimeException.class, () -> service.deleteSlot(20L));

        assertEquals("Cannot delete a slot with booking history. Add an archive flow before deleting historical slots.", error.getMessage());
        assertFalse(slotDeleted);
    }

    @Test
    void generateSlotsSkipsHolidaysMaintenanceAndExistingSlots() {
        Futsal futsal = futsal();
        wireRepositories(futsal, null, false, false, List.of(LocalTime.of(12, 0)));

        SlotGenerationRequest request = new SlotGenerationRequest();
        request.setFutsalId(7L);
        request.setStartDate(tomorrow);
        request.setEndDate(tomorrow.plusDays(1));
        request.setStartTime(LocalTime.of(10, 0));
        request.setEndTime(LocalTime.of(13, 0));
        request.setSlotMinutes(60);
        request.setHolidayDates(List.of(tomorrow.plusDays(1)));
        SlotGenerationRequest.MaintenanceBlockRequest block = new SlotGenerationRequest.MaintenanceBlockRequest();
        block.setDate(tomorrow);
        block.setStartTime(LocalTime.of(11, 0));
        block.setEndTime(LocalTime.of(12, 0));
        request.setMaintenanceBlocks(List.of(block));

        SlotGenerationResponse response = service.generateSlots(request);

        assertEquals(1, response.getCreated());
        assertEquals(1, response.getSkippedExisting());
        assertEquals(4, response.getSkippedBlocked());
        assertEquals(1, savedSlots.size());
        assertEquals(LocalTime.of(10, 0), savedSlots.get(0).getStartTime());
        assertEquals(LocalTime.of(11, 0), savedSlots.get(0).getEndTime());
    }

    private void wireRepositories(
            Futsal futsal,
            TimeSlot existingSlot,
            boolean hasActiveBooking,
            boolean hasAnyBooking,
            List<LocalTime> existingStarts
    ) {
        FutsalRepository futsalRepository = proxy(FutsalRepository.class, (proxy, method, args) -> {
            if ("findById".equals(method.getName())) {
                return Optional.of(futsal);
            }
            return unsupported(method.getName());
        });

        TimeSlotRepository timeSlotRepository = proxy(TimeSlotRepository.class, (proxy, method, args) -> {
            return switch (method.getName()) {
                case "findById", "findByIdForUpdate" -> Optional.ofNullable(existingSlot);
                case "save" -> {
                    TimeSlot slot = (TimeSlot) args[0];
                    savedSlots.add(slot);
                    yield slot;
                }
                case "delete" -> {
                    slotDeleted = true;
                    yield null;
                }
                case "existsByFutsalAndSlotDateAndStartTimeLessThanAndEndTimeGreaterThan" ->
                        existingStarts.contains((LocalTime) args[3]);
                case "existsByFutsalAndSlotDateAndStartTimeLessThanAndEndTimeGreaterThanAndSlotIdNot" -> false;
                default -> unsupported(method.getName());
            };
        });

        BookingRepository bookingRepository = proxy(BookingRepository.class, (proxy, method, args) -> {
            return switch (method.getName()) {
                case "existsByTimeSlotAndStatusNotIn" -> hasActiveBooking;
                case "existsByTimeSlot" -> hasAnyBooking;
                default -> unsupported(method.getName());
            };
        });

        ReflectionTestUtils.setField(service, "futsalRepository", futsalRepository);
        ReflectionTestUtils.setField(service, "timeSlotRepository", timeSlotRepository);
        ReflectionTestUtils.setField(service, "bookingRepository", bookingRepository);
    }

    @SuppressWarnings("unchecked")
    private <T> T proxy(Class<T> type, InvocationHandler handler) {
        return (T) Proxy.newProxyInstance(
                type.getClassLoader(),
                new Class<?>[]{type},
                (proxy, method, args) -> {
                    if ("toString".equals(method.getName())) {
                        return type.getSimpleName() + "Proxy";
                    }
                    if ("hashCode".equals(method.getName())) {
                        return System.identityHashCode(proxy);
                    }
                    if ("equals".equals(method.getName())) {
                        return proxy == args[0];
                    }
                    return handler.invoke(proxy, method, args);
                }
        );
    }

    private Object unsupported(String methodName) {
        throw new UnsupportedOperationException(methodName);
    }

    private Futsal futsal() {
        Futsal futsal = new Futsal("Prime Arena", "Mid Baneshwor", "Kathmandu", "9812345678", new BigDecimal("1800"), LocalTime.of(6, 0), null, "Indoor");
        futsal.setFutsalId(7L);
        futsal.setClosingTime(LocalTime.of(22, 0));
        return futsal;
    }

    private TimeSlot slot(LocalDate date, LocalTime start, LocalTime end, Futsal futsal) {
        TimeSlot slot = new TimeSlot();
        slot.setFutsal(futsal);
        slot.setSlotDate(date);
        slot.setStartTime(start);
        slot.setEndTime(end);
        slot.setAvailable(true);
        return slot;
    }
}
