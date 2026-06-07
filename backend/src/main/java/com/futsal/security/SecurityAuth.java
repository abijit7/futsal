package com.futsal.security;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component
public class SecurityAuth {

    public JwtPrincipal currentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()
                || !(authentication.getPrincipal() instanceof JwtPrincipal principal)) {
            throw new AuthRequiredException("User authorization required");
        }
        return principal;
    }

    public boolean isAdmin() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication != null
                && authentication.isAuthenticated()
                && authentication.getPrincipal() instanceof JwtPrincipal principal
                && principal.isAdmin();
    }

    public void requireAdmin() {
        JwtPrincipal principal = currentUser();
        if (!principal.isAdmin()) {
            throw new AuthForbiddenException("Admin authorization required");
        }
    }

    public void requireUserOrAdmin(Long targetUserId) {
        JwtPrincipal principal = currentUser();
        if (principal.isAdmin() || principal.userId().equals(targetUserId)) {
            return;
        }
        throw new AuthForbiddenException("User authorization required");
    }

    public String actorFor(Long targetUserId) {
        JwtPrincipal principal = currentUser();
        return principal.isAdmin() ? "admin" : "user:" + targetUserId;
    }
}
