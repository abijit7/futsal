package com.futsal.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.futsal.model.User;
import com.futsal.model.enums.Role;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class JwtServiceTest {

    private final JwtService jwtService = new JwtService(
            new ObjectMapper(),
            "test-futsal-jwt-secret-with-at-least-32-bytes",
            60,
            "futsal-booking-test"
    );

    @Test
    void createsAndParsesJwtPrincipal() {
        User user = new User();
        user.setUserId(42L);
        user.setEmail("player@gmail.com");
        user.setRole(Role.USER);

        JwtPrincipal principal = jwtService.parseToken(jwtService.createToken(user));

        assertEquals(42L, principal.userId());
        assertEquals("player@gmail.com", principal.email());
        assertEquals(Role.USER, principal.role());
    }

    @Test
    void rejectsTamperedToken() {
        User user = new User();
        user.setUserId(1L);
        user.setEmail("admin@gmail.com");
        user.setRole(Role.ADMIN);

        String token = jwtService.createToken(user);
        String tampered = token.substring(0, token.length() - 2) + "xx";

        assertThrows(IllegalArgumentException.class, () -> jwtService.parseToken(tampered));
    }
}
