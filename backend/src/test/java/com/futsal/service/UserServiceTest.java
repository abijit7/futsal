package com.futsal.service;

import com.futsal.model.User;
import com.futsal.model.enums.Role;
import com.futsal.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.lang.reflect.Proxy;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Base64;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicBoolean;

import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class UserServiceTest {

    private final BCryptPasswordEncoder verifier = new BCryptPasswordEncoder();

    @Test
    void hashPasswordUsesBCrypt() {
        UserService userService = new UserService();

        String encoded = userService.hashPassword("secret123");

        assertTrue(encoded.startsWith("$2"));
        assertTrue(verifier.matches("secret123", encoded));
        assertNotEquals(legacySha256("secret123"), encoded);
    }

    @Test
    void loginMigratesLegacySha256PasswordToBCrypt() {
        User user = new User();
        user.setUserId(7L);
        user.setName("Test User");
        user.setEmail("player@gmail.com");
        user.setPhone("9812345678");
        user.setRole(Role.USER);
        user.setPassword(legacySha256("secret123"));

        AtomicBoolean savedPassword = new AtomicBoolean(false);
        UserRepository userRepository = repositoryReturning(user, savedPassword);
        UserService userService = new UserService();
        ReflectionTestUtils.setField(userService, "userRepository", userRepository);

        User loggedIn = userService.login("player@gmail.com", "secret123");

        assertTrue(savedPassword.get());
        assertNull(loggedIn.getPassword());
        assertTrue(verifier.matches("secret123", user.getPassword()));
    }

    private UserRepository repositoryReturning(User user, AtomicBoolean savedPassword) {
        return (UserRepository) Proxy.newProxyInstance(
                UserRepository.class.getClassLoader(),
                new Class<?>[]{UserRepository.class},
                (proxy, method, args) -> {
                    if ("findByEmail".equals(method.getName())) {
                        return Optional.of(user);
                    }
                    if ("save".equals(method.getName())) {
                        savedPassword.set(true);
                        User saved = (User) args[0];
                        User copy = new User();
                        copy.setUserId(saved.getUserId());
                        copy.setName(saved.getName());
                        copy.setEmail(saved.getEmail());
                        copy.setPhone(saved.getPhone());
                        copy.setRole(saved.getRole());
                        copy.setPassword(saved.getPassword());
                        return copy;
                    }
                    throw new UnsupportedOperationException(method.getName());
                }
        );
    }

    private String legacySha256(String password) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] hash = md.digest(password.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(hash);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
}
