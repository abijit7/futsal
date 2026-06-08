package com.futsal.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.authorization.AuthorizationDecision;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.access.intercept.RequestAuthorizationContext;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.util.matcher.RegexRequestMatcher;

import java.util.Map;
import java.util.function.Supplier;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final ObjectMapper objectMapper;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter, ObjectMapper objectMapper) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
        this.objectMapper = objectMapper;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .cors(Customizer.withDefaults())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(exceptions -> exceptions
                        .authenticationEntryPoint((request, response, authException) ->
                                writeError(response, HttpServletResponse.SC_UNAUTHORIZED, "Authentication required"))
                        .accessDeniedHandler((request, response, accessDeniedException) ->
                                writeError(response, HttpServletResponse.SC_FORBIDDEN, "Access denied"))
                )
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers("/uploads/**").permitAll()
                        .requestMatchers("/actuator/health", "/actuator/info").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/users/register", "/api/users/login").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/futsals/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/slots", "/api/slots/public").permitAll()
                        .requestMatchers(new RegexRequestMatcher("^/api/slots/\\d+$", "GET")).permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/users").access(SecurityConfig::isAdminRequest)
                        .requestMatchers(HttpMethod.DELETE, "/api/users/**").access(SecurityConfig::isAdminRequest)
                        .requestMatchers(HttpMethod.GET, "/api/bookings").access(SecurityConfig::isAdminRequest)
                        .requestMatchers(HttpMethod.DELETE, "/api/bookings/**").access(SecurityConfig::isAdminRequest)
                        .requestMatchers(HttpMethod.POST, "/api/futsals").access(SecurityConfig::isAdminRequest)
                        .requestMatchers(HttpMethod.PUT, "/api/futsals/**").access(SecurityConfig::isAdminRequest)
                        .requestMatchers(HttpMethod.DELETE, "/api/futsals/**").access(SecurityConfig::isAdminRequest)
                        .requestMatchers(HttpMethod.GET, "/api/slots/all").access(SecurityConfig::isAdminRequest)
                        .requestMatchers(HttpMethod.POST, "/api/slots").access(SecurityConfig::isAdminRequest)
                        .requestMatchers(HttpMethod.PUT, "/api/slots/**").access(SecurityConfig::isAdminRequest)
                        .requestMatchers(HttpMethod.DELETE, "/api/slots/**").access(SecurityConfig::isAdminRequest)
                        .requestMatchers(HttpMethod.POST, "/api/uploads/**").access(SecurityConfig::isAdminRequest)
                        .requestMatchers("/api/**").authenticated()
                        .anyRequest().permitAll()
                )
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
