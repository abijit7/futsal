package com.futsal.security;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class RateLimitFilter extends OncePerRequestFilter {
    private final ConcurrentHashMap<String, Bucket> buckets = new ConcurrentHashMap<>();

    @Value("${app.rate-limit.capacity:60}")
    private long capacity;

    @Value("${app.rate-limit.refill-tokens:60}")
    private long refillTokens;

    @Value("${app.rate-limit.refill-minutes:1}")
    private long refillMinutes;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        if (!shouldRateLimit(request)) {
            filterChain.doFilter(request, response);
            return;
        }

        String key = resolveClientKey(request);
        Bucket bucket = buckets.computeIfAbsent(key, ignored -> newBucket());

        if (bucket.tryConsume(1)) {
            response.setHeader("X-Rate-Limit-Remaining", String.valueOf(bucket.getAvailableTokens()));
            filterChain.doFilter(request, response);
            return;
        }

        response.setStatus(429);
        response.setContentType("application/json");
        response.getWriter().write("{\"error\":\"Too many requests\"}");
    }

    private boolean shouldRateLimit(HttpServletRequest request) {
        String path = request.getRequestURI();
        if (!path.startsWith("/api")) {
            return false;
        }
        String method = request.getMethod();
        return !("GET".equalsIgnoreCase(method) || "HEAD".equalsIgnoreCase(method));
    }

    private String resolveClientKey(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    private Bucket newBucket() {
        Refill refill = Refill.greedy(refillTokens, Duration.ofMinutes(refillMinutes));
        Bandwidth limit = Bandwidth.classic(capacity, refill);
        return Bucket.builder().addLimit(limit).build();
    }
}

