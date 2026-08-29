# Port 5174 CORS 403 Fix

## What Was Wrong
Port 5174 was not properly configured in the CORS allowed origins, or the configuration was not being parsed correctly.

## What Was Fixed

### 1. Updated SecurityConfig.java
- **Changed**: `String[] allowedOrigins` → `String allowedOriginsString`
- **Reason**: Proper string parsing from properties file
- **Added**: Manual parsing and trimming of comma-separated origins
- **Added**: Logging to debug CORS configuration

### 2. Updated Allowed Origins List
The SecurityConfig now includes:
- `http://localhost:5173`
- `http://127.0.0.1:5173`
- **`http://localhost:5174`** ← Port 5174
- **`http://127.0.0.1:5174`** ← Port 5174
- `http://localhost:5175`
- `http://127.0.0.1:5175`

### 3. Fixed String Parsing
The @Value injection now properly handles:
- Comma-separated values with spaces
- Proper trimming of each origin URL
- Null/empty value checks

## Step-by-Step Fix Instructions

### Step 1: Rebuild Backend
```bash
cd /Users/abijit/Downloads/futsal-main/backend
mvn clean package -DskipTests
```

Wait for build to complete. You should see:
```
BUILD SUCCESS
```

### Step 2: Start Backend Server
```bash
# Option A: Run the JAR
java -jar target/futsal-booking-1.0.0.jar

# Option B: Run with Maven
mvn spring-boot:run
```

Wait for the backend to start. Look for this log message:
```
Configuring CORS for origins: [http://localhost:5173, http://127.0.0.1:5173, 
                               http://localhost:5174, http://127.0.0.1:5174,
                               http://localhost:5175, http://127.0.0.1:5175]
```

This confirms port 5174 is configured!

### Step 3: Start Frontend on Port 5174
```bash
cd /Users/abijit/Downloads/futsal-main/frontend
npm run dev -- --port 5174
```

### Step 4: Test Login
1. Open browser to: http://localhost:5174
2. Go to login page
3. Open Developer Tools (F12)
4. Go to Network tab
5. Try logging in
6. Look for:
   - **OPTIONS** request to `/api/users/login` → Should return **200 OK**
   - **POST** request to `/api/users/login` → Should return **200 OK**
7. Click on OPTIONS request → Check Response Headers tab

## Expected Response Headers for OPTIONS Request

```
Access-Control-Allow-Origin: http://localhost:5174
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS, PATCH
Access-Control-Allow-Headers: *
Access-Control-Allow-Credentials: true
Access-Control-Max-Age: 3600
```

If you see these headers → CORS is working ✅
If you see 403 → Troubleshoot (see below)

## Quick Test Command (Without Browser)

Run the test script:
```bash
/Users/abijit/Downloads/futsal-main/test-cors-5174.sh
```

This will:
1. Check if backend is running
2. Send OPTIONS request from port 5174
3. Verify all CORS headers are present
4. Show success or troubleshooting steps

## If Still Getting 403 Error

### Check 1: Backend Logs
Look for the CORS configuration log when backend starts:
```
Configuring CORS for origins: [...]
```

If you don't see this → Rebuild backend

### Check 2: Verify application.properties
```bash
grep "app.cors.allowed-origins" /Users/abijit/Downloads/futsal-main/backend/src/main/resources/application.properties
```

Should show port 5174 in the list.

### Check 3: Environment Variable Override
Check if `CORS_ALLOWED_ORIGINS` environment variable is overriding the config:
```bash
echo $CORS_ALLOWED_ORIGINS
```

If set and doesn't include port 5174, update it:
```bash
export CORS_ALLOWED_ORIGINS="http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174,http://localhost:5175,http://127.0.0.1:5175"
```

Then restart backend.

### Check 4: Browser Cache
- Clear browser cache (Cmd+Shift+Delete)
- Hard refresh (Cmd+Shift+R)
- Or use new private/incognito window

### Check 5: Port Conflicts
Make sure nothing else is using ports:
```bash
# Check port 9090 (backend)
lsof -i :9090

# Check port 5174 (frontend)
lsof -i :5174
```

### Check 6: Enable Debug Logging
Add to `application.properties`:
```
logging.level.org.springframework.security.web.FilterChainProxy=DEBUG
logging.level.org.springframework.web.cors=DEBUG
```

Restart backend and check logs when making login request.

## Files Modified

1. `/backend/src/main/java/com/futsal/security/SecurityConfig.java`
   - String parsing for allowed origins
   - Added logging for debugging
   - Proper CORS configuration

2. `/backend/src/main/resources/application.properties`  
   - Confirms port 5174 is in default list

## Summary

✅ Port 5174 is now explicitly included in CORS configuration
✅ Origins are properly parsed from properties file  
✅ Logging helps verify configuration is loaded
✅ Manual trimming ensures no whitespace issues
✅ Fallback defaults include all three ports (5173, 5174, 5175)

**The 403 error on port 5174 should now be fixed!**

