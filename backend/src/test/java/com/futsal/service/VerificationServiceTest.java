package com.futsal.service;

import com.futsal.dto.VerificationIssueResponse;
import com.futsal.model.User;
import com.futsal.model.VerificationCode;
import com.futsal.model.enums.VerificationPurpose;
import com.futsal.repository.UserRepository;
import com.futsal.repository.VerificationCodeRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class VerificationServiceTest {
    @Mock
    private VerificationCodeRepository verificationCodeRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private VerificationDelivery deliveryService;

    private final Clock clock = Clock.fixed(
            Instant.parse("2026-06-22T10:00:00Z"),
            ZoneId.of("Asia/Kathmandu")
    );

    private VerificationService service;
    private User user;

    @BeforeEach
    void setUp() {
        service = new VerificationService(
                verificationCodeRepository,
                userRepository,
                deliveryService,
                clock,
                10,
                60,
                5,
                "test-verification-secret-with-32-bytes-minimum",
                true
        );
        user = new User();
        user.setUserId(9L);
        user.setName("Test Player");
        user.setEmail("player@gmail.com");
        user.setPhone("9812345678");
        lenient().when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));
    }

    @Test
    void issuesAndConfirmsEmailVerificationCode() {
        when(verificationCodeRepository.findFirstByUserAndPurposeAndConsumedAtIsNullOrderByCreatedAtDesc(
                user,
                VerificationPurpose.EMAIL_VERIFICATION
        )).thenReturn(Optional.empty());
        when(verificationCodeRepository.findByUserAndPurposeAndConsumedAtIsNull(
                user,
                VerificationPurpose.EMAIL_VERIFICATION
        )).thenReturn(List.of());

        VerificationIssueResponse response = service.issueForUser(user, VerificationPurpose.EMAIL_VERIFICATION);

        assertNotNull(response.getDevCode());
        assertEquals(6, response.getDevCode().length());
        ArgumentCaptor<VerificationCode> captor = ArgumentCaptor.forClass(VerificationCode.class);
        verify(verificationCodeRepository).save(captor.capture());
        VerificationCode stored = captor.getValue();
        verify(deliveryService).deliver(VerificationPurpose.EMAIL_VERIFICATION, user.getEmail(), response.getDevCode());

        when(verificationCodeRepository.findFirstByUserAndPurposeAndConsumedAtIsNullOrderByCreatedAtDesc(
                user,
                VerificationPurpose.EMAIL_VERIFICATION
        )).thenReturn(Optional.of(stored));

        User verified = service.confirm(user, VerificationPurpose.EMAIL_VERIFICATION, response.getDevCode());

        assertTrue(verified.isEmailVerified());
        assertNotNull(stored.getConsumedAt());
    }

    @Test
    void rejectsExpiredCode() {
        VerificationCode expired = new VerificationCode();
        expired.setUser(user);
        expired.setPurpose(VerificationPurpose.PASSWORD_RESET);
        expired.setCodeHash("irrelevant");
        expired.setCreatedAt(LocalDateTime.now(clock).minusMinutes(20));
        expired.setExpiresAt(LocalDateTime.now(clock).minusMinutes(10));
        when(verificationCodeRepository.findFirstByUserAndPurposeAndConsumedAtIsNullOrderByCreatedAtDesc(
                user,
                VerificationPurpose.PASSWORD_RESET
        )).thenReturn(Optional.of(expired));
        when(userRepository.findByEmailIgnoreCase(user.getEmail())).thenReturn(Optional.of(user));

        assertThrows(IllegalArgumentException.class, () -> service.consumePasswordReset(user.getEmail(), "123456"));
        assertNotNull(expired.getConsumedAt());
    }

    @Test
    void wrongCodeCountsAttemptWithoutRevealingDetails() {
        VerificationCode active = new VerificationCode();
        active.setUser(user);
        active.setPurpose(VerificationPurpose.PHONE_VERIFICATION);
        active.setCodeHash("not-the-submitted-code");
        active.setCreatedAt(LocalDateTime.now(clock));
        active.setExpiresAt(LocalDateTime.now(clock).plusMinutes(10));
        when(verificationCodeRepository.findFirstByUserAndPurposeAndConsumedAtIsNullOrderByCreatedAtDesc(
                user,
                VerificationPurpose.PHONE_VERIFICATION
        )).thenReturn(Optional.of(active));

        IllegalArgumentException error = assertThrows(
                IllegalArgumentException.class,
                () -> service.confirm(user, VerificationPurpose.PHONE_VERIFICATION, "123456")
        );

        assertEquals("Invalid or expired verification code", error.getMessage());
        assertEquals(1, active.getAttempts());
    }
}
