package com.futsal.security;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.annotation.Order;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Per-client request throttling.
 *
 * <p>Ordered ahead of Spring Security's filter chain (which Boot registers at -100) so that
 * abusive traffic is shed before any authentication work happens.
 *
 * <p>Buckets live in memory and are therefore per-instance: running two replicas doubles the
 * effective limit. That is an accepted trade-off while this runs as a single instance; moving
 * to a shared store means swapping the maps here for bucket4j's Redis/Hazelcast backend.
 */
@Component
@Order(RateLimitFilter.ORDER)
public class RateLimitFilter extends OncePerRequestFilter {

    public static final int ORDER = -140;

    private static final Logger log = LoggerFactory.getLogger(RateLimitFilter.class);

    /** Credential endpoints get their own, much tighter bucket. */
    private static final List<String> CREDENTIAL_PATHS = List.of(
            "/api/users/login",
            "/api/users/register",
            "/api/users/forgot-password",
            "/api/users/reset-password"
    );

    /**
     * Hard ceiling on tracked clients per map. Reaching it means either a genuine traffic spike
     * or an attempt to exhaust memory with distinct keys; either way the maps are dropped and
     * rebuilt rather than allowed to grow without bound.
     */
    private static final int MAX_TRACKED_CLIENTS = 50_000;

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

    /**
     * Number of reverse proxies in front of the app that append to X-Forwarded-For. Behind
     * Azure App Service / Container Apps this is 1; add one more for a CDN or Front Door.
     * Set to 0 when the app is exposed directly, which makes the header be ignored entirely.
     */
    @Value("${app.rate-limit.trusted-proxy-count:1}")
    private int trustedProxyCount;

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
                ? bucketFor(credentialBuckets, key, credentialCapacity, credentialRefillTokens, credentialRefillMinutes)
                : bucketFor(generalBuckets, key, capacity, refillTokens, refillMinutes);

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

    private Bucket bucketFor(ConcurrentHashMap<String, Bucket> buckets,
                             String key,
                             long bucketCapacity,
                             long tokens,
                             long minutes) {
        Bucket existing = buckets.get(key);
        if (existing != null) {
            return existing;
        }
        if (buckets.size() >= MAX_TRACKED_CLIENTS) {
            // Dropping the map briefly forgives clients mid-window, which is the safer failure
            // mode: throttling is best-effort, running out of heap is not.
            log.warn("Rate limit bucket map hit {} entries; clearing to bound memory.", MAX_TRACKED_CLIENTS);
            buckets.clear();
        }
        return buckets.computeIfAbsent(key, ignored -> newBucket(bucketCapacity, tokens, minutes));
    }

    /**
     * Drops buckets that have refilled to capacity. A full bucket is indistinguishable from a
     * fresh one, so evicting it loses no throttling state while releasing the memory that idle
     * clients would otherwise hold forever.
     */
    @Scheduled(fixedDelayString = "${app.rate-limit.sweep-interval-ms:300000}")
    void evictIdleBuckets() {
        int removed = evictIdle(generalBuckets, capacity) + evictIdle(credentialBuckets, credentialCapacity);
        if (removed > 0) {
            log.debug("Evicted {} idle rate limit buckets.", removed);
        }
    }

    private int evictIdle(ConcurrentHashMap<String, Bucket> buckets, long fullCapacity) {
        int before = buckets.size();
        buckets.entrySet().removeIf(entry -> entry.getValue().getAvailableTokens() >= fullCapacity);
        return before - buckets.size();
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

    /**
     * Resolves the client address from the right-hand end of X-Forwarded-For.
     *
     * <p>The header is a client-supplied list that each proxy appends to, so the leftmost entry
     * is whatever the caller chose to send. Trusting it lets an attacker mint a fresh bucket per
     * request and bypass throttling altogether. Only the last {@code trustedProxyCount} entries
     * were written by infrastructure we control, so the client is the one just before them.
     */
    private String resolveClientKey(HttpServletRequest request) {
        String remoteAddr = request.getRemoteAddr();
        if (trustedProxyCount <= 0) {
            return remoteAddr;
        }
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded == null || forwarded.isBlank()) {
            return remoteAddr;
        }
        String[] hops = forwarded.split(",");
        int index = hops.length - trustedProxyCount;
        if (index < 0 || index >= hops.length) {
            // Fewer hops than expected: the request did not arrive through the usual chain, so
            // fall back to the socket address rather than trusting an unverified entry.
            return remoteAddr;
        }
        String candidate = hops[index].trim();
        return candidate.isEmpty() ? remoteAddr : candidate;
    }

    private Bucket newBucket(long bucketCapacity, long tokens, long minutes) {
        Refill refill = Refill.greedy(tokens, Duration.ofMinutes(minutes));
        Bandwidth limit = Bandwidth.classic(bucketCapacity, refill);
        return Bucket.builder().addLimit(limit).build();
    }

    /** Exposed for tests. */
    Map<String, Bucket> generalBucketsView() {
        return Map.copyOf(generalBuckets);
    }
}
