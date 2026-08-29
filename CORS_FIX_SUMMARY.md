# CORS 403 Error Fix - Summary

## Problem
The frontend was receiving a 403 Forbidden error when attempting to login. The issue was caused by improper CORS (Cross-Origin Resource Sharing) configuration and OPTIONS request handling.

## Root Causes Identified

1. **Duplicate CORS Configuration**: There were two separate CORS configurations:
   - WebMvc-level CORS in `CorsConfig` (using `addCorsMappings()`)
   - Spring Security default CORS (using `Customizer.withDefaults()`)
   
   These weren't synchronized, causing preflight (OPTIONS) requests to fail with 403.

2. **HTTP OPTIONS Requests Not Handled**: The `JwtAuthenticationFilter` was not explicitly skipping OPTIONS requests (CORS preflight). These preflight requests should always be allowed without JWT validation.

## Changes Made

### 1. **SecurityConfig.java** - Centralized CORS Configuration
   - Added `CorsConfigurationSource` bean directly in SecurityConfig
   - Configured to allow all required HTTP methods (GET, POST, PUT, DELETE, OPTIONS, PATCH)
   - Configured to allow all headers (`*`)
   - Enabled credentials support for authentication tokens
   - Set CORS max-age to 3600 seconds
   - Changed from `.cors(Customizer.withDefaults())` to `.cors(cors -> cors.configurationSource(corsSource))`

### 2. **JwtAuthenticationFilter.java** - OPTIONS Request Handling
   - Added explicit check to skip JWT processing for OPTIONS requests
   - OPTIONS requests are now passed through without token validation
   - This allows CORS preflight requests to complete successfully

### 3. **CorsConfig.java** - Simplified Configuration
   - Removed the duplicate `corsConfigurationSource()` bean
   - Kept only the `addResourceHandlers()` for serving static files
   - Removed `addCorsMappings()` since Spring Security now handles CORS centrally

## Testing the Fix

### Step 1: Rebuild the Backend
```bash
cd /Users/abijit/Downloads/futsal-main/backend
mvn clean package  # or use ./mvnw if Maven wrapper is available
```

### Step 2: Start the Backend Server
```bash
# Option A: Run JAR directly
java -jar target/futsal-booking-1.0.0.jar

# Option B: Run with Maven
mvn spring-boot:run
```

### Step 3: Test Login from Frontend
1. Start the frontend development server (if not running):
   ```bash
   cd /Users/abijit/Downloads/futsal-main/frontend
   npm run dev
   ```

2. Open browser to http://localhost:5173

3. Try logging in with valid credentials

4. **Monitor Network Tab**: 
   - Open Developer Tools (F12)
   - Go to Network tab
   - Look for the login POST request
   - Check the preceding OPTIONS request should return 200 OK (not 403)
   - The login POST should also return 200 OK with auth token

## Expected Behavior After Fix

✅ OPTIONS request returns 200 with CORS headers:
- `Access-Control-Allow-Origin: http://localhost:5173`
- `Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS, PATCH`
- `Access-Control-Allow-Headers: *`
- `Access-Control-Allow-Credentials: true`

✅ POST /api/users/login returns 200 with user data and authToken

✅ Login succeeds and user is redirected to dashboard

## Troubleshooting

If you still see 403 errors:

1. **Check frontend origin**: Verify the frontend is running on one of the allowed origins:
   - http://localhost:5173
   - http://127.0.0.1:5173
   - http://localhost:5174
   - http://127.0.0.1:5174
   - http://localhost:5175
   - http://127.0.0.1:5175

2. **Check CORS configuration**: Verify `app.cors.allowed-origins` property in `application.properties`

3. **Check browser console**: Look for specific error messages about CORS in the browser console

4. **Enable debug logging**: Add to `application.properties`:
   ```properties
   logging.level.org.springframework.security.web.FilterChainProxy=DEBUG
   logging.level.org.springframework.web.cors=DEBUG
   ```

5. **Verify backend is running on correct port**: Should be http://localhost:9090 (default)

## Files Modified

1. `/backend/src/main/java/com/futsal/security/SecurityConfig.java`
2. `/backend/src/main/java/com/futsal/security/JwtAuthenticationFilter.java`
3. `/backend/src/main/java/com/futsal/controller/CorsConfig.java`

## Security Notes

- Credentials are enabled for CORS (needed for cookie/token-based auth)
- OPTIONS requests are allowed without authentication (CORS requirement)
- Login endpoint is explicitly permitted without JWT tokens
- All other requests respect the security filter chain

