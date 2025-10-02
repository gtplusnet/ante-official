#!/bin/bash

# Test Sync API with proper connection flow
API_URL="https://backend-ante.geertest.com"
LICENSE_KEY="WS1ZZCACR44I13BKFDTLGCBVQ286SYTN"

echo "School Gatekeep Sync API - Connected Device Test"
echo "================================================"
echo "License Key: $LICENSE_KEY"
echo ""

# Step 1: Connect the device first
echo "1. Connecting device:"
echo "-------------------"
CONNECT_RESPONSE=$(curl -s -L -X POST "$API_URL/auth/school/sync/connect" \
  -H "Content-Type: application/json" \
  -H "X-License-Key: $LICENSE_KEY" \
  -d '{
    "licenseKey": "'$LICENSE_KEY'",
    "deviceName": "School Gatekeep Test Device",
    "macAddress": "AA:BB:CC:DD:EE:FF",
    "ipAddress": "192.168.1.100"
  }')

echo "$CONNECT_RESPONSE" | jq . 2>/dev/null || echo "$CONNECT_RESPONSE"
echo ""

# Step 2: Validate license (should work now)
echo "2. Validating license after connection:"
echo "--------------------------------------"
curl -s -L -X POST "$API_URL/auth/school/sync/validate" \
  -H "Content-Type: application/json" \
  -H "X-License-Key: $LICENSE_KEY" | jq . 2>/dev/null || cat
echo ""

# Step 3: Check sync status
echo "3. Checking sync status:"
echo "-----------------------"
curl -s -L -X GET "$API_URL/auth/school/sync/status" \
  -H "X-License-Key: $LICENSE_KEY" | jq . 2>/dev/null || cat
echo ""

# Step 4: Pull sync data
echo "4. Pulling sync data (students and guardians):"
echo "---------------------------------------------"
PULL_RESPONSE=$(curl -s -L -X POST "$API_URL/auth/school/sync/pull" \
  -H "Content-Type: application/json" \
  -H "X-License-Key: $LICENSE_KEY" \
  -d '{
    "lastSyncTime": "2024-01-01T00:00:00Z",
    "entityTypes": ["student", "guardian"]
  }')

# Pretty print and show summary
echo "$PULL_RESPONSE" | jq '{
  studentCount: .students | length,
  guardianCount: .guardians | length,
  hasMore: .hasMore,
  syncMetadata: .syncMetadata,
  sampleStudent: .students[0],
  sampleGuardian: .guardians[0]
}' 2>/dev/null || echo "$PULL_RESPONSE"

echo ""

# Step 5: Test incremental sync
echo "5. Testing incremental sync (recent changes only):"
echo "-------------------------------------------------"
CURRENT_TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
curl -s -L -X POST "$API_URL/auth/school/sync/pull" \
  -H "Content-Type: application/json" \
  -H "X-License-Key: $LICENSE_KEY" \
  -d '{
    "lastSyncTime": "'$CURRENT_TIME'",
    "entityTypes": ["student", "guardian"]
  }' | jq '{
  studentCount: .students | length,
  guardianCount: .guardians | length,
  syncMetadata: .syncMetadata
}' 2>/dev/null || cat

echo ""
echo "Test complete!"