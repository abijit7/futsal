package com.futsal.service;

import com.futsal.config.DemoProperties;
import com.futsal.dto.UserUpdateRequest;
import com.futsal.error.ConflictException;
import com.futsal.error.NotFoundException;
import com.futsal.model.User;
import com.futsal.model.enums.Role;
import com.futsal.repository.UserRepository;
import com.futsal.repository.VerificationCodeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Base64;

@Service
public class UserService {

    private static final BCryptPasswordEncoder PASSWORD_ENCODER = new BCryptPasswordEncoder(12);

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private VerificationCodeRepository verificationCodeRepository;

    /**
     * Present only when the deployment is a demo. Optional so that unit tests can still build this
     * service with {@code new UserService()}, matching how BookingService takes RefundService.
     */
    @Autowired(required = false)
    private DemoProperties demoProperties;

    // ── Hash password using BCrypt ────────────────────────────────────────────
    public String hashPassword(String password) {
        return PASSWORD_ENCODER.encode(password);
    }

    public boolean verifyPassword(String rawPassword, String storedPassword) {
        return passwordMatches(rawPassword, storedPassword);
    }

    // ── Register new user ─────────────────────────────────────────────────────
    public User register(User user) {
        user.setEmail(normalizeEmail(user.getEmail()));
        if (userRepository.existsByEmailIgnoreCase(user.getEmail())) {
            throw new ConflictException("Email is already registered. Please use a different email.");
        }
        user.setPassword(hashPassword(user.getPassword()));
        user.setRole(Role.USER);
        user.setEmailVerified(false);
        user.setPhoneVerified(false);
        user.setAuthVersion(0);
        return userRepository.save(user);
    }

    // ── Login ─────────────────────────────────────────────────────────────────
    public User login(String email, String password) {
        User user = userRepository.findByEmailIgnoreCase(normalizeEmail(email))
                .orElseThrow(() -> new IllegalArgumentException("No account found with this email."));

        if (!passwordMatches(password, user.getPassword())) {
            throw new IllegalArgumentException("Incorrect password. Please try again.");
        }
        if (!isBcryptHash(user.getPassword())) {
            user.setPassword(hashPassword(password));
            user = userRepository.save(user);
        }
        return user;
    }

    // ── Get all users (admin) ─────────────────────────────────────────────────
    public Page<User> getAllUsers(String query, Pageable pageable) {
        return getAllUsers(query, null, pageable);
    }

    public Page<User> getAllUsers(String query, Role role, Pageable pageable) {
        String term = query == null ? "" : query.trim();
        return role == null
                ? userRepository.search(term, pageable)
                : userRepository.searchByRole(term, role, pageable);
    }

    // ── Get user by ID ────────────────────────────────────────────────────────
    public User getUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("User not found"));
    }

    // ── Update user profile ───────────────────────────────────────────────────
    public User updateUser(Long id, UserUpdateRequest updatedUser) {
        User existing = userRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("User not found"));
        if (updatedUser.getName() != null && !updatedUser.getName().isBlank()) {
            existing.setName(updatedUser.getName());
        }
        if (updatedUser.getPhone() != null && !updatedUser.getPhone().isBlank()) {
            if (!updatedUser.getPhone().equals(existing.getPhone())) {
                existing.setPhoneVerified(false);
            }
            existing.setPhone(updatedUser.getPhone());
        }
        return userRepository.save(existing);
    }

    public void changePassword(Long id, String currentPassword, String newPassword) {
        User existing = getUserById(id);
        rejectIfDemoAccount(existing);
        if (!passwordMatches(currentPassword, existing.getPassword())) {
            throw new IllegalArgumentException("Current password is incorrect");
        }
        if (passwordMatches(newPassword, existing.getPassword())) {
            throw new IllegalArgumentException("New password must be different from the current password");
        }
        setNewPassword(existing, newPassword);
    }

    public void resetPassword(User user, String newPassword) {
        rejectIfDemoAccount(user);
        setNewPassword(user, newPassword);
    }

    private void setNewPassword(User user, String newPassword) {
        user.setPassword(hashPassword(newPassword));
        user.setAuthVersion(user.getAuthVersion() + 1);
        userRepository.save(user);
    }

    // ── Delete user (admin) ───────────────────────────────────────────────────
    // Transactional because deleteByUser is a derived delete query: Spring Data's default
    // read-only transaction cannot execute it, and the two deletes must succeed or fail together.
    @Transactional
    public void deleteUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("User not found"));
        rejectIfDemoAccount(user);
        verificationCodeRepository.deleteByUser(user);
        userRepository.delete(user);
    }

    /**
     * Keeps the advertised demo logins usable for the next visitor.
     *
     * <p>Demo mode hands a working admin account to anyone who asks, so without this one visitor
     * could change its password - or delete it outright - and lock everyone else out until the
     * next seed. Only the credentials are protected: name and phone stay editable, and every other
     * admin action, including deleting other users, is left alone so the demo still shows the real
     * system.
     */
    private void rejectIfDemoAccount(User user) {
        if (demoProperties == null || !demoProperties.isEnabled() || user == null) {
            return;
        }
        String email = normalizeEmail(user.getEmail());
        if (email.equals(normalizeEmail(demoProperties.getAdmin().getEmail()))
                || email.equals(normalizeEmail(demoProperties.getUser().getEmail()))) {
            throw new ConflictException(
                    "This is a shared demo account, so its password cannot be changed and it cannot "
                            + "be deleted. Register your own account to try these actions.");
        }
    }

    private boolean passwordMatches(String rawPassword, String storedPassword) {
        if (storedPassword == null || storedPassword.isBlank()) {
            return false;
        }
        if (isBcryptHash(storedPassword)) {
            return PASSWORD_ENCODER.matches(rawPassword, storedPassword);
        }
        return storedPassword.equals(legacySha256(rawPassword));
    }

    private boolean isBcryptHash(String password) {
        return password.startsWith("$2a$") || password.startsWith("$2b$") || password.startsWith("$2y$");
    }

    private String legacySha256(String password) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] hash = md.digest(password.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("Hashing error", e);
        }
    }

    private String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase();
    }
}
