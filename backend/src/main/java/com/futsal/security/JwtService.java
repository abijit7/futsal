package com.futsal.security;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.futsal.model.User;
import com.futsal.model.enums.Role;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;

@Service
public class JwtService {

    private static final String HMAC_ALGORITHM = "HmacSHA256";
    private static final Base64.Encoder URL_ENCODER = Base64.getUrlEncoder().withoutPadding();
    private static final Base64.Decoder URL_DECODER = Base64.getUrlDecoder();
    private static final TypeReference<Map<String, Object>> CLAIMS_TYPE = new TypeReference<>() {};

    private final ObjectMapper objectMapper;
    private final byte[] secret;
    private final long expirationSeconds;
    private final String issuer;

    public JwtService(
            ObjectMapper objectMapper,
            @Value("${app.jwt.secret}") String secret,
            @Value("${app.jwt.expiration-minutes:1440}") long expirationMinutes,
            @Value("${app.jwt.issuer:futsal-booking}") String issuer
    ) {
        if (secret == null || secret.getBytes(StandardCharsets.UTF_8).length < 32) {
            throw new IllegalStateException("app.jwt.secret must be at least 32 bytes");
        }
        if (expirationMinutes <= 0) {
            throw new IllegalStateException("app.jwt.expiration-minutes must be positive");
        }
        this.objectMapper = objectMapper;
        this.secret = secret.getBytes(StandardCharsets.UTF_8);
        this.expirationSeconds = expirationMinutes * 60;
        this.issuer = issuer;
    }

    public String createToken(User user) {
        if (user == null || user.getUserId() == null || user.getEmail() == null || user.getRole() == null) {
            throw new IllegalArgumentException("Cannot create JWT for incomplete user");
        }

        Instant now = Instant.now();
        Map<String, Object> header = new LinkedHashMap<>();
        header.put("alg", "HS256");
        header.put("typ", "JWT");

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("iss", issuer);
        payload.put("sub", user.getEmail());
        payload.put("uid", user.getUserId());
        payload.put("role", user.getRole().name());
        payload.put("iat", now.getEpochSecond());
        payload.put("exp", now.plusSeconds(expirationSeconds).getEpochSecond());

        String headerPart = encodeJson(header);
        String payloadPart = encodeJson(payload);
        String unsignedToken = headerPart + "." + payloadPart;
        return unsignedToken + "." + sign(unsignedToken);
    }

    public JwtPrincipal parseToken(String token) {
        if (token == null || token.isBlank()) {
            throw new IllegalArgumentException("Missing JWT");
        }

        String[] parts = token.split("\\.", -1);
        if (parts.length != 3 || parts[0].isBlank() || parts[1].isBlank() || parts[2].isBlank()) {
            throw new IllegalArgumentException("Malformed JWT");
        }

        String unsignedToken = parts[0] + "." + parts[1];
        String expectedSignature = sign(unsignedToken);
        if (!MessageDigest.isEqual(expectedSignature.getBytes(StandardCharsets.UTF_8), parts[2].getBytes(StandardCharsets.UTF_8))) {
            throw new IllegalArgumentException("Invalid JWT signature");
        }

        Map<String, Object> header = decodeJson(parts[0]);
        if (!"HS256".equals(header.get("alg"))) {
            throw new IllegalArgumentException("Unsupported JWT algorithm");
        }

        Map<String, Object> payload = decodeJson(parts[1]);
        if (!issuer.equals(payload.get("iss"))) {
            throw new IllegalArgumentException("Invalid JWT issuer");
        }

        long expiresAt = longClaim(payload, "exp");
        if (Instant.now().getEpochSecond() >= expiresAt) {
            throw new IllegalArgumentException("JWT has expired");
        }

        Long userId = longClaim(payload, "uid");
        String email = stringClaim(payload, "sub");
        Role role = Role.valueOf(stringClaim(payload, "role"));
        return new JwtPrincipal(userId, email, role);
    }

    private String encodeJson(Map<String, Object> value) {
        try {
            return URL_ENCODER.encodeToString(objectMapper.writeValueAsBytes(value));
        } catch (Exception ex) {
            throw new IllegalStateException("JWT serialization failed", ex);
        }
    }

    private Map<String, Object> decodeJson(String value) {
        try {
            return objectMapper.readValue(URL_DECODER.decode(value), CLAIMS_TYPE);
        } catch (Exception ex) {
            throw new IllegalArgumentException("JWT JSON decoding failed", ex);
        }
    }

    private String sign(String value) {
        try {
            Mac mac = Mac.getInstance(HMAC_ALGORITHM);
            mac.init(new SecretKeySpec(secret, HMAC_ALGORITHM));
            return URL_ENCODER.encodeToString(mac.doFinal(value.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception ex) {
            throw new IllegalStateException("JWT signing failed", ex);
        }
    }

    private String stringClaim(Map<String, Object> payload, String key) {
        Object value = payload.get(key);
        if (value instanceof String text && !text.isBlank()) {
            return text;
        }
        throw new IllegalArgumentException("Missing JWT claim: " + key);
    }

    private Long longClaim(Map<String, Object> payload, String key) {
        Object value = payload.get(key);
        if (value instanceof Number number) {
            return number.longValue();
        }
        throw new IllegalArgumentException("Missing JWT claim: " + key);
    }
}
