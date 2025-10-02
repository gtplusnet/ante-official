#!/bin/bash

# Test just the validate endpoint to see if middleware fix is working
API_URL="https://backend-ante.geertest.com"
LICENSE_KEY="WS1ZZCACR44I13BKFDTLGCBVQ286SYTN"

echo "Testing Validate Endpoint After Middleware Fix"
echo "============================================="
echo ""

echo "1. Testing validate endpoint (should now work without device connection):"
echo "------------------------------------------------------------------------"
curl -s -L -X POST "$API_URL/auth/school/sync/validate" \
  -H "Content-Type: application/json" \
  -H "X-License-Key: $LICENSE_KEY" | jq .

echo ""
echo "2. Testing connect endpoint (should also work now):"
echo "--------------------------------------------------"
curl -s -L -X POST "$API_URL/auth/school/sync/connect" \
  -H "Content-Type: application/json" \
  -H "X-License-Key: $LICENSE_KEY" \
  -d '{
    "licenseKey": "'$LICENSE_KEY'",
    "deviceName": "School Gatekeep Device",
    "macAddress": "AA:BB:CC:DD:EE:FF",
    "ipAddress": "192.168.1.100"
  }' | jq .

echo ""
echo "Test complete!"