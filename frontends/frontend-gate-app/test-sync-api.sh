#!/bin/bash

# Test Sync API Endpoints
# Use backend-ante.geertest.com for direct backend access
API_URL="https://backend-ante.geertest.com"
# Using the provided license key
LICENSE_KEY="WS1ZZCACR44I13BKFDTLGCBVQ286SYTN"

echo "Testing School Gatekeep Sync API"
echo "================================"
echo "API URL: $API_URL"
echo "License Key: $LICENSE_KEY"
echo ""

# Test 1: Validate endpoint without license key (should return 401)
echo "1. Testing validate endpoint without license key (expecting 401):"
curl -L -L -X POST "$API_URL/auth/school/sync/validate" \
  -H "Content-Type: application/json" \
  -w "\nHTTP Status: %{http_code}\n"
echo -e "\n"

# Test 2: Validate with license key
echo "2. Testing validate endpoint with license key:"
curl -L -X POST "$API_URL/auth/school/sync/validate" \
  -H "Content-Type: application/json" \
  -H "X-License-Key: $LICENSE_KEY" \
  -w "\nHTTP Status: %{http_code}\n"
echo -e "\n"

# Test 3: Try some known license keys from the School Gatekeep frontend
echo "3. Testing with sample license keys:"
SAMPLE_KEYS=("GS-TEST-001" "SCHOOL-2024" "DEMO-LICENSE" "TEST-KEY-123")

for key in "${SAMPLE_KEYS[@]}"; do
  echo "   Testing with key: $key"
  curl -L -s -X POST "$API_URL/auth/school/sync/validate" \
    -H "Content-Type: application/json" \
    -H "X-License-Key: $key" \
    -w "\nHTTP Status: %{http_code}\n" | head -n 5
  echo ""
done

# Test 4: Connect device endpoint
echo "4. Testing connect device endpoint:"
curl -L -X POST "$API_URL/auth/school/sync/connect" \
  -H "Content-Type: application/json" \
  -H "X-License-Key: $LICENSE_KEY" \
  -d '{
    "licenseKey": "'$LICENSE_KEY'",
    "deviceName": "Test Device",
    "macAddress": "AA:BB:CC:DD:EE:FF",
    "ipAddress": "192.168.1.100"
  }' \
  -w "\nHTTP Status: %{http_code}\n"
echo -e "\n"

# Test 5: Check sync status
echo "5. Testing sync status endpoint:"
curl -L -X GET "$API_URL/auth/school/sync/status" \
  -H "X-License-Key: $LICENSE_KEY" \
  -w "\nHTTP Status: %{http_code}\n"
echo -e "\n"

# Test 6: Pull sync data
echo "6. Testing sync pull endpoint:"
curl -L -X POST "$API_URL/auth/school/sync/pull" \
  -H "Content-Type: application/json" \
  -H "X-License-Key: $LICENSE_KEY" \
  -d '{
    "lastSyncTime": "2024-01-01T00:00:00Z",
    "entityTypes": ["student", "guardian"]
  }' \
  -w "\nHTTP Status: %{http_code}\n"
echo -e "\n"

echo "Testing complete!"