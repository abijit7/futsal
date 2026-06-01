package com.futsal.security;

public final class SimpleAuth {

    private static final String ADMIN_ENV_NAME = "ADMIN_TOKEN";

    private SimpleAuth() {}

    public static boolean isAdmin(String providedToken) {
        String expected = System.getenv().getOrDefault(ADMIN_ENV_NAME, "admin123");
        return expected != null && expected.equals(providedToken);
    }

    public static Long parseUserId(String providedUserId) {
        if (providedUserId == null || providedUserId.isBlank()) {
            return null;
        }
        try {
            return Long.parseLong(providedUserId.trim());
        } catch (NumberFormatException ex) {
            throw new RuntimeException("Invalid user header");
        }
    }

    public static void requireAdmin(String adminHeader) {
        if (!isAdmin(adminHeader)) {
            throw new RuntimeException("Admin authorization required");
        }
    }

    public static void requireUserOrAdmin(Long targetUserId, String userHeader, String adminHeader) {
        if (isAdmin(adminHeader)) {
            return;
        }
        Long requesterId = parseUserId(userHeader);
        if (requesterId == null || !requesterId.equals(targetUserId)) {
            throw new RuntimeException("User authorization required");
        }
    }
}

