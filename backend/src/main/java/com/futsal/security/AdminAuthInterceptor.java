package com.futsal.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.io.IOException;
import java.util.regex.Pattern;

@Component
public class AdminAuthInterceptor implements HandlerInterceptor {

    private static final String HEADER_NAME = "Authorization";

    private static final Pattern SLOT_ID = Pattern.compile("^/api/slots/\\d+$");
    private static final Pattern BOOKING_ID = Pattern.compile("^/api/bookings/\\d+$");
    private static final Pattern BOOKING_STATUS = Pattern.compile("^/api/bookings/\\d+/status$");
    private static final Pattern BOOKING_USER = Pattern.compile("^/api/bookings/user/\\d+$");
    private static final Pattern USER_ID = Pattern.compile("^/api/users/\\d+$");

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws IOException {
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            return true;
        }

        String path = request.getRequestURI();
        String method = request.getMethod();

        if (isPublicRoute(path, method)) {
            return true;
        }

        String provided = request.getHeader(HEADER_NAME);

        if (SimpleAuth.isAdmin(provided)) {
            return true;
        }

        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.getWriter().write("{\"error\":\"Admin authorization required\"}");
        return false;
    }

    private boolean isPublicRoute(String path, String method) {
        if ("/api/users/register".equals(path) && "POST".equalsIgnoreCase(method)) {
            return true;
        }
        if ("/api/users/login".equals(path) && "POST".equalsIgnoreCase(method)) {
            return true;
        }
        if (path.startsWith("/api/futsals") && "GET".equalsIgnoreCase(method)) {
            return true;
        }
        if ("/api/slots".equals(path) && "GET".equalsIgnoreCase(method)) {
            return true;
        }
        if ("/api/slots/public".equals(path) && "GET".equalsIgnoreCase(method)) {
            return true;
        }
        if (SLOT_ID.matcher(path).matches() && "GET".equalsIgnoreCase(method)) {
            return true;
        }
        if ("/api/bookings".equals(path) && "POST".equalsIgnoreCase(method)) {
            return true;
        }
        if ("/api/payments/confirm".equals(path) && "POST".equalsIgnoreCase(method)) {
            return true;
        }
        if (BOOKING_USER.matcher(path).matches() && "GET".equalsIgnoreCase(method)) {
            return true;
        }
        if (BOOKING_ID.matcher(path).matches() && "GET".equalsIgnoreCase(method)) {
            return true;
        }
        if (BOOKING_STATUS.matcher(path).matches() && "PUT".equalsIgnoreCase(method)) {
            return true;
        }
        if (USER_ID.matcher(path).matches() && ("GET".equalsIgnoreCase(method) || "PUT".equalsIgnoreCase(method))) {
            return true;
        }
        return false;
    }
}
