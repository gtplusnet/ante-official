#!/bin/bash

# Clean up screenshots folder before running tests
echo "🧹 Cleaning up screenshots folder..."
rm -rf screenshots/
mkdir -p screenshots

# Kill any existing dev server on port 9000
echo "🔄 Stopping any existing dev server..."
lsof -ti:9000 | xargs kill -9 2>/dev/null || true

# Wait a moment for port to be freed
sleep 2

# Start the dev server in background with error overlay disabled
echo "🚀 Starting dev server without error overlay..."
VITE_PLUGIN_CHECKER=false NODE_ENV=test yarn dev &
DEV_PID=$!

# Wait for dev server to be ready
echo "⏳ Waiting for dev server to start..."
sleep 10

# Check if server is running
if ! curl -s http://localhost:9000 > /dev/null; then
    echo "❌ Dev server failed to start"
    kill $DEV_PID 2>/dev/null || true
    exit 1
fi

echo "✅ Dev server is running"

# Run the test
echo "🧪 Running continuous workflow test..."
yarn playwright test continuous-workflow.spec.ts

# Capture test exit code
TEST_EXIT_CODE=$?

# Kill the dev server
echo "🔄 Stopping dev server..."
kill $DEV_PID 2>/dev/null || true

# Exit with test exit code
exit $TEST_EXIT_CODE