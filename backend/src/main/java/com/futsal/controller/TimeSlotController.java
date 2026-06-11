package com.futsal.controller;

import com.futsal.dto.DtoMapper;
import com.futsal.dto.SlotGenerationRequest;
import com.futsal.dto.SlotGenerationResponse;
import com.futsal.dto.SlotRequest;
import com.futsal.model.TimeSlot;
import com.futsal.service.TimeSlotService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.futsal.dto.PagedResponse;
import com.futsal.dto.TimeSlotResponse;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/slots")
public class TimeSlotController {

    @Autowired
    private TimeSlotService timeSlotService;

    // GET /api/slots — available slots for users
    @GetMapping
    public ResponseEntity<PagedResponse<TimeSlotResponse>> getAvailableSlots(
            @RequestParam(required = false) Long futsalId,
            @RequestParam(required = false) LocalDate slotDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size
    ) {
        Pageable pageable = PageRequestFactory.create(page, size);
        Page<TimeSlotResponse> result = timeSlotService.getAvailableSlots(futsalId, slotDate, pageable)
                .map(DtoMapper::toTimeSlotResponse);
        return ResponseEntity.ok(PagedResponse.fromPage(result));
    }

    // GET /api/slots/public — public slot grid with available and booked states
    @GetMapping("/public")
    public ResponseEntity<PagedResponse<TimeSlotResponse>> getPublicSlots(
            @RequestParam(required = false) Long futsalId,
            @RequestParam(required = false) LocalDate slotDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "48") int size
    ) {
        Pageable pageable = PageRequestFactory.create(page, size);
        Page<TimeSlotResponse> result = timeSlotService.getPublicSlots(futsalId, slotDate, pageable)
                .map(DtoMapper::toTimeSlotResponse);
        return ResponseEntity.ok(PagedResponse.fromPage(result));
    }

    // GET /api/slots/all — all slots (admin)
    @GetMapping("/all")
    public ResponseEntity<PagedResponse<TimeSlotResponse>> getAllSlots(
            @RequestParam(required = false) Long futsalId,
            @RequestParam(required = false) LocalDate slotDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Pageable pageable = PageRequestFactory.create(page, size);
        Page<TimeSlotResponse> result = timeSlotService.getAllSlots(futsalId, slotDate, pageable)
                .map(DtoMapper::toTimeSlotResponse);
        return ResponseEntity.ok(PagedResponse.fromPage(result));
    }

    // POST /api/slots/generate — bulk-generate slots (admin)
    @PostMapping("/generate")
    public ResponseEntity<SlotGenerationResponse> generateSlots(@Valid @RequestBody SlotGenerationRequest req) {
        SlotGenerationResponse result = timeSlotService.generateSlots(req);
        return ResponseEntity.ok(result);
    }

    // GET /api/slots/{id}
    @GetMapping("/{id}")
    public ResponseEntity<TimeSlotResponse> getSlotById(@PathVariable Long id) {
        return ResponseEntity.ok(DtoMapper.toTimeSlotResponse(timeSlotService.getSlotById(id)));
    }

    // POST /api/slots — add slot (admin)
    @PostMapping
    public ResponseEntity<TimeSlotResponse> addSlot(@Valid @RequestBody SlotRequest req) {
        TimeSlot slot = DtoMapper.toTimeSlot(req);
        return ResponseEntity.ok(DtoMapper.toTimeSlotResponse(timeSlotService.addSlot(slot, req.getFutsalId())));
    }

    // PUT /api/slots/{id} — update slot (admin)
    @PutMapping("/{id}")
    public ResponseEntity<TimeSlotResponse> updateSlot(@PathVariable Long id, @Valid @RequestBody SlotRequest req) {
        TimeSlot slot = DtoMapper.toTimeSlot(req);
        return ResponseEntity.ok(DtoMapper.toTimeSlotResponse(
                timeSlotService.updateSlot(id, slot, req.getFutsalId(), req.getAvailable())
        ));
    }

    // DELETE /api/slots/{id} — delete slot (admin)
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteSlot(@PathVariable Long id) {
        timeSlotService.deleteSlot(id);
        Map<String, String> res = new HashMap<>();
        res.put("message", "Slot deleted successfully");
        return ResponseEntity.ok(res);
    }
}
