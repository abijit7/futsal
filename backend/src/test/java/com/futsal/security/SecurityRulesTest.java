package com.futsal.security;

import com.futsal.controller.BookingController;
import com.futsal.controller.FutsalController;
import com.futsal.controller.PaymentController;
import com.futsal.controller.ReviewController;
import com.futsal.controller.TimeSlotController;
import com.futsal.controller.UploadController;
import com.futsal.controller.UserController;
import com.futsal.model.User;
import com.futsal.model.enums.Role;
import com.futsal.repository.UserRepository;
import com.futsal.service.BookingService;
import com.futsal.service.FutsalService;
import com.futsal.service.PaymentGatewayService;
import com.futsal.service.RefundService;
import com.futsal.service.ReviewService;
import com.futsal.service.TimeSlotService;
import com.futsal.service.UserService;
import com.futsal.service.VerificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpMethod;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Locks down the HTTP authorization surface.
 *
 * <p>This exists because commit {@code 160328a} replaced the entire rule set with
 * {@code .requestMatchers("/api/**").permitAll()} while chasing a CORS/403 error, which silently
 * exposed every admin endpoint to anonymous callers. Nothing in the suite failed. If a future
 * change re-opens one of these routes, this test does.
 */
@WebMvcTest(controllers = {
        UserController.class,
        BookingController.class,
        FutsalController.class,
        TimeSlotController.class,
        UploadController.class,
        PaymentController.class,
        ReviewController.class
})
@Import({SecurityConfig.class, JwtAuthenticationFilter.class, JwtService.class, SecurityAuth.class})
@TestPropertySource(properties = {
        // The filters are real; the buckets must not throttle a parameterized sweep.
        "app.rate-limit.capacity=100000",
        "app.rate-limit.credential.capacity=100000"
})
class SecurityRulesTest {

    private static final long ADMIN_ID = 1L;
    private static final long USER_ID = 2L;

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtService jwtService;

    @MockBean private UserRepository userRepository;
    @MockBean private UserService userService;
    @MockBean private BookingService bookingService;
    @MockBean private FutsalService futsalService;
    @MockBean private TimeSlotService timeSlotService;
    @MockBean private VerificationService verificationService;
    @MockBean private PaymentGatewayService paymentGatewayService;
    @MockBean private ReviewService reviewService;
    @MockBean private RefundService refundService;
    @MockBean private java.time.Clock clock;

    private String adminToken;
    private String userToken;

    @BeforeEach
    void setUp() {
        User admin = user(ADMIN_ID, "admin@gmail.com", Role.ADMIN);
        User customer = user(USER_ID, "customer@gmail.com", Role.USER);

        // JwtAuthenticationFilter re-reads the user to compare authVersion on every request.
        when(userRepository.findById(ADMIN_ID)).thenReturn(Optional.of(admin));
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(customer));

        adminToken = jwtService.createToken(admin);
        userToken = jwtService.createToken(customer);

