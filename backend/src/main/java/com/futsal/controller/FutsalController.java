package com.futsal.controller;

import com.futsal.model.Futsal;
import com.futsal.service.FutsalService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/futsals")
@CrossOrigin(origins = "*")
public class FutsalController {

    @Autowired
    private FutsalService futsalService;

    @GetMapping
    public ResponseEntity<List<Futsal>> getAll() {
        return ResponseEntity.ok(futsalService.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(futsalService.getById(id));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(errorMap(e.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<?> add(@Valid @RequestBody Futsal futsal) {
        try {
            return ResponseEntity.ok(futsalService.add(futsal));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(errorMap(e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @Valid @RequestBody Futsal futsal) {
        try {
            return ResponseEntity.ok(futsalService.update(id, futsal));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(errorMap(e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        try {
            futsalService.delete(id);
            Map<String, String> res = new HashMap<>();
            res.put("message", "Futsal deleted successfully");
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

