package com.futsal.service;

import com.futsal.model.User;
import com.futsal.model.enums.Role;
import com.futsal.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Base64;
import java.util.List;
import java.util.Optional;

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
    public List<User> getAllUsers() {
        List<User> users = userRepository.findAll();
        users.forEach(u -> u.setPassword(null)); // hide passwords
        return users;
    }

    // ── Get user by ID ────────────────────────────────────────────────────────
    public User getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setPassword(null);
        return user;
    }

    // ── Update user profile ───────────────────────────────────────────────────
    public User updateUser(Long id, User updatedUser) {
        User existing = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        existing.setName(updatedUser.getName());
        existing.setPhone(updatedUser.getPhone());
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
