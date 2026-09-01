package com.futsal.controller;

import com.futsal.dto.SlotGenerationRequest;
import com.futsal.dto.SlotGenerationResponse;
import com.futsal.model.Futsal;
import com.futsal.model.TimeSlot;
import com.futsal.security.SecurityAuth;
import com.futsal.service.TimeSlotService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class TimeSlotControllerIntegrationTest {

    private MockMvc mockMvc;
    private FakeTimeSlotService service;

    @BeforeEach
    void setUp() {
        TimeSlotController controller = new TimeSlotController();
        service = new FakeTimeSlotService();
        ReflectionTestUtils.setField(controller, "timeSlotService", service);
        // Admin authorization is enforced imperatively; this standalone setup has no
        // SecurityContext, so stub the check out and cover it in SecurityRulesTest instead.
        ReflectionTestUtils.setField(controller, "securityAuth", new SecurityAuth() {
            @Override
            public void requireAdmin() {
            }
        });
        mockMvc = MockMvcBuilders.standaloneSetup(controller)
                .setControllerAdvice(new ApiExceptionHandler())
                .build();
    }

    @Test
    void publicSlotEndpointReturnsPagedJson() throws Exception {
        mockMvc.perform(get("/api/slots/public")
                        .param("futsalId", "7")
                        .param("slotDate", "2026-06-15")
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[0].slotId").value(22))
                .andExpect(jsonPath("$.items[0].futsal.name").value("Prime Arena"))
                .andExpect(jsonPath("$.items[0].available").value(true))
                .andExpect(jsonPath("$.page").value(0))
                .andExpect(jsonPath("$.totalItems").value(1));
    }

    @Test
    void oversizedPageRequestsUseGlobalBadRequestHandler() throws Exception {
        mockMvc.perform(get("/api/slots/public").param("size", "201"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Page size cannot exceed 200."));
    }

    @Test
    void generateEndpointAcceptsJsonAndReturnsGenerationCounts() throws Exception {
        mockMvc.perform(post("/api/slots/generate")
                        .contentType("application/json")
                        .content("""
                                {
                                  "futsalId": 7,
                                  "startDate": "2026-06-15",
                                  "endDate": "2026-06-16",
                                  "startTime": "10:00:00",
                                  "endTime": "12:00:00",
                                  "slotMinutes": 60
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.created").value(2))
                .andExpect(jsonPath("$.skippedExisting").value(1))
                .andExpect(jsonPath("$.skippedBlocked").value(0));
    }

    private static class FakeTimeSlotService extends TimeSlotService {
        @Override
        public Page<TimeSlot> getPublicSlots(Long futsalId, LocalDate slotDate, Pageable pageable) {
            Futsal futsal = new Futsal("Prime Arena", "Mid Baneshwor", "Kathmandu", "9812345678", new BigDecimal("1800"), LocalTime.of(6, 0), null, "Indoor");
            futsal.setFutsalId(futsalId);
            TimeSlot slot = new TimeSlot(futsal, slotDate, LocalTime.of(10, 0), LocalTime.of(11, 0));
            slot.setSlotId(22L);
            slot.setAvailable(true);
            return new PageImpl<>(List.of(slot), pageable, 1);
        }

        @Override
        public SlotGenerationResponse generateSlots(SlotGenerationRequest request) {
            return new SlotGenerationResponse(2, 1, 0);
        }
    }
}