        // Public endpoints must return a real payload rather than NPE on an unstubbed mock.
        when(futsalService.getAll(any(), anyString(), any())).thenReturn(Page.empty());
        when(timeSlotService.getAvailableSlots(any(), any(), any())).thenReturn(Page.empty());
        when(timeSlotService.getPublicSlots(any(), any(), any())).thenReturn(Page.empty());
        when(timeSlotService.getAllSlots(any(), any(), any())).thenReturn(Page.empty());
        when(userService.getAllUsers(any(), any(), any())).thenReturn(Page.empty());
        when(bookingService.searchBookings(any(), any(), any(), any())).thenReturn(Page.empty());
    }

    /**
     * Every route here is admin-only. Anonymous callers must get 401 and signed-in customers 403 —
     * all of them returned 200 to anyone before the rules were restored.
     */
    @ParameterizedTest(name = "{0} {1} is admin-only")
    @CsvSource({
            "GET,    /api/users",
            "DELETE, /api/users/9",
            "GET,    /api/bookings",
            "DELETE, /api/bookings/9",
            "GET,    /api/payments/refunds",
            "POST,   /api/payments/refunds/9/confirm",
            "POST,   /api/futsals",
            "PUT,    /api/futsals/9",
            "DELETE, /api/futsals/9",
            "GET,    /api/slots/all",
            "POST,   /api/slots",
            "POST,   /api/slots/generate",
            "PUT,    /api/slots/9",
            "DELETE, /api/slots/9"
    })
    void adminRoutesRejectAnonymousAndCustomerCallers(String method, String path) throws Exception {
        mockMvc.perform(json(method, path, null))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(json(method, path, userToken))
                .andExpect(status().isForbidden());
    }

    /**
     * Authenticated-but-not-admin routes: anonymous is rejected, ownership is then enforced
     * imperatively by {@link SecurityAuth} inside the controllers.
     */
    @ParameterizedTest(name = "{0} {1} requires authentication")
    @CsvSource({
            "GET,  /api/users/2",
            "PUT,  /api/users/2",
            "PUT,  /api/users/2/password",
            "POST, /api/users/2/verification/email/request",
            "GET,  /api/bookings/9",
            "GET,  /api/bookings/user/2",
            "PUT,  /api/bookings/9/status",
            "POST, /api/payments/confirm",
            "POST, /api/payments/initiate",
            "POST, /api/payments/verify",
            "POST, /api/payments/cancel/9",
            "POST, /api/futsals/9/reviews",
            "PUT,  /api/reviews/9",
            "DELETE, /api/reviews/9",
            "GET,  /api/users/2/reviewed-bookings"
    })
    void protectedRoutesRejectAnonymousCallers(String method, String path) throws Exception {
        mockMvc.perform(json(method, path, null))
                .andExpect(status().isUnauthorized());
    }

    @ParameterizedTest(name = "{0} {1} stays public")
    @CsvSource({
            "GET,  /api/futsals",
            "GET,  /api/futsals/9",
            "GET,  /api/futsals/9/reviews",
            "GET,  /api/slots",
            "GET,  /api/slots/public",
            "POST, /api/users/login",
            "POST, /api/users/register",
            "POST, /api/users/forgot-password",
            "POST, /api/users/reset-password"
    })
    void publicRoutesRemainReachableAnonymously(String method, String path) throws Exception {
        int status = mockMvc.perform(json(method, path, null)).andReturn().getResponse().getStatus();

        // 400 is fine here - the empty body fails bean validation. What must never happen is the
        // request being turned away by the security layer.
        assertThat(status)
                .as("%s %s must not be gated by authentication", method, path)
                .isNotIn(401, 403);
    }

    @ParameterizedTest(name = "admin reaches {0} {1}")
    @CsvSource({
            "GET, /api/users",
            "GET, /api/bookings",
            "GET, /api/slots/all"
    })
    void adminTokenReachesAdminRoutes(String method, String path) throws Exception {
        mockMvc.perform(json(method, path, adminToken))
                .andExpect(status().isOk());
    }

    @org.junit.jupiter.api.Test
    void tamperedTokenIsRejected() throws Exception {
        mockMvc.perform(json("GET", "/api/users", adminToken + "x"))
                .andExpect(status().isUnauthorized());
    }

    @org.junit.jupiter.api.Test
    void tokenForADeletedUserIsRejected() throws Exception {
        when(userRepository.findById(ADMIN_ID)).thenReturn(Optional.empty());

        mockMvc.perform(json("GET", "/api/users", adminToken))
                .andExpect(status().isUnauthorized());
    }

    /** A password change bumps authVersion, which must invalidate tokens already in the wild. */
    @org.junit.jupiter.api.Test
    void tokenIsRejectedAfterAuthVersionBump() throws Exception {
        User rotated = user(ADMIN_ID, "admin@gmail.com", Role.ADMIN);
        rotated.setAuthVersion(1);
        when(userRepository.findById(ADMIN_ID)).thenReturn(Optional.of(rotated));

        mockMvc.perform(json("GET", "/api/users", adminToken))
                .andExpect(status().isUnauthorized());
    }

    @org.junit.jupiter.api.Test
    void actuatorMetricsIsNotPublic() throws Exception {
        mockMvc.perform(json("GET", "/actuator/metrics", null))
                .andExpect(status().isUnauthorized());
    }

    // ── helpers ───────────────────────────────────────────────────────────────

    private MockHttpServletRequestBuilder json(String method, String path, String token) {
        MockHttpServletRequestBuilder builder =
                MockMvcRequestBuilders.request(HttpMethod.valueOf(method.trim()), path.trim())
                        .contentType("application/json")
                        .content("{}");
        if (token != null) {
            builder = builder.header("Authorization", "Bearer " + token);
        }
        return builder;
    }

    private User user(Long id, String email, Role role) {
        User user = new User();
        user.setUserId(id);
        user.setEmail(email);
        user.setName("Test Person");
        user.setPhone("9812345678");
        user.setRole(role);
        user.setAuthVersion(0);
        return user;
    }
}
