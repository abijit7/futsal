package com.futsal.repository;

import com.futsal.model.Futsal;
import com.futsal.model.TimeSlot;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.TestPropertySource;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;

import static org.junit.jupiter.api.Assertions.assertEquals;

/**
 * Boots the JPA layer so the custom {@code @Query} methods are actually parsed.
 *
 * <p>Every other test in this project mocks its repositories, so a malformed query cannot fail the
 * build - JPQL is only validated when Hibernate builds the entity manager factory. A broken query
 * therefore reached a running application past a fully green suite, surfacing as
 * "required a bean of type 'TimeSlotRepository' that could not be found", which names the symptom
 * and not the cause.
 *
 * <p>The slot queries in particular carry a nullable closing-time filter, and the way that null is
 * expressed is exactly the kind of thing that parses in one Hibernate version and not another. This
 * test exists to make that fail here rather than at startup.
 */
@DataJpaTest
@TestPropertySource(properties = {
        // The application pins the MySQL dialect; the in-memory database needs Hibernate to pick
        // its own. Running this against H2 in MySQL compatibility mode was tried and abandoned -
        // H2's emulation is not faithful enough for Hibernate's MySQL DDL, and making it so would
        // mean Testcontainers and a real MySQL.
        //
        // So be clear about what this covers: the JPQL is parsed and the repository bean is built,
        // which is what catches a malformed query. It does not cover MySQL-specific SQL generation.
        "spring.jpa.database-platform=",
        "spring.jpa.hibernate.ddl-auto=create-drop"
})
class TimeSlotQueryTest {

    @Autowired
    private TimeSlotRepository timeSlotRepository;

    @Autowired
    private FutsalRepository futsalRepository;

    private static final LocalDate TODAY = LocalDate.now();

    private Long futsalId;

    @BeforeEach
    void setUp() {
        Futsal futsal = new Futsal();
        futsal.setName("Query Test Arena");
        futsal.setAddress("Somewhere");
        futsal.setCity("Kathmandu");
        futsal.setPhone("9800000000");
        futsal.setHourlyPrice(new BigDecimal("1000.00"));
        futsal.setOpeningTime(LocalTime.of(6, 0));
        futsal.setClosingTime(LocalTime.of(22, 0));
        futsalId = futsalRepository.save(futsal).getFutsalId();

        // Tomorrow, so "is it today" time filtering never makes the result depend on the clock.
        saveSlot(futsal, TODAY.plusDays(1), LocalTime.of(8, 0), LocalTime.of(9, 0));
        saveSlot(futsal, TODAY.plusDays(1), LocalTime.of(9, 0), LocalTime.of(10, 0));
    }

    private void saveSlot(Futsal futsal, LocalDate date, LocalTime start, LocalTime end) {
        TimeSlot slot = new TimeSlot();
        slot.setFutsal(futsal);
        slot.setSlotDate(date);
        slot.setStartTime(start);
        slot.setEndTime(end);
        slot.setAvailable(true);
        timeSlotRepository.save(slot);
    }

    /**
     * A null closing time must mean "no closing-time filter", not "match nothing". This is the
     * regression: the service passed LocalTime.MAX as a sentinel, whose nanoseconds a MySQL TIME
     * column cannot hold, so every listing that omitted a futsalId came back empty.
     */
    @Test
    void aNullClosingTimeDoesNotFilterAnythingOut() {
        assertEquals(2, timeSlotRepository.findPublicOnDate(
                TODAY.plusDays(1), false, LocalTime.MIDNIGHT, null, PageRequest.of(0, 10))
                .getTotalElements());

        assertEquals(2, timeSlotRepository.findAvailableOnDate(
                TODAY.plusDays(1), false, LocalTime.MIDNIGHT, null, PageRequest.of(0, 10))
                .getTotalElements());

        assertEquals(2, timeSlotRepository.findPublicAfter(
                TODAY, LocalTime.MIDNIGHT, null, PageRequest.of(0, 10))
                .getTotalElements());

        assertEquals(2, timeSlotRepository.findAvailableAfter(
                TODAY, LocalTime.MIDNIGHT, null, PageRequest.of(0, 10))
                .getTotalElements());
    }

    /** A real closing time still excludes anything finishing after it. */
    @Test
    void aClosingTimeStillExcludesLaterSlots() {
        assertEquals(1, timeSlotRepository.findPublicOnDate(
                TODAY.plusDays(1), false, LocalTime.MIDNIGHT, LocalTime.of(9, 0), PageRequest.of(0, 10))
                .getTotalElements());

        assertEquals(1, timeSlotRepository.findPublicForFutsalOnDate(
                futsalId, TODAY.plusDays(1), false, LocalTime.MIDNIGHT, LocalTime.of(9, 0),
                PageRequest.of(0, 10))
                .getTotalElements());
    }

    /** The per-venue variants take the same filter and must agree with the global ones. */
    @Test
    void theVenueScopedQueriesBehaveTheSameWay() {
        assertEquals(2, timeSlotRepository.findPublicForFutsalOnDate(
                futsalId, TODAY.plusDays(1), false, LocalTime.MIDNIGHT, null, PageRequest.of(0, 10))
                .getTotalElements());

        assertEquals(2, timeSlotRepository.findAvailableForFutsalAfter(
                futsalId, TODAY, LocalTime.MIDNIGHT, null, PageRequest.of(0, 10))
                .getTotalElements());
    }
}
