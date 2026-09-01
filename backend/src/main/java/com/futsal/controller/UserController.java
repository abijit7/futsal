package com.futsal.controller;

import com.futsal.dto.DtoMapper;
import com.futsal.dto.*;
import com.futsal.model.User;
import com.futsal.model.enums.Role;
import com.futsal.model.enums.VerificationPurpose;
import com.futsal.security.JwtService;
import com.futsal.security.SecurityAuth;
import com.futsal.service.UserService;
import com.futsal.service.VerificationService;
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

    @Autowired
    private VerificationService verificationService;

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

    @PostMapping("/forgot-password")
    public ResponseEntity<VerificationIssueResponse> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequest request
    ) {
        return ResponseEntity.ok(verificationService.issuePasswordReset(request.getEmail()));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<Map<String, String>> resetPassword(
            @Valid @RequestBody ResetPasswordRequest request
    ) {
        User user = verificationService.consumePasswordReset(request.getEmail(), request.getCode());
        userService.resetPassword(user, request.getNewPassword());
        return ResponseEntity.ok(successMap("Password reset successfully. You can now log in."));
    }

    // GET /api/users (admin)
    @GetMapping
    public ResponseEntity<PagedResponse<UserResponse>> getAllUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String role
    ) {
        securityAuth.requireAdmin();
        Pageable pageable = PageRequestFactory.create(page, size);
        Page<UserResponse> result = userService.getAllUsers(q, parseRole(role), pageable)
                .map(DtoMapper::toUserResponse);
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

    @PutMapping("/{id}/password")
    public ResponseEntity<Map<String, String>> changePassword(
            @PathVariable Long id,
            @Valid @RequestBody PasswordChangeRequest request
    ) {
        securityAuth.requireUserOrAdmin(id);
        userService.changePassword(id, request.getCurrentPassword(), request.getNewPassword());
        return ResponseEntity.ok(successMap("Password changed successfully. Please log in again."));
    }

    @PostMapping("/{id}/verification/email/request")
    public ResponseEntity<VerificationIssueResponse> requestEmailVerification(@PathVariable Long id) {
        securityAuth.requireUserOrAdmin(id);
        return ResponseEntity.ok(verificationService.issueForUser(
                userService.getUserById(id),
                VerificationPurpose.EMAIL_VERIFICATION
        ));
    }

    @PostMapping("/{id}/verification/email/confirm")
    public ResponseEntity<UserResponse> confirmEmailVerification(
            @PathVariable Long id,
            @Valid @RequestBody VerificationConfirmRequest request
    ) {
        securityAuth.requireUserOrAdmin(id);
        User verified = verificationService.confirm(
                userService.getUserById(id),
                VerificationPurpose.EMAIL_VERIFICATION,
                request.getCode()
        );
        return ResponseEntity.ok(DtoMapper.toUserResponse(verified));
    }

    @PostMapping("/{id}/verification/phone/request")
    public ResponseEntity<VerificationIssueResponse> requestPhoneVerification(@PathVariable Long id) {
        securityAuth.requireUserOrAdmin(id);
        return ResponseEntity.ok(verificationService.issueForUser(
                userService.getUserById(id),
                VerificationPurpose.PHONE_VERIFICATION
        ));
    }

    @PostMapping("/{id}/verification/phone/confirm")
    public ResponseEntity<UserResponse> confirmPhoneVerification(
            @PathVariable Long id,
            @Valid @RequestBody VerificationConfirmRequest request
    ) {
        securityAuth.requireUserOrAdmin(id);
        User verified = verificationService.confirm(
                userService.getUserById(id),
                VerificationPurpose.PHONE_VERIFICATION,
                request.getCode()
        );
        return ResponseEntity.ok(DtoMapper.toUserResponse(verified));
    }

    // DELETE /api/users/{id} (admin)
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteUser(@PathVariable Long id) {
        securityAuth.requireAdmin();
        userService.deleteUser(id);
        return ResponseEntity.ok(successMap("User deleted successfully"));
    }

    // ── Helper methods ────────────────────────────────────────────────────────
    private Role parseRole(String role) {
        if (role == null || role.isBlank() || "ALL".equalsIgnoreCase(role)) {
            return null;
        }
        try {
            return Role.valueOf(role.trim().toUpperCase());
        } catch (RuntimeException ex) {
            throw new IllegalArgumentException("Invalid role value");
        }
    }

    private Map<String, String> successMap(String message) {
        Map<String, String> map = new HashMap<>();
        map.put("message", message);
        return map;
    }
}
