package com.futsal.security;

import com.futsal.model.enums.Role;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.util.Collection;
import java.util.List;

public record JwtPrincipal(Long userId, String email, Role role, int authVersion) {

    public Collection<? extends GrantedAuthority> authorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + role.name()));
    }

    public boolean isAdmin() {
        return role != null && Role.ADMIN.name().equals(role.name());
    }
}
