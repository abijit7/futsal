package com.futsal.service;

import com.futsal.dto.UserUpdateRequest;
import com.futsal.model.User;
import com.futsal.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserSecurityServiceTest {
    @Mock
    private UserRepository userRepository;

    private UserService userService;
    private User user;

    @BeforeEach
    void setUp() {
        userService = new UserService();
        ReflectionTestUtils.setField(userService, "userRepository", userRepository);
        user = new User();
        user.setUserId(5L);
        user.setName("Test Player");
        user.setEmail("player@gmail.com");
        user.setPhone("9812345678");
        user.setPassword(userService.hashPassword("current123"));
        user.setPhoneVerified(true);
        user.setAuthVersion(2);
        when(userRepository.findById(5L)).thenReturn(Optional.of(user));
        lenient().when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));
    }

    @Test
    void changingPasswordRequiresCurrentPasswordAndInvalidatesSessions() {
        userService.changePassword(5L, "current123", "newPassword123");

        assertEquals(3, user.getAuthVersion());
        assertTrue(new BCryptPasswordEncoder().matches("newPassword123", user.getPassword()));
    }

    @Test
    void rejectsIncorrectCurrentPassword() {
        IllegalArgumentException error = assertThrows(
                IllegalArgumentException.class,
                () -> userService.changePassword(5L, "wrong-password", "newPassword123")
        );

        assertEquals("Current password is incorrect", error.getMessage());
        assertEquals(2, user.getAuthVersion());
    }

    @Test
    void changingPhoneResetsPhoneVerification() {
        UserUpdateRequest request = new UserUpdateRequest();
        request.setPhone("9712345678");

        User updated = userService.updateUser(5L, request);

        assertEquals("9712345678", updated.getPhone());
        assertFalse(updated.isPhoneVerified());
    }
}
