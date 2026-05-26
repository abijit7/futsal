package com.futsal.controller;

import com.futsal.dto.DtoMapper;
import com.futsal.dto.SlotRequest;
import com.futsal.model.TimeSlot;
import com.futsal.service.TimeSlotService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
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
@CrossOrigin(origins = "*")
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
        Pageable pageable = PageRequest.of(page, size);
        Page<TimeSlotResponse> result = timeSlotService.getAvailableSlots(futsalId, slotDate, pageable)
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
        Pageable pageable = PageRequest.of(page, size);
        Page<TimeSlotResponse> result = timeSlotService.getAllSlots(futsalId, slotDate, pageable)
                .map(DtoMapper::toTimeSlotResponse);
        return ResponseEntity.ok(PagedResponse.fromPage(result));
    }

    // GET /api/slots/{id}
    @GetMapping("/{id}")
    public ResponseEntity<?> getSlotById(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(DtoMapper.toTimeSlotResponse(timeSlotService.getSlotById(id)));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(errorMap(e.getMessage()));
        }
    }

    // POST /api/slots — add slot (admin)
    @PostMapping
    public ResponseEntity<?> addSlot(@Valid @RequestBody SlotRequest req) {
        try {
            TimeSlot slot = new TimeSlot();
            slot.setSlotDate(req.getSlotDate());
            slot.setStartTime(req.getStartTime());
            slot.setEndTime(req.getEndTime());
            if (req.getAvailable() != null) {
                slot.setAvailable(req.getAvailable());
            }
            return ResponseEntity.ok(DtoMapper.toTimeSlotResponse(timeSlotService.addSlot(slot, req.getFutsalId())));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(errorMap(e.getMessage()));
        }
    }

    // PUT /api/slots/{id} — update slot (admin)
    @PutMapping("/{id}")
    public ResponseEntity<?> updateSlot(@PathVariable Long id, @Valid @RequestBody SlotRequest req) {
        try {
            TimeSlot slot = new TimeSlot();
            slot.setSlotDate(req.getSlotDate());
            slot.setStartTime(req.getStartTime());
            slot.setEndTime(req.getEndTime());
            slot.setAvailable(req.getAvailable() != null && req.getAvailable());
            return ResponseEntity.ok(DtoMapper.toTimeSlotResponse(timeSlotService.updateSlot(id, slot, req.getFutsalId())));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(errorMap(e.getMessage()));
        }
    }

    // DELETE /api/slots/{id} — delete slot (admin)
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteSlot(@PathVariable Long id) {
        try {
            timeSlotService.deleteSlot(id);
            Map<String, String> res = new HashMap<>();
            res.put("message", "Slot deleted successfully");
            return ResponseEntity.ok(res);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(errorMap(e.getMessage()));
        }
    }

    private Map<String, String> errorMap(String message) {
        Map<String, String> map = new HashMap<>();
        map.put("error", message);
        return map;
    }
}
