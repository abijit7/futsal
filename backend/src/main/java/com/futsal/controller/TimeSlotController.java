package com.futsal.controller;

import com.futsal.model.TimeSlot;
import com.futsal.service.TimeSlotService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/slots")
@CrossOrigin(origins = "*")
public class TimeSlotController {

    @Autowired
    private TimeSlotService timeSlotService;

    // GET /api/slots — available slots for users
    @GetMapping
    public ResponseEntity<List<TimeSlot>> getAvailableSlots() {
        return ResponseEntity.ok(timeSlotService.getAvailableSlots());
    }

    // GET /api/slots/all — all slots (admin)
    @GetMapping("/all")
    public ResponseEntity<List<TimeSlot>> getAllSlots() {
        return ResponseEntity.ok(timeSlotService.getAllSlots());
    }

    // GET /api/slots/{id}
    @GetMapping("/{id}")
    public ResponseEntity<?> getSlotById(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(timeSlotService.getSlotById(id));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(errorMap(e.getMessage()));
        }
    }

    // POST /api/slots — add slot (admin)
    @PostMapping
    public ResponseEntity<?> addSlot(@Valid @RequestBody TimeSlot slot) {
        try {
            return ResponseEntity.ok(timeSlotService.addSlot(slot));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(errorMap(e.getMessage()));
        }
    }

    // PUT /api/slots/{id} — update slot (admin)
    @PutMapping("/{id}")
    public ResponseEntity<?> updateSlot(@PathVariable Long id, @Valid @RequestBody TimeSlot slot) {
        try {
            return ResponseEntity.ok(timeSlotService.updateSlot(id, slot));
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
