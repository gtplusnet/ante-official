#!/bin/bash

# Test using the regular device-license connect endpoint
API_URL="https://backend-ante.geertest.com"
LICENSE_KEY="WS1ZZCACR44I13BKFDTLGCBVQ286SYTN"

echo "Testing Device License Connection"
echo "================================="
echo "License Key: $LICENSE_KEY"
echo ""

# First, let's try the regular device-license connect endpoint
echo "1. Trying /school/device-license/connect endpoint:"
echo "-------------------------------------------------"
curl -L -X POST "$API_URL/school/device-license/connect" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LICENSE_KEY" \
  -d '{
    "licenseKey": "'$LICENSE_KEY'",
    "deviceName": "School Gatekeep Device",
    "macAddress": "AA:BB:CC:DD:EE:FF",
    "ipAddress": "192.168.1.100"
  }' \
  -w "\nHTTP Status: %{http_code}\n" | jq . 2>/dev/null || cat

echo ""

# Try with a simpler payload
echo "2. Trying with minimal payload:"
echo "------------------------------"
curl -L -X POST "$API_URL/school/device-license/connect" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LICENSE_KEY" \
  -d '{
    "licenseKey": "'$LICENSE_KEY'"
  }' \
  -w "\nHTTP Status: %{http_code}\n" | jq . 2>/dev/null || cat

echo ""

# Let's also check what the validate endpoint returns with more details
echo "3. Checking validate endpoint response:"
echo "-------------------------------------"
curl -v -L -X POST "$API_URL/auth/school/sync/validate" \
  -H "Content-Type: application/json" \
  -H "X-License-Key: $LICENSE_KEY" 2>&1 | grep -E "(< HTTP|{|}|message|valid|company)"

echo ""
echo "Test complete!"