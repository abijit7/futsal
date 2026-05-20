package com.futsal;

import com.futsal.model.Futsal;
import com.futsal.model.TimeSlot;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

public class ModelSmokeTest {

    @Test
    void canCreateFutsalAndSlot() {
        Futsal futsal = new Futsal("Kick Arena", "Baneshwor", "Kathmandu", "9812345678", new BigDecimal("1500.00"), LocalTime.of(6, 0), "Indoor turf");
        TimeSlot slot = new TimeSlot();
        slot.setFutsal(futsal);
        slot.setSlotDate(LocalDate.now().plusDays(1));
        slot.setStartTime(LocalTime.of(18, 0));
        slot.setEndTime(LocalTime.of(19, 0));

        assertNotNull(slot.getFutsal());
        assertEquals("Kick Arena", slot.getFutsal().getName());
    }
}
