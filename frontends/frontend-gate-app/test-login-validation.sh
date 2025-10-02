#!/bin/bash

# Test license validation on login page
echo "Testing License Key Validation on School Gatekeep Login"
echo "======================================================"
echo ""

# Test with the valid license key
LICENSE_KEY="WS1ZZCACR44I13BKFDTLGCBVQ286SYTN"

echo "1. Testing login page is accessible:"
curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" https://gatekeep.geertest.com/login

echo ""
echo "2. Testing license validation via frontend (simulated):"
echo "   License Key: $LICENSE_KEY"
echo ""

# Since we can't easily test the frontend JavaScript, let's test the backend directly
echo "3. Backend validation test:"
curl -s -X POST "https://backend-ante.geertest.com/auth/school/sync/validate" \
  -H "Content-Type: application/json" \
  -H "X-License-Key: $LICENSE_KEY" | jq .

echo ""
echo "4. Testing invalid license key:"
curl -s -X POST "https://backend-ante.geertest.com/auth/school/sync/validate" \
  -H "Content-Type: application/json" \
  -H "X-License-Key: INVALID-KEY-12345" | jq .

echo ""
echo "Test complete!"
echo ""
echo "To test the actual login flow:"
echo "1. Go to https://gatekeep.geertest.com/login"
echo "2. Enter license key: $LICENSE_KEY"
echo "3. Click 'Activate'"
echo "4. You should be redirected to the dashboard"