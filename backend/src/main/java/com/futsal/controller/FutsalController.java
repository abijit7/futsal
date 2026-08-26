package com.futsal.controller;

import com.futsal.model.Futsal;
import com.futsal.service.FutsalService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.futsal.dto.DtoMapper;
import com.futsal.dto.FutsalRequest;
import com.futsal.dto.FutsalResponse;
import com.futsal.dto.PagedResponse;

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
        Pageable pageable = PageRequestFactory.create(page, size);
        Page<FutsalResponse> result = futsalService.getAll(q, sort, pageable).map(DtoMapper::toFutsalResponse);
        return ResponseEntity.ok(PagedResponse.fromPage(result));
    }

    @GetMapping("/{id}")
    public ResponseEntity<FutsalResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(DtoMapper.toFutsalResponse(futsalService.getById(id)));
    }

    @PostMapping
    public ResponseEntity<FutsalResponse> add(@Valid @RequestBody FutsalRequest futsal) {
        Futsal entity = DtoMapper.toFutsal(futsal);
        return ResponseEntity.ok(DtoMapper.toFutsalResponse(futsalService.add(entity)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<FutsalResponse> update(@PathVariable Long id, @Valid @RequestBody FutsalRequest futsal) {
        Futsal entity = DtoMapper.toFutsal(futsal);
        return ResponseEntity.ok(DtoMapper.toFutsalResponse(futsalService.update(id, entity)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> delete(@PathVariable Long id) {
        futsalService.delete(id);
        Map<String, String> res = new HashMap<>();
        res.put("message", "Futsal deleted successfully");
        return ResponseEntity.ok(res);
    }
}
