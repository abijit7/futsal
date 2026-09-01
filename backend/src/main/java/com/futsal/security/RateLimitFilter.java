package com.futsal.security;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Per-client request throttling.
 *
 * <p>Ordered ahead of Spring Security's filter chain (which Boot registers at -100) so that
 * abusive traffic is shed before any authentication work happens.
 */
@Component
@Order(RateLimitFilter.ORDER)
public class RateLimitFilter extends OncePerRequestFilter {

    public static final int ORDER = -140;

    /** Credential endpoints get their own, much tighter bucket. */
    private static final List<String> CREDENTIAL_PATHS = List.of(
            "/api/users/login",
            "/api/users/register",
            "/api/users/forgot-password",
            "/api/users/reset-password"
    );

    private final ConcurrentHashMap<String, Bucket> generalBuckets = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, Bucket> credentialBuckets = new ConcurrentHashMap<>();

    @Value("${app.rate-limit.capacity:60}")
    private long capacity;

    @Value("${app.rate-limit.refill-tokens:60}")
    private long refillTokens;

    @Value("${app.rate-limit.refill-minutes:1}")
    private long refillMinutes;

    @Value("${app.rate-limit.credential.capacity:10}")
    private long credentialCapacity;

    @Value("${app.rate-limit.credential.refill-tokens:10}")
    private long credentialRefillTokens;

    @Value("${app.rate-limit.credential.refill-minutes:15}")
    private long credentialRefillMinutes;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        if (!shouldRateLimit(request)) {
            filterChain.doFilter(request, response);
            return;
        }

        String key = resolveClientKey(request);
        boolean credential = isCredentialRequest(request);
        Bucket bucket = credential
                ? credentialBuckets.computeIfAbsent(key, ignored -> newBucket(credentialCapacity, credentialRefillTokens, credentialRefillMinutes))
                : generalBuckets.computeIfAbsent(key, ignored -> newBucket(capacity, refillTokens, refillMinutes));

        if (bucket.tryConsume(1)) {
            response.setHeader("X-Rate-Limit-Remaining", String.valueOf(bucket.getAvailableTokens()));
            filterChain.doFilter(request, response);
            return;
        }

        long retryAfterSeconds = Duration.ofMinutes(credential ? credentialRefillMinutes : refillMinutes).toSeconds();
        response.setStatus(429);
        response.setContentType("application/json");
        response.setHeader("Retry-After", String.valueOf(retryAfterSeconds));
        response.getWriter().write("{\"error\":\"Too many requests\"}");
    }

    private boolean shouldRateLimit(HttpServletRequest request) {
        // CORS preflight carries no credentials and must never be throttled, or the
        // browser reports an opaque CORS failure instead of the real status.
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            return false;
        }
        return request.getRequestURI().startsWith("/api/");
    }

    private boolean isCredentialRequest(HttpServletRequest request) {
        String path = request.getRequestURI();
        return CREDENTIAL_PATHS.stream().anyMatch(path::equals);
    }

    private String resolveClientKey(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    private Bucket newBucket(long bucketCapacity, long tokens, long minutes) {
        Refill refill = Refill.greedy(tokens, Duration.ofMinutes(minutes));
        Bandwidth limit = Bandwidth.classic(bucketCapacity, refill);
        return Bucket.builder().addLimit(limit).build();
    }
}
