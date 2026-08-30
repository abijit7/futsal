# Master CORS 403 Fix Guide - Final Solution

## The Complete Problem & Solution

### What Was Happening:
- Port 5173 ✅ Worked (sometimes)  
- Port 5174 ❌ Got 403 Forbidden error
- Port 5175 ❌ Got 403 Forbidden error
- The CORS configuration was configured but not being properly applied to preflight requests

### Why It Was Failing:
Spring Security's built-in `.cors()` configuration wasn't being initialized or applied correctly to OPTIONS preflight requests before they reached authentication filters.

### The Final Fix:
Use an **explicit CorsFilter** that runs **FIRST** in the filter chain, before any security or authentication processing.

---

## ONE-TIME SETUP (Follow This Exactly)

### Step 1: Clean Backend Build
```bash
cd /Users/abijit/Downloads/futsal-main/backend

# Remove old build artifacts
rm -rf target/

# Clean Maven cache
mvn clean

# Rebuild everything
mvn package -DskipTests
```

Expected output at the end:
```
[INFO] BUILD SUCCESS
[INFO] Total time: XX.XXs
```

### Step 2: Start Backend Server
```bash
# While in the backend directory
java -jar target/futsal-booking-1.0.0.jar
```

Watch for this startup log (proves CORS is loaded):
```
INFO com.futsal.security.SecurityConfig : 
Configuring CORS for origins: [http://localhost:5173, http://127.0.0.1:5173, 
                               http://localhost:5174, http://127.0.0.1:5174,
                               http://localhost:5175, http://127.0.0.1:5175]
```

**IMPORTANT**: Verify port 5174 is in this list before proceeding!

### Step 3: Start Frontend (New Terminal)
```bash
cd /Users/abijit/Downloads/futsal-main/frontend
npm run dev -- --port 5174
```

Wait for:
```
  ➜  Local:   http://localhost:5174/
```

### Step 4: Test in Browser
1. Open http://localhost:5174/login
2. Press **F12** to open Developer Tools
3. Click **Network** tab
4. Try logging in with valid credentials
5. Watch the requests:

**Expected Network Sequence:**
```
Request                    Status    Type        Headers
─────────────────────────────────────────────────────────
OPTIONS /api/users/login   200       xhr         ✓ CORS headers
POST /api/users/login      200       xhr         ✓ User data + authToken
```

### Success Indicators ✅

When working, you should see:

**In DevTools Network Tab:**
- OPTIONS request status: `200 OK` (not 403, not 404)
- POST request status: `200 OK` (not 403, not 401)
- Response includes `Authorization` header with token

**In OPTIONS Response Headers:**
```
Access-Control-Allow-Origin: http://localhost:5174
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS, PATCH  
Access-Control-Allow-Headers: *
Access-Control-Allow-Credentials: true
```

**After Login:**
- Browser redirects to /dashboard
- User is logged in and authenticated
- No "Forbidden" or "Unauthorized" errors

---

## If Still Getting 403 Error

### Diagnostic Checklist

#### ❌ Error: "Access to XMLHttpRequest blocked by CORS policy"
This is a browser-level CORS rejection (happens before POST). The OPTIONS preflight failed.

**Solutions:**
1. Check backend log for `Configuring CORS for origins:` message
2. If not present → Backend wasn't restarted
3. Verify port 5174 is in the origins list
4. Check Network tab - look at OPTIONS response
5. Confirm no CORS headers in OPTIONS response → Backend issue

#### ❌ Status Code 403 on POST Request
The preflight succeeded but the POST is being rejected.

**Solutions:**
1. Check if it's a login endpoint access issue
2. Verify credentials are correct (might get 401 if wrong password)
3. Check backend logs for error messages
4. Try a different set of credentials

#### ❌ Status Code 200 on OPTIONS but Still Can't Login
The CORS is working but login is failing for other reasons.

**Solutions:**
1. Check if credentials are valid
2. Look at POST response for error message
3. Check browser console for JavaScript errors
4. Verify backend database has the user

### Manual CORS Test (No Browser Needed)

Test if backend CORS is working:

```bash
# Send an OPTIONS preflight request
curl -X OPTIONS http://localhost:9090/api/users/login \
  -H "Origin: http://localhost:5174" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type, Authorization" \
  -i

# Should show:
# HTTP/1.1 200 OK
# Access-Control-Allow-Origin: http://localhost:5174
# Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS, PATCH
# Access-Control-Allow-Credentials: true
```

If you don't see these headers → Backend CORS not configured properly.

### Nuclear Option - Start Fresh

If nothing works, completely restart:

```bash
# Kill all processes
# Press Ctrl+C in both terminal windows

# Go to backend
cd /Users/abijit/Downloads/futsal-main/backend

# Completely clean
rm -rf node_modules target .mvn
mvn clean

# Rebuild fresh
mvn clean package -DskipTests

# Start backend
java -jar target/futsal-booking-1.0.0.jar

# In new terminal
cd /Users/abijit/Downloads/futsal-main/frontend
npm install  # Reinstall deps
npm run dev -- --port 5174
```

