#!/bin/bash

# Playwright Test Runner Script for Login to Task Creation Flow
# This script makes it easy to run the continuous test with different modes

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Function to check if dev server is running
check_dev_server() {
    print_info "Checking if development server is running on http://localhost:9000..."
    
    if curl -s --connect-timeout 5 http://localhost:9000 > /dev/null 2>&1; then
        print_success "Development server is running"
        return 0
    else
        print_error "Development server is not running on http://localhost:9000"
        print_info "Please start the development server with: yarn dev"
        return 1
    fi
}

# Function to run tests
run_test() {
    local mode=$1
    local test_name="login-to-task.spec.ts"
    
    case $mode in
        "headed")
            print_info "Running test in headed mode (browser visible)..."
            npx playwright test $test_name --headed --timeout=120000
            ;;
        "debug")
            print_info "Running test in debug mode (interactive)..."
            npx playwright test $test_name --debug
            ;;
        "headless")
            print_info "Running test in headless mode..."
            npx playwright test $test_name --timeout=60000
            ;;
        "slow")
            print_info "Running test in slow mode (extra slow for visibility)..."
            npx playwright test $test_name --headed --timeout=180000 --slow-mo=1000
            ;;
        *)
            print_error "Unknown mode: $mode"
            print_info "Available modes: headed, headless, debug, slow"
            exit 1
            ;;
    esac
}

# Main script
echo "🎭 Playwright Test Runner - Login to Task Creation"
echo "=" 
echo ""

# Parse command line arguments
MODE=${1:-"headed"}  # Default to headed mode

print_info "Test mode: $MODE"
print_info "Test file: login-to-task.spec.ts"
echo ""

# Check if Playwright is installed
if ! command -v npx playwright > /dev/null; then
    print_error "Playwright is not installed"
    print_info "Installing Playwright..."
    npm install @playwright/test
    npx playwright install
fi

# Check if dev server is running
if ! check_dev_server; then
    exit 1
fi

echo ""
print_info "Starting test execution..."
echo ""

# Run the test
if run_test $MODE; then
    echo ""
    print_success "Test completed successfully! 🎉"
    print_info "Check test-results/ directory for screenshots and videos"
else
    echo ""
    print_error "Test failed! 😞"
    print_info "Check test-results/ directory for failure screenshots"
    exit 1
fi

echo ""
print_info "Test report available at: test-results/index.html"
print_info "To view the report, run: npx playwright show-report"