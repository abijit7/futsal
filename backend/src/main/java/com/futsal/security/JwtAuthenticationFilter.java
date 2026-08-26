package com.futsal.security;

import com.futsal.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final String BEARER_PREFIX = "Bearer ";

    private final JwtService jwtService;
    private final UserRepository userRepository;

    public JwtAuthenticationFilter(JwtService jwtService, UserRepository userRepository) {
        this.jwtService = jwtService;
        this.userRepository = userRepository;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String authorizationHeader = request.getHeader("Authorization");
        if (authorizationHeader == null || authorizationHeader.isBlank()) {
            filterChain.doFilter(request, response);
            return;
        }

        if (!authorizationHeader.startsWith(BEARER_PREFIX)) {
            SecurityContextHolder.clearContext();
            filterChain.doFilter(request, response);
            return;
        }

        try {
            String token = authorizationHeader.substring(BEARER_PREFIX.length()).trim();
            JwtPrincipal principal = jwtService.parseToken(token);
            boolean currentVersion = userRepository.findById(principal.userId())
                    .map(user -> user.getAuthVersion() == principal.authVersion())
                    .orElse(false);
            if (!currentVersion) {
                throw new IllegalArgumentException("JWT session is no longer valid");
            }
            UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                    principal,
                    null,
                    principal.authorities()
            );
            authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
            SecurityContextHolder.getContext().setAuthentication(authentication);
        } catch (RuntimeException ex) {
            SecurityContextHolder.clearContext();
        }

        filterChain.doFilter(request, response);
    }
}
