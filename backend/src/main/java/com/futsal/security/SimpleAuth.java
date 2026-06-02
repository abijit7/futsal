package com.futsal.security;

import com.futsal.model.User;
import com.futsal.model.enums.Role;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;

public final class SimpleAuth {

    private static final String TOKEN_ENV_NAME = "AUTH_TOKEN_SECRET";
    private static final long TOKEN_TTL_SECONDS = 24 * 60 * 60;
    private static final byte[] TOKEN_SECRET = resolveTokenSecret();
    private static final Base64.Encoder URL_ENCODER = Base64.getUrlEncoder().withoutPadding();
    private static final Base64.Decoder URL_DECODER = Base64.getUrlDecoder();

    private SimpleAuth() {}

    public static String createToken(User user) {
        if (user == null || user.getUserId() == null || user.getRole() == null) {
            throw new RuntimeException("Cannot create auth token");
        }
        long expiresAt = Instant.now().getEpochSecond() + TOKEN_TTL_SECONDS;
        String payload = user.getUserId() + ":" + user.getRole().name() + ":" + expiresAt;
        return URL_ENCODER.encodeToString(payload.getBytes(StandardCharsets.UTF_8)) + "." + sign(payload);
    }

    public static boolean isAdmin(String authorizationHeader) {
        AuthPrincipal principal = parseBearer(authorizationHeader);
        return principal != null && principal.role() == Role.ADMIN;
    }

    public static void requireAdmin(String authorizationHeader) {
        if (!isAdmin(authorizationHeader)) {
            throw new RuntimeException("Admin authorization required");
        }
    }

    public static void requireUserOrAdmin(Long targetUserId, String authorizationHeader) {
        AuthPrincipal principal = parseBearer(authorizationHeader);
        if (principal == null) {
            throw new RuntimeException("User authorization required");
        }
        if (principal.role() == Role.ADMIN || principal.userId().equals(targetUserId)) {
            return;
        }
        throw new RuntimeException("User authorization required");
    }

    private static AuthPrincipal parseBearer(String authorizationHeader) {
        if (authorizationHeader == null || !authorizationHeader.startsWith("Bearer ")) {
            return null;
        }

        String token = authorizationHeader.substring("Bearer ".length()).trim();
        String[] parts = token.split("\\.", -1);
        if (parts.length != 2 || parts[0].isBlank() || parts[1].isBlank()) {
            return null;
        }

        try {
            String payload = new String(URL_DECODER.decode(parts[0]), StandardCharsets.UTF_8);
            String expectedSignature = sign(payload);
            if (!MessageDigest.isEqual(expectedSignature.getBytes(StandardCharsets.UTF_8), parts[1].getBytes(StandardCharsets.UTF_8))) {
                return null;
            }

            String[] fields = payload.split(":", -1);
            if (fields.length != 3) {
                return null;
            }

            Long userId = Long.parseLong(fields[0]);
            Role role = Role.valueOf(fields[1]);
            long expiresAt = Long.parseLong(fields[2]);
            if (Instant.now().getEpochSecond() > expiresAt) {
                return null;
            }
            return new AuthPrincipal(userId, role);
        } catch (RuntimeException ex) {
            return null;
        }
    }

    private static String sign(String payload) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(TOKEN_SECRET, "HmacSHA256"));
            return URL_ENCODER.encodeToString(mac.doFinal(payload.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception ex) {
            throw new RuntimeException("Token signing error", ex);
        }
    }

    private static byte[] resolveTokenSecret() {
        String configured = System.getenv(TOKEN_ENV_NAME);
        if (configured != null && !configured.isBlank()) {
            return configured.getBytes(StandardCharsets.UTF_8);
        }
        byte[] generated = new byte[32];
        new SecureRandom().nextBytes(generated);
        return generated;
    }

    private record AuthPrincipal(Long userId, Role role) {}
}