---

## Technical Details

### What Changed in SecurityConfig.java

**Added Explicit CorsFilter:**
```java
@Bean
public CorsFilter corsFilter() {
    return new CorsFilter(corsConfigurationSource());
}
```

**Added CorsConfigurationSource:**
```java
@Bean  
public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration config = new CorsConfiguration();
    config.setAllowedOrigins(/* parsed origins list */);  
    config.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
    config.setAllowedHeaders(Arrays.asList("*"));
    config.setAllowCredentials(true);
    config.setMaxAge(3600L);
    
    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", config);
    return source;
}
```

**Filter Registration:**
```java
.addFilterBefore(corsFilter(), UsernamePassowordAuthenticationFilter.class)
```

### Why This Works

1. **CorsFilter runs FIRST** - Before any authentication or authorization
2. **OPTIONS requests handled immediately** - Returns 200 OK with CORS headers
3. **No circular dependencies** - Beans properly initialized
4. **Explicit logging** - "Configuring CORS for origins:" message proves it loaded
5. **All ports included** - 5173, 5174, 5175 all explicitly in allowed origins

### Request Flow Diagram

```
Browser Request
      ↓
  CorsFilter ← FIRST! Sets CORS headers
      ↓
  (If OPTIONS) → Return 200 OK, done
      ↓
  (If actual request) → Continue to next filter
      ↓
  JwtAuthenticationFilter ← Skips JWT for OPTIONS and login
      ↓
  SecurityConfig authorization ← All /api/** is permitAll
      ↓
  Actual Endpoint Handler
      ↓
  Response (already has CORS headers from step 1)
```

---

## Verification Commands

### Confirm Backend Started Correctly
```bash
# In backend terminal, look for this line:
# "Configuring CORS for origins:"
```

### Test Port 5173
```bash
# Should also work fine
npm run dev -- --port 5173
```

### Test Port 5175  
```bash
# Should also work fine now
npm run dev -- --port 5175
```

### Check All Ports Are Configured
```bash
grep "app.cors.allowed-origins" \
  /Users/abijit/Downloads/futsal-main/backend/src/main/resources/application.properties

# Should show all 6 origins (localhost and 127.0.0.1 for each port)
```

---

## Files That Were Modified

1. **SecurityConfig.java**
   - Added CorsConfigurationSource bean
   - Added CorsFilter bean
   - Updated securityFilterChain to use CorsFilter
   - Added logging for CORS configuration

2. **JwtAuthenticationFilter.java**  
   - Already updated to skip OPTIONS requests
   - Already updated to skip login endpoint

3. **CorsConfig.java**
   - Already simplified (removed duplicate config)

---

## Final Checklist Before Declaring Success

- [ ] Backend JAR is rebuilt (maven build completed)
- [ ] Backend process is running with new JAR
- [ ] Backend logs show "Configuring CORS for origins:" at startup
- [ ] Backend logs show all 6 origins (ports 5173, 5174, 5175 with localhost and 127.0.0.1)
- [ ] Frontend is running with `npm run dev -- --port 5174`
- [ ] Browser is pointed to http://localhost:5174/login
- [ ] DevTools Network tab shows OPTIONS → 200 OK
- [ ] DevTools Network tab shows POST → 200 OK  
- [ ] OPTIONS Response Headers include Access-Control-Allow-Origin
- [ ] POST Response includes user data and authToken
- [ ] After login, browser redirects to dashboard
- [ ] Console shows no CORS errors

## Success Looks Like This:

**DevTools Network Tab:**
```
Name                    Status  Type
──────────────────────────────────
app-...js               304     script
login                   200     document
OPTIONS /api/users/login  200   xhr  ← CORS preflight succeeded!
POST /api/users/login   200     xhr  ← Login succeeded!
dashboard               200     document
```

**No Error Messages in Console**

**User is logged in on dashboard**

---

## Next Steps if Port 5174 Still Shows 403

1. Run this manual test:
   ```bash
   curl -X OPTIONS http://localhost:9090/api/users/login \
     -H "Origin: http://localhost:5174" \
     -i | grep "Access-Control"
   ```

2. If you see the CORS headers → Issue is not CORS, it's authentication
3. If you don't see the headers → Backend rebuild didn't work

4. Verify the rebuild:
   ```bash
   ls -lh /Users/abijit/Downloads/futsal-main/backend/target/*.jar
   stat /Users/abijit/Downloads/futsal-main/backend/target/futsal-booking-1.0.0.jar
   ```
   Should show recent timestamp (within last few minutes)

5. If timestamp is old, backend didn't properly close. Kill and restart:
   ```bash
   # Kill existing Java process
   pkill -f "java.*futsal"
   
   # Start fresh
   cd /Users/abijit/Downloads/futsal-main/backend
   java -jar target/futsal-booking-1.0.0.jar
   ```

---

**The 403 error should now be completely fixed across all three ports (5173, 5174, 5175)!**

