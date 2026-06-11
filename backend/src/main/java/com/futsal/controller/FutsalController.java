package com.futsal.controller;

import com.futsal.model.Futsal;
import com.futsal.service.FutsalService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.futsal.dto.DtoMapper;
import com.futsal.dto.FutsalRequest;
import com.futsal.dto.FutsalResponse;
import com.futsal.dto.PagedResponse;
import com.futsal.security.AuthForbiddenException;
import com.futsal.security.AuthRequiredException;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/futsals")
public class FutsalController {

    @Autowired
    private FutsalService futsalService;

    @GetMapping
    public ResponseEntity<PagedResponse<FutsalResponse>> getAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "recommended") String sort
    ) {
        Pageable pageable = PageRequest.of(page, size);
        Page<FutsalResponse> result = futsalService.getAll(q, sort, pageable).map(DtoMapper::toFutsalResponse);
        return ResponseEntity.ok(PagedResponse.fromPage(result));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(DtoMapper.toFutsalResponse(futsalService.getById(id)));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(errorMap(e.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<?> add(@Valid @RequestBody FutsalRequest futsal) {
        try {
            Futsal entity = new Futsal();
            entity.setName(futsal.getName());
            entity.setAddress(futsal.getAddress());
            entity.setCity(futsal.getCity());
            entity.setPhone(futsal.getPhone());
            entity.setHourlyPrice(futsal.getHourlyPrice());
            entity.setOpeningTime(futsal.getOpeningTime());
            entity.setClosingTime(futsal.getClosingTime());
            entity.setImageUrl(futsal.getImageUrl());
            entity.setImageUrls(futsal.getImageUrls());
            entity.setVerified(futsal.isVerified());
            entity.setCourtType(futsal.getCourtType());
            entity.setRating(futsal.getRating());
            entity.setReviewCount(futsal.getReviewCount());
            entity.setDescription(futsal.getDescription());
            return ResponseEntity.ok(DtoMapper.toFutsalResponse(futsalService.add(entity)));
        } catch (RuntimeException e) {
            return toErrorResponse(e);
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @Valid @RequestBody FutsalRequest futsal) {
        try {
            Futsal entity = new Futsal();
            entity.setName(futsal.getName());
            entity.setAddress(futsal.getAddress());
            entity.setCity(futsal.getCity());
            entity.setPhone(futsal.getPhone());
            entity.setHourlyPrice(futsal.getHourlyPrice());
            entity.setOpeningTime(futsal.getOpeningTime());
            entity.setClosingTime(futsal.getClosingTime());
            entity.setImageUrl(futsal.getImageUrl());
            entity.setImageUrls(futsal.getImageUrls());
            entity.setVerified(futsal.isVerified());
            entity.setCourtType(futsal.getCourtType());
            entity.setRating(futsal.getRating());
            entity.setReviewCount(futsal.getReviewCount());
            entity.setDescription(futsal.getDescription());
            return ResponseEntity.ok(DtoMapper.toFutsalResponse(futsalService.update(id, entity)));
        } catch (RuntimeException e) {
            return toErrorResponse(e);
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
            return toErrorResponse(e);
        }
    }

    private Map<String, String> errorMap(String message) {
        Map<String, String> map = new HashMap<>();
        map.put("error", message);
        return map;
    }

    private ResponseEntity<?> toErrorResponse(RuntimeException e) {
        if (e instanceof AuthForbiddenException) {
            return ResponseEntity.status(403).body(errorMap(e.getMessage()));
        }
        if (e instanceof AuthRequiredException) {
            return ResponseEntity.status(401).body(errorMap(e.getMessage()));
        }
        return ResponseEntity.badRequest().body(errorMap(e.getMessage()));
    }
}
