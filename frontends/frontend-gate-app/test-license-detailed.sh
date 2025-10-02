#!/bin/bash

# Detailed test for specific license key
API_URL="https://backend-ante.geertest.com"
LICENSE_KEY="GAYY65UI9HMV16YZVZLBPRGV046MJ1OZ"

echo "Detailed License Key Test"
echo "========================="
echo "License Key: $LICENSE_KEY"
echo ""

# Test 1: Validate with detailed output
echo "1. Testing license validation:"
echo "Request:"
echo "  URL: $API_URL/auth/school/sync/validate"
echo "  Header: X-License-Key: $LICENSE_KEY"
echo ""
echo "Response:"
curl -L -X POST "$API_URL/auth/school/sync/validate" \
  -H "Content-Type: application/json" \
  -H "X-License-Key: $LICENSE_KEY" \
  -w "\n\nHTTP Status: %{http_code}\nResponse Time: %{time_total}s\n" \
  -v 2>&1 | grep -E "(< HTTP|< |{|}|HTTP Status|Response Time)"

echo -e "\n---\n"

# Test 2: Try device connection with full details
echo "2. Testing device connection:"
DEVICE_DATA='{
  "licenseKey": "'$LICENSE_KEY'",
  "deviceName": "School Gatekeep Test Device",
  "macAddress": "AA:BB:CC:DD:EE:FF",
  "ipAddress": "192.168.1.100",
  "deviceInfo": {
    "platform": "linux",
    "version": "1.0.0"
  }
}'

echo "Request Body:"
echo "$DEVICE_DATA" | jq .
echo ""
echo "Response:"
curl -L -X POST "$API_URL/auth/school/sync/connect" \
  -H "Content-Type: application/json" \
  -H "X-License-Key: $LICENSE_KEY" \
  -d "$DEVICE_DATA" \
  -w "\n\nHTTP Status: %{http_code}\n" | jq . 2>/dev/null || cat

echo -e "\n---\n"

# Test 3: Check if it's a different license type issue
echo "3. Testing with different endpoints that might accept this license:"

# Try the regular device license connect endpoint
echo "Trying /school/device-license/connect:"
curl -L -X POST "$API_URL/school/device-license/connect" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LICENSE_KEY" \
  -d '{
    "licenseKey": "'$LICENSE_KEY'",
    "deviceName": "Test Device",
    "macAddress": "AA:BB:CC:DD:EE:FF"
  }' \
  -w "\nHTTP Status: %{http_code}\n" 2>/dev/null | head -5

echo ""
echo "Test complete!"