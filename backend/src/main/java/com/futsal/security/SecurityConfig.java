package com.futsal.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.authorization.AuthorizationDecision;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.access.intercept.RequestAuthorizationContext;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.util.matcher.RegexRequestMatcher;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

import java.util.Arrays;
import java.util.Map;
import java.util.function.Supplier;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private static final Logger logger = LoggerFactory.getLogger(SecurityConfig.class);

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final ObjectMapper objectMapper;

    @Value("${app.cors.allowed-origins:http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174,http://localhost:5175,http://127.0.0.1:5175}")
    private String allowedOriginsString;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter, ObjectMapper objectMapper) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
        this.objectMapper = objectMapper;
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        // Parse comma-separated allowed origins and trim whitespace
        java.util.List<String> origins = new java.util.ArrayList<>();
        if (allowedOriginsString != null && !allowedOriginsString.trim().isEmpty()) {
            String[] originArray = allowedOriginsString.split(",");
            for (String origin : originArray) {
                String trimmed = origin.trim();
                if (!trimmed.isEmpty()) {
                    origins.add(trimmed);
                }
            }
        }

        logger.info("Configuring CORS for origins: {}", origins);

        configuration.setAllowedOrigins(origins);
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    /**
     * Registered as a top-level servlet filter ahead of RequestIdFilter, RateLimitFilter and
     * Spring Security's chain, so preflight requests and error responses alike carry CORS headers.
     */
    @Bean
    @Order(Ordered.HIGHEST_PRECEDENCE)
    public CorsFilter corsFilter() {
        return new CorsFilter(corsConfigurationSource());
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                // This chain serves JSON and, at /uploads/**, venue images. Nothing it returns
                // should ever execute script or be framed, so the policy is deny-by-default with
                // images re-allowed for direct navigation to an upload URL.
                .headers(headers -> headers
                        .contentSecurityPolicy(csp -> csp.policyDirectives(
                                "default-src 'none'; img-src 'self' data:; frame-ancestors 'none'; "
                                        + "base-uri 'none'; form-action 'none'"))
                        .frameOptions(frame -> frame.deny())
                        .referrerPolicy(referrer -> referrer.policy(
                                org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter
                                        .ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN))
                        // Only emitted on requests Spring sees as HTTPS, which is why
                        // server.forward-headers-strategy=framework matters behind Azure's proxy.
                        .httpStrictTransportSecurity(hsts -> hsts
                                .includeSubDomains(true)
                                .maxAgeInSeconds(31536000))
                )
                .exceptionHandling(exceptions -> exceptions
                        .authenticationEntryPoint((request, response, authException) ->
                                writeError(response, HttpServletResponse.SC_UNAUTHORIZED, "Authentication required"))
                        .accessDeniedHandler((request, response, accessDeniedException) ->
                                writeError(response, HttpServletResponse.SC_FORBIDDEN, "Access denied"))
                )
                .authorizeHttpRequests(auth -> auth
                        // CORS preflight and Spring Boot's internal error dispatch
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers("/error").permitAll()

                        // Public assets and operational probes
                        .requestMatchers("/uploads/**").permitAll()
                        .requestMatchers("/actuator/health", "/actuator/info").permitAll()

                        // Public authentication and account recovery
                        .requestMatchers(HttpMethod.POST,
                                "/api/users/login",
                                "/api/users/register",
                                "/api/users/forgot-password",
                                "/api/users/reset-password").permitAll()

                        // Public catalogue browsing
                        .requestMatchers(HttpMethod.GET, "/api/futsals/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/slots", "/api/slots/public").permitAll()
                        .requestMatchers(new RegexRequestMatcher("^/api/slots/\\d+$", "GET")).permitAll()

                        // Reviews: anyone may read them, any signed-in customer may write one.
                        // Declared explicitly so that broadening the /api/futsals admin matchers
                        // below can never silently turn reviewing into an admin-only action.
                        .requestMatchers(HttpMethod.GET, "/api/futsals/*/reviews").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/futsals/*/reviews").authenticated()
                        .requestMatchers(HttpMethod.PUT, "/api/reviews/*").authenticated()
                        .requestMatchers(HttpMethod.DELETE, "/api/reviews/*").authenticated()

                        // Admin-only administration
                        .requestMatchers(HttpMethod.GET, "/api/users").access(SecurityConfig::isAdminRequest)
                        .requestMatchers(HttpMethod.DELETE, "/api/users/**").access(SecurityConfig::isAdminRequest)
                        .requestMatchers(HttpMethod.GET, "/api/bookings").access(SecurityConfig::isAdminRequest)
                        .requestMatchers(HttpMethod.DELETE, "/api/bookings/**").access(SecurityConfig::isAdminRequest)
                        .requestMatchers(HttpMethod.POST, "/api/futsals").access(SecurityConfig::isAdminRequest)
                        .requestMatchers(HttpMethod.PUT, "/api/futsals/**").access(SecurityConfig::isAdminRequest)
                        .requestMatchers(HttpMethod.DELETE, "/api/futsals/**").access(SecurityConfig::isAdminRequest)
                        .requestMatchers(HttpMethod.GET, "/api/slots/all").access(SecurityConfig::isAdminRequest)
                        .requestMatchers(HttpMethod.POST, "/api/slots/generate").access(SecurityConfig::isAdminRequest)
                        .requestMatchers(HttpMethod.POST, "/api/slots").access(SecurityConfig::isAdminRequest)
                        .requestMatchers(HttpMethod.PUT, "/api/slots/**").access(SecurityConfig::isAdminRequest)
                        .requestMatchers(HttpMethod.DELETE, "/api/slots/**").access(SecurityConfig::isAdminRequest)
                        .requestMatchers(HttpMethod.POST, "/api/uploads/**").access(SecurityConfig::isAdminRequest)

                        // Everything else - including /actuator/metrics - needs a valid token.
                        // Ownership checks live in SecurityAuth, called from the controllers.
                        .anyRequest().authenticated()
                )
                .addFilterBefore(corsFilter(), UsernamePasswordAuthenticationFilter.class)
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    private void writeError(HttpServletResponse response, int status, String message) throws java.io.IOException {
        response.setStatus(status);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        objectMapper.writeValue(response.getWriter(), Map.of("error", message));
    }

    private static AuthorizationDecision isAdminRequest(
            Supplier<Authentication> authenticationSupplier,
            RequestAuthorizationContext context
    ) {
        Authentication authentication = authenticationSupplier.get();
        boolean isAdmin = authentication != null
                && authentication.isAuthenticated()
                && (authentication.getPrincipal() instanceof JwtPrincipal principal && principal.isAdmin()
                || authentication.getAuthorities().stream()
                        .anyMatch(authority -> "ROLE_ADMIN".equals(authority.getAuthority())));
        return new AuthorizationDecision(isAdmin);
    }
}
