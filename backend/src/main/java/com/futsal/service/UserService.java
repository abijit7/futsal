package com.futsal.service;

import com.futsal.dto.UserUpdateRequest;
import com.futsal.model.User;
import com.futsal.model.enums.Role;
import com.futsal.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Base64;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    // ── Hash password using SHA-256 (simple, no BCrypt for BCA level) ─────────
    public String hashPassword(String password) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] hash = md.digest(password.getBytes());
            return Base64.getEncoder().encodeToString(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("Hashing error", e);
        }
    }

    // ── Register new user ─────────────────────────────────────────────────────
    public User register(User user) {
        if (userRepository.existsByEmail(user.getEmail())) {
            throw new RuntimeException("Email is already registered. Please use a different email.");
        }
        user.setPassword(hashPassword(user.getPassword()));
        user.setRole(Role.USER);
        return userRepository.save(user);
    }

    // ── Login ─────────────────────────────────────────────────────────────────
    public User login(String email, String password) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("No account found with this email."));

        String hashedInput = hashPassword(password);
        if (!user.getPassword().equals(hashedInput)) {
            throw new RuntimeException("Incorrect password. Please try again.");
        }
        // Don't send password to frontend
        user.setPassword(null);
        return user;
    }

    // ── Get all users (admin) ─────────────────────────────────────────────────
    public Page<User> getAllUsers(Pageable pageable) {
        return userRepository.findAll(pageable);
    }

    // ── Get user by ID ────────────────────────────────────────────────────────
    public User getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setPassword(null);
        return user;
    }

    // ── Update user profile ───────────────────────────────────────────────────
    public User updateUser(Long id, UserUpdateRequest updatedUser) {
        User existing = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        if (updatedUser.getName() != null && !updatedUser.getName().isBlank()) {
            existing.setName(updatedUser.getName());
        }
        if (updatedUser.getPhone() != null && !updatedUser.getPhone().isBlank()) {
            existing.setPhone(updatedUser.getPhone());
        }
        if (updatedUser.getPassword() != null && !updatedUser.getPassword().isEmpty()) {
            existing.setPassword(hashPassword(updatedUser.getPassword()));
        }
        User saved = userRepository.save(existing);
        saved.setPassword(null);
        return saved;
    }

    // ── Delete user (admin) ───────────────────────────────────────────────────
    public void deleteUser(Long id) {
        if (!userRepository.existsById(id)) {
            throw new RuntimeException("User not found");
        }
        userRepository.deleteById(id);
    }
}
