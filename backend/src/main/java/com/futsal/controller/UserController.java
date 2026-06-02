package com.futsal.controller;

import com.futsal.dto.DtoMapper;
import com.futsal.dto.LoginRequest;
import com.futsal.dto.PagedResponse;
import com.futsal.dto.UserRegisterRequest;
import com.futsal.dto.UserResponse;
import com.futsal.dto.UserUpdateRequest;
import com.futsal.model.User;
import com.futsal.service.UserService;
import com.futsal.security.SimpleAuth;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.MethodArgumentNotValidException;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*")
public class UserController {

    @Autowired
    private UserService userService;

    // POST /api/users/register
    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody UserRegisterRequest request) {
        try {
            User user = new User();
            user.setName(request.getName());
            user.setEmail(request.getEmail());
            user.setPhone(request.getPhone());
            user.setPassword(request.getPassword());
            User saved = userService.register(user);
            return ResponseEntity.ok(DtoMapper.toUserResponse(saved));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(errorMap(e.getMessage()));
        }
    }

    // POST /api/users/login
    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest credentials) {
        try {
            User user = userService.login(credentials.getEmail(), credentials.getPassword());
            UserResponse response = DtoMapper.toUserResponse(user);
            response.setAuthToken(SimpleAuth.createToken(user));
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(errorMap(e.getMessage()));
        }
    }

    // GET /api/users (admin)
    @GetMapping
    public ResponseEntity<?> getAllUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader
    ) {
        try {
            SimpleAuth.requireAdmin(authorizationHeader);
            Pageable pageable = PageRequest.of(page, size);
            Page<UserResponse> result = userService.getAllUsers(pageable).map(DtoMapper::toUserResponse);
            return ResponseEntity.ok(PagedResponse.fromPage(result));
        } catch (RuntimeException e) {
            return toErrorResponse(e);
        }
    }

    // GET /api/users/{id}
    @GetMapping("/{id}")
    public ResponseEntity<?> getUserById(@PathVariable Long id,
                                         @RequestHeader(value = "Authorization", required = false) String authorizationHeader) {
        try {
            SimpleAuth.requireUserOrAdmin(id, authorizationHeader);
            return ResponseEntity.ok(DtoMapper.toUserResponse(userService.getUserById(id)));
        } catch (RuntimeException e) {
            return toErrorResponse(e);
        }
    }

    // PUT /api/users/{id}
    @PutMapping("/{id}")
    public ResponseEntity<?> updateUser(@PathVariable Long id, @Valid @RequestBody UserUpdateRequest user,
                                        @RequestHeader(value = "Authorization", required = false) String authorizationHeader) {
        try {
            SimpleAuth.requireUserOrAdmin(id, authorizationHeader);
            User updated = userService.updateUser(id, user);
            return ResponseEntity.ok(DtoMapper.toUserResponse(updated));
        } catch (RuntimeException e) {
            return toErrorResponse(e);
        }
    }

    // DELETE /api/users/{id} (admin)
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id,
                                        @RequestHeader(value = "Authorization", required = false) String authorizationHeader) {
        try {
            SimpleAuth.requireAdmin(authorizationHeader);
            userService.deleteUser(id);
            return ResponseEntity.ok(successMap("User deleted successfully"));
        } catch (RuntimeException e) {
            return toErrorResponse(e);
        }
    }

    // ── Helper methods ────────────────────────────────────────────────────────
    private Map<String, String> errorMap(String message) {
        Map<String, String> map = new HashMap<>();
        map.put("error", message);
        return map;
    }

    private Map<String, String> successMap(String message) {
        Map<String, String> map = new HashMap<>();
        map.put("message", message);
        return map;
    }

    private ResponseEntity<?> toErrorResponse(RuntimeException e) {
        if ("Admin authorization required".equals(e.getMessage()) || "User authorization required".equals(e.getMessage())) {
            return ResponseEntity.status(401).body(errorMap(e.getMessage()));
        }
        return ResponseEntity.badRequest().body(errorMap(e.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<?> handleValidation(MethodArgumentNotValidException ex) {
        String message = ex.getBindingResult().getFieldErrors().isEmpty()
            ? "Invalid request."
            : ex.getBindingResult().getFieldErrors().get(0).getDefaultMessage();
        return ResponseEntity.badRequest().body(errorMap(message));
    }
}
