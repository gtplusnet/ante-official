#!/bin/bash

# Setup script to create screenshots directory and clean up old test results

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

echo "🧹 Setting up test directories..."

# Create necessary directories
mkdir -p screenshots
mkdir -p test-results/videos
mkdir -p test-results/traces

print_success "Created test-results directories"

# Clean up old test results if they exist
if [ -d "test-results" ] && [ "$(ls -A test-results 2>/dev/null)" ]; then
    print_info "Cleaning up old test results..."
    find test-results -name "*.png" -type f -delete 2>/dev/null || true
    find test-results -name "*.webm" -type f -delete 2>/dev/null || true
    find test-results -name "*.zip" -type f -delete 2>/dev/null || true
    print_success "Old test results cleaned up"
else
    print_info "No old test results to clean up"
fi

print_success "Test environment setup complete!"
print_info "You can now run tests with: ./tests/e2e/scripts/run-test.sh headed"