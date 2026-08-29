# CORS 403 Debug Guide

This guide helps you identify exactly where the 403 error is coming from.

## Step 1: Enable Debug Logging

Add these lines to `/backend/src/main/resources/application.properties`:

```properties
# Debug logging for CORS and Security
logging.level.org.springframework.security.web.FilterChainProxy=DEBUG
logging.level.org.springframework.web.cors=DEBUG
logging.level.org.springframework.security=DEBUG
```

Then restart the backend.

## Step 2: Check Browser Network Tab

When you try to login:

1. Open Developer Tools (F12 or Cmd+Option+I on Mac)
2. Go to **Network** tab
3. Keep the log
4. Try to login
5. Look for two requests:
   - **First**: OPTIONS /api/users/login (preflight)
   - **Second**: POST /api/users/login (actual request)

### What to look for:

#### If OPTIONS returns 403:
- The CORS preflight is failing
- Check Response Headers for CORS headers
- Check Console for CORS error messages about accessing from http://localhost:5173

#### If OPTIONS returns 200:
- Then check POST request
- If POST returns 403, it's an authorization issue, not CORS

## Step 3: Check Response Headers

Click on the OPTIONS or POST request and check:
- **Response Headers** tab should show:
  ```
  Access-Control-Allow-Origin: http://localhost:5173
  Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS, PATCH
  Access-Control-Allow-Headers: *
  Access-Control-Allow-Credentials: true
  ```

If these headers are missing → CORS not configured properly
If headers are present but frontend still gets 403 → Check browser console for specific errors

## Step 4: Check Backend Console

Look for these log messages when making the login request:

```
DEBUG org.springframework.security.web.FilterChainProxy : Security filter chain: [
  ...
  org.springframework.security.web.cors.CorsFilter
  org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter
  ...
]
```

The **CorsFilter** should appear before authentication filters.

### OPTIONS request should log:
```
DEBUG org.springframework.web.cors : Handling preflight CORS request
```

## Step 5: Verify Current Configuration

Run this command to see current CORS settings:

```bash
cd /Users/abijit/Downloads/futsal-main/backend
grep -n "app.cors\|CORS\|corsConfiguration" src/main/resources/application.properties
```

Should show:
```
app.cors.allowed-origins=http://localhost:5173,http://127.0.0.1:5173,...
```

## Step 6: Test with cURL (Skip Browser CORS)

To test if the backend login works without browser CORS restrictions:

```bash
# Test login endpoint directly
curl -X POST http://localhost:9090/api/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

If this works and returns user data with authToken → Backend works, issue is CORS
If this fails with 403 → Backend has an authentication issue

## Step 7: Test OPTIONS Request

```bash
# Test CORS preflight
curl -X OPTIONS http://localhost:9090/api/users/login \
  -H "Origin: http://localhost:5173" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -v
```

Should return 200 with CORS headers like:
```
Access-Control-Allow-Origin: http://localhost:5173
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS, PATCH
Access-Control-Allow-Credentials: true
```

## Common Issues & Solutions

### Issue 1: OPTIONS returns 403
**Cause**: CORS filter not running or not configured correctly
**Solution**: Verify SecurityConfig has `.cors(cors -> cors.configurationSource(corsSource))`

### Issue 2: Origin not allowed
**Cause**: Frontend origin not in allowed list
**Solution**: Check application.properties: `app.cors.allowed-origins` includes http://localhost:5173

### Issue 3: Credentials not allowed
**Cause**: CORS not configured to allow credentials
**Solution**: Verify `configuration.setAllowCredentials(true)` in SecurityConfig

### Issue 4: Headers not accessible
**Cause**: Not exposing auth token header
**Solution**: Ensure `configuration.setAllowedHeaders(Arrays.asList("*"))` is set

## What the 403 Error Actually Means

When you see "403 Forbidden during login":

1. **Browser Level**: Browser blocked the request due to CORS
   - This happens BEFORE the actual POST request
   - Error shows in browser console

2. **Server Level**: Server returned 403 for some reason
   - This happens when request reaches server
   - Usually authorization issue, not CORS

## Quick Test Checklist

- [ ] Backend is running on http://localhost:9090
- [ ] Frontend is running on http://localhost:5173
- [ ] Backend logs show CorsFilter in security filter chain
- [ ] OPTIONS preflight returns 200 OK
- [ ] POST login returns 200 OK (or 401 if invalid credentials, not 403)
- [ ] CORS headers include Access-Control-Allow-Origin: http://localhost:5173
- [ ] Browser console shows no CORS errors

If all checkboxes pass → 403 error should be fixed

