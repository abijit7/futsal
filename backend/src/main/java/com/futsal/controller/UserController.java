package com.futsal.controller;

import com.futsal.dto.DtoMapper;
import com.futsal.dto.LoginRequest;
import com.futsal.dto.PagedResponse;
import com.futsal.dto.UserRegisterRequest;
import com.futsal.dto.UserResponse;
import com.futsal.dto.UserUpdateRequest;
import com.futsal.model.User;
import com.futsal.security.JwtService;
import com.futsal.security.SecurityAuth;
import com.futsal.service.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserService userService;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private SecurityAuth securityAuth;

    // POST /api/users/register
    @PostMapping("/register")
    public ResponseEntity<UserResponse> register(@Valid @RequestBody UserRegisterRequest request) {
        User saved = userService.register(DtoMapper.toUser(request));
        return ResponseEntity.ok(DtoMapper.toUserResponse(saved));
    }

    // POST /api/users/login
    @PostMapping("/login")
    public ResponseEntity<UserResponse> login(@Valid @RequestBody LoginRequest credentials) {
        User user = userService.login(credentials.getEmail(), credentials.getPassword());
        UserResponse response = DtoMapper.toUserResponse(user);
        response.setAuthToken(jwtService.createToken(user));
        return ResponseEntity.ok(response);
    }

    // GET /api/users (admin)
    @GetMapping
    public ResponseEntity<PagedResponse<UserResponse>> getAllUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String q
    ) {
        Pageable pageable = PageRequestFactory.create(page, size);
        Page<UserResponse> result = userService.getAllUsers(q, pageable).map(DtoMapper::toUserResponse);
        return ResponseEntity.ok(PagedResponse.fromPage(result));
    }

    // GET /api/users/{id}
    @GetMapping("/{id}")
    public ResponseEntity<UserResponse> getUserById(@PathVariable Long id) {
        securityAuth.requireUserOrAdmin(id);
        return ResponseEntity.ok(DtoMapper.toUserResponse(userService.getUserById(id)));
    }

    // PUT /api/users/{id}
    @PutMapping("/{id}")
    public ResponseEntity<UserResponse> updateUser(@PathVariable Long id, @Valid @RequestBody UserUpdateRequest user) {
        securityAuth.requireUserOrAdmin(id);
        User updated = userService.updateUser(id, user);
        return ResponseEntity.ok(DtoMapper.toUserResponse(updated));
    }

    // DELETE /api/users/{id} (admin)
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.ok(successMap("User deleted successfully"));
    }

    // ── Helper methods ────────────────────────────────────────────────────────
    private Map<String, String> successMap(String message) {
        Map<String, String> map = new HashMap<>();
        map.put("message", message);
        return map;
    }
}
