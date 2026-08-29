#!/bin/bash

# Test CORS Configuration for Port 5174
# This script tests if the login endpoint is properly configured for CORS on port 5174

echo "========================================="
echo "CORS Configuration Test for Port 5174"
echo "========================================="
echo ""

# Check if backend is running
echo "1. Checking if backend is running on port 9090..."
if ! nc -z localhost 9090 2>/dev/null; then
    echo "❌ Backend is not running on port 9090"
    echo "   Please start the backend first:"
    echo "   cd /Users/abijit/Downloads/futsal-main/backend"
    echo "   java -jar target/futsal-booking-1.0.0.jar"
    exit 1
fi
echo "✅ Backend is running on port 9090"
echo ""

# Test OPTIONS preflight request from port 5174
echo "2. Testing CORS preflight (OPTIONS) request for port 5174..."
echo "   Sending: OPTIONS /api/users/login"
echo ""

response=$(curl -X OPTIONS http://localhost:9090/api/users/login \
  -H "Origin: http://localhost:5174" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -v 2>&1)

# Check for 200 status
if echo "$response" | grep -q "< HTTP/1.1 200"; then
    echo "✅ OPTIONS request returned 200 OK"
else
    echo "❌ OPTIONS request did not return 200"
    echo "$response" | grep "< HTTP"
fi
echo ""

# Check for CORS headers
echo "3. Checking CORS response headers..."
echo ""

# Access-Control-Allow-Origin
if echo "$response" | grep -qi "Access-Control-Allow-Origin: http://localhost:5174"; then
    echo "✅ Access-Control-Allow-Origin: http://localhost:5174"
else
    echo "❌ Missing or incorrect Access-Control-Allow-Origin header"
    echo "$response" | grep "Access-Control-Allow-Origin" || echo "   Header not found"
fi

# Access-Control-Allow-Methods
if echo "$response" | grep -qi "Access-Control-Allow-Methods"; then
    echo "✅ Access-Control-Allow-Methods header is present"
    echo "$response" | grep "Access-Control-Allow-Methods"
else
    echo "❌ Missing Access-Control-Allow-Methods header"
fi

# Access-Control-Allow-Credentials
if echo "$response" | grep -qi "Access-Control-Allow-Credentials: true"; then
    echo "✅ Access-Control-Allow-Credentials: true"
else
    echo "❌ Missing or incorrect Access-Control-Allow-Credentials header"
fi

# Access-Control-Allow-Headers
if echo "$response" | grep -qi "Access-Control-Allow-Headers"; then
    echo "✅ Access-Control-Allow-Headers header is present"
    echo "$response" | grep "Access-Control-Allow-Headers"
else
    echo "❌ Missing Access-Control-Allow-Headers header"
fi

echo ""
echo "========================================="
echo "Test Result Summary"
echo "========================================="
echo ""

# Count successes
success_count=$(echo "$response" | grep -ci "200")
if [ "$success_count" -gt 0 ] && echo "$response" | grep -qi "Access-Control-Allow-Origin"; then
    echo "✅ CORS is properly configured for port 5174!"
    echo ""
    echo "You can now:"
    echo "1. Start frontend on port 5174: cd /Users/abijit/Downloads/futsal-main/frontend && npm run dev -- --port 5174"
    echo "2. Try logging in"
    echo "3. Check browser Network tab - both OPTIONS and POST should return 200"
else
    echo "❌ CORS may not be properly configured for port 5174"
    echo ""
    echo "Troubleshooting steps:"
    echo "1. Verify backend was rebuilt after changes:"
    echo "   cd /Users/abijit/Downloads/futsal-main/backend"
    echo "   mvn clean package"
    echo ""
    echo "2. Restart backend server"
    echo ""
    echo "3. Check backend logs for:"
    echo "   'Configuring CORS for origins:'"
    echo ""
    echo "4. Verify application.properties includes port 5174:"
    echo "   grep 'app.cors.allowed-origins' src/main/resources/application.properties"
fi

echo ""
echo "========================================="

