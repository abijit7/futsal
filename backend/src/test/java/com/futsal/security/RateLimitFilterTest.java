package com.futsal.security;

import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class RateLimitFilterTest {

    private static final String PROXY_HOP = "10.0.0.7";

    private RateLimitFilter filter;

    @BeforeEach
    void setUp() {
        filter = new RateLimitFilter();
        // Small buckets keep the tests quick; the refill windows are long enough that nothing
        // refills mid-test.
        ReflectionTestUtils.setField(filter, "capacity", 3L);
        ReflectionTestUtils.setField(filter, "refillTokens", 3L);
        ReflectionTestUtils.setField(filter, "refillMinutes", 1L);
        ReflectionTestUtils.setField(filter, "credentialCapacity", 2L);
        ReflectionTestUtils.setField(filter, "credentialRefillTokens", 2L);
        ReflectionTestUtils.setField(filter, "credentialRefillMinutes", 15L);
        ReflectionTestUtils.setField(filter, "trustedProxyCount", 1);
    }

    private MockHttpServletResponse call(String path, String forwardedFor) throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", path);
        request.setRequestURI(path);
        request.setRemoteAddr("203.0.113.9");
        if (forwardedFor != null) {
            request.addHeader("X-Forwarded-For", forwardedFor);
        }
        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain chain = new MockFilterChain();
        filter.doFilter(request, response, chain);
        return response;
    }

    @Test
    void throttlesOnceTheBucketIsDrained() throws Exception {
        for (int i = 0; i < 3; i++) {
            assertEquals(200, call("/api/futsals", "198.51.100.4, " + PROXY_HOP).getStatus(),
                    "request " + i + " should be allowed");
        }
        MockHttpServletResponse blocked = call("/api/futsals", "198.51.100.4, " + PROXY_HOP);
        assertEquals(429, blocked.getStatus());
        assertEquals("60", blocked.getHeader("Retry-After"));
    }

    /**
     * The client half of X-Forwarded-For is attacker-supplied. Keying on it would let a caller
     * mint a fresh bucket per request and bypass throttling entirely, so the filter reads the
     * hop the trusted proxy appended instead.
     */
    @Test
    void spoofedForwardedForEntriesShareOneBucket() throws Exception {
        for (int i = 0; i < 3; i++) {
            assertEquals(200, call("/api/futsals", "10.1.1." + i + ", " + PROXY_HOP).getStatus());
        }
        assertEquals(429, call("/api/futsals", "10.9.9.9, " + PROXY_HOP).getStatus(),
                "a new forged leftmost entry must not earn a fresh bucket");
    }

    @Test
    void credentialEndpointsUseTheTighterBucket() throws Exception {
        assertEquals(200, call("/api/users/login", null).getStatus());
        assertEquals(200, call("/api/users/login", null).getStatus());
        MockHttpServletResponse blocked = call("/api/users/login", null);
        assertEquals(429, blocked.getStatus());
        assertEquals("900", blocked.getHeader("Retry-After"));

        // The general bucket is separate, so browsing still works after login is throttled.
        assertEquals(200, call("/api/futsals", null).getStatus());
    }

    @Test
    void nonApiPathsAndPreflightAreNotThrottled() throws Exception {
        for (int i = 0; i < 10; i++) {
            assertEquals(200, call("/uploads/photo.jpg", null).getStatus());
        }

        MockHttpServletRequest preflight = new MockHttpServletRequest("OPTIONS", "/api/futsals");
        preflight.setRequestURI("/api/futsals");
        preflight.setRemoteAddr("203.0.113.9");
        MockHttpServletResponse response = new MockHttpServletResponse();
        for (int i = 0; i < 10; i++) {
            filter.doFilter(preflight, response, new MockFilterChain());
        }
        assertEquals(200, response.getStatus());
    }

    @Test
    void idleBucketsAreEvicted() throws Exception {
        call("/api/futsals", "198.51.100.4, " + PROXY_HOP);
        assertEquals(1, filter.generalBucketsView().size());

        // A partly drained bucket still holds throttling state and must survive the sweep.
        filter.evictIdleBuckets();
        assertEquals(1, filter.generalBucketsView().size());

        // Once refilled to capacity it is indistinguishable from a fresh bucket, so it goes.
        ReflectionTestUtils.setField(filter, "capacity", 0L);
        filter.evictIdleBuckets();
        assertTrue(filter.generalBucketsView().isEmpty());
    }
}
