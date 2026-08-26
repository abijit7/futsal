package com.futsal.service;

import com.futsal.dto.VerificationIssueResponse;
import com.futsal.model.User;
import com.futsal.model.VerificationCode;
import com.futsal.model.enums.VerificationPurpose;
import com.futsal.repository.UserRepository;
import com.futsal.repository.VerificationCodeRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Clock;
import java.time.LocalDateTime;
import java.util.Base64;

@Service
public class VerificationService {
    private static final String HMAC_ALGORITHM = "HmacSHA256";
    private static final String RECOVERY_MESSAGE = "If an account exists, a password reset code has been sent.";

    private final VerificationCodeRepository verificationCodeRepository;
    private final UserRepository userRepository;
    private final VerificationDelivery deliveryService;
    private final Clock clock;
    private final SecureRandom secureRandom = new SecureRandom();
    private final int ttlMinutes;
    private final int resendCooldownSeconds;
    private final int maxAttempts;
    private final String secret;
    private final boolean exposeCode;

    public VerificationService(
            VerificationCodeRepository verificationCodeRepository,
            UserRepository userRepository,
            VerificationDelivery deliveryService,
            Clock clock,
            @Value("${app.verification.ttl-minutes:10}") int ttlMinutes,
            @Value("${app.verification.resend-cooldown-seconds:60}") int resendCooldownSeconds,
            @Value("${app.verification.max-attempts:5}") int maxAttempts,
            @Value("${app.verification.secret:change-me-in-production}") String secret,
            @Value("${app.verification.expose-code:false}") boolean exposeCode
    ) {
        if (ttlMinutes <= 0 || resendCooldownSeconds < 0 || maxAttempts <= 0) {
            throw new IllegalStateException("Verification timing and attempt settings must be positive");
        }
        if (secret == null || secret.getBytes(StandardCharsets.UTF_8).length < 32) {
            throw new IllegalStateException("app.verification.secret must be at least 32 bytes");
        }
        this.verificationCodeRepository = verificationCodeRepository;
        this.userRepository = userRepository;
        this.deliveryService = deliveryService;
        this.clock = clock;
        this.ttlMinutes = ttlMinutes;
        this.resendCooldownSeconds = resendCooldownSeconds;
        this.maxAttempts = maxAttempts;
        this.secret = secret;
        this.exposeCode = exposeCode;
    }

    @Transactional
    public VerificationIssueResponse issueForUser(User user, VerificationPurpose purpose) {
        if (purpose == VerificationPurpose.EMAIL_VERIFICATION && user.isEmailVerified()) {
            throw new IllegalArgumentException("Email is already verified");
        }
        if (purpose == VerificationPurpose.PHONE_VERIFICATION && user.isPhoneVerified()) {
            throw new IllegalArgumentException("Phone number is already verified");
        }
        String destination = purpose == VerificationPurpose.PHONE_VERIFICATION
                ? user.getPhone()
                : user.getEmail();
        return issue(user, purpose, destination, purpose == VerificationPurpose.PHONE_VERIFICATION
                ? "Verification code sent to your phone."
                : "Verification code sent to your email.");
    }

    @Transactional
    public VerificationIssueResponse issuePasswordReset(String email) {
        User user = userRepository.findByEmailIgnoreCase(normalizeEmail(email)).orElse(null);
        if (user == null) {
            return new VerificationIssueResponse(RECOVERY_MESSAGE, ttlMinutes * 60L, null);
        }
        try {
            VerificationIssueResponse issued = issue(
                    user,
                    VerificationPurpose.PASSWORD_RESET,
                    user.getEmail(),
                    RECOVERY_MESSAGE
            );
            return new VerificationIssueResponse(RECOVERY_MESSAGE, issued.getExpiresInSeconds(), issued.getDevCode());
        } catch (IllegalArgumentException ex) {
            if ("Please wait before requesting another code".equals(ex.getMessage())) {
                return new VerificationIssueResponse(RECOVERY_MESSAGE, ttlMinutes * 60L, null);
            }
            throw ex;
        }
    }

    @Transactional
    public User confirm(User user, VerificationPurpose purpose, String code) {
        consumeValidCode(user, purpose, code);
        if (purpose == VerificationPurpose.EMAIL_VERIFICATION) {
            user.setEmailVerified(true);
        } else if (purpose == VerificationPurpose.PHONE_VERIFICATION) {
            user.setPhoneVerified(true);
        }
        return userRepository.save(user);
    }

    @Transactional
    public User consumePasswordReset(String email, String code) {
        User user = userRepository.findByEmailIgnoreCase(normalizeEmail(email))
                .orElseThrow(() -> new IllegalArgumentException("Invalid or expired verification code"));
        consumeValidCode(user, VerificationPurpose.PASSWORD_RESET, code);
        return user;
    }

    private VerificationIssueResponse issue(
            User user,
            VerificationPurpose purpose,
            String destination,
            String message
    ) {
        LocalDateTime now = LocalDateTime.now(clock);
        verificationCodeRepository
                .findFirstByUserAndPurposeAndConsumedAtIsNullOrderByCreatedAtDesc(user, purpose)
                .filter(existing -> existing.getCreatedAt().plusSeconds(resendCooldownSeconds).isAfter(now))
                .ifPresent(existing -> {
                    throw new IllegalArgumentException("Please wait before requesting another code");
                });

        verificationCodeRepository.findByUserAndPurposeAndConsumedAtIsNull(user, purpose)
                .forEach(existing -> existing.setConsumedAt(now));

        String code = String.format("%06d", secureRandom.nextInt(1_000_000));
        VerificationCode verification = new VerificationCode();
        verification.setUser(user);
        verification.setPurpose(purpose);
        verification.setDestination(destination);
        verification.setCodeHash(hash(code));
        verification.setCreatedAt(now);
        verification.setExpiresAt(now.plusMinutes(ttlMinutes));
        verification.setAttempts(0);
        verificationCodeRepository.save(verification);
        deliveryService.deliver(purpose, destination, code);

        return new VerificationIssueResponse(message, ttlMinutes * 60L, exposeCode ? code : null);
    }

    private void consumeValidCode(User user, VerificationPurpose purpose, String code) {
        LocalDateTime now = LocalDateTime.now(clock);
        VerificationCode verification = verificationCodeRepository
                .findFirstByUserAndPurposeAndConsumedAtIsNullOrderByCreatedAtDesc(user, purpose)
                .orElseThrow(() -> new IllegalArgumentException("Invalid or expired verification code"));

        if (verification.getExpiresAt().isBefore(now) || verification.getAttempts() >= maxAttempts) {
            verification.setConsumedAt(now);
            verificationCodeRepository.save(verification);
            throw new IllegalArgumentException("Invalid or expired verification code");
        }

        if (!MessageDigest.isEqual(
                verification.getCodeHash().getBytes(StandardCharsets.UTF_8),
                hash(code).getBytes(StandardCharsets.UTF_8)
        )) {
            verification.setAttempts(verification.getAttempts() + 1);
            if (verification.getAttempts() >= maxAttempts) {
                verification.setConsumedAt(now);
            }
            verificationCodeRepository.save(verification);
            throw new IllegalArgumentException("Invalid or expired verification code");
        }

        verification.setConsumedAt(now);
        verificationCodeRepository.save(verification);
    }

    private String hash(String code) {
        try {
            Mac mac = Mac.getInstance(HMAC_ALGORITHM);
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), HMAC_ALGORITHM));
            return Base64.getEncoder().encodeToString(mac.doFinal(code.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception ex) {
            throw new IllegalStateException("Could not secure verification code", ex);
        }
    }

    private String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase();
    }
}
