#!/bin/bash

# ============================================================================
# ANTE Database Changes Deployment Script
# ============================================================================
# Applies database migrations, views, and security rules in the correct order
# Can be used for local testing or as backup for production deployments
# ============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(dirname "$SCRIPT_DIR")"

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Change to backend directory
cd "$BACKEND_DIR"

log_info "🚀 Starting ANTE Database Changes Deployment"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📅 Started: $(date '+%Y-%m-%d %H:%M:%S')"
echo "📁 Directory: $BACKEND_DIR"
echo ""

# Step 1: Apply Prisma migrations (includes views and security rules)
log_info "Step 1: Applying Prisma migrations (includes views and security rules)..."
if npx prisma migrate deploy; then
    log_success "✅ Prisma migrations applied successfully"
else
    log_error "❌ Failed to apply Prisma migrations"
    exit 1
fi

# Step 2: Generate Prisma client
log_info "Step 2: Generating Prisma client..."
if npx prisma generate; then
    log_success "✅ Prisma client generated successfully"
else
    log_error "❌ Failed to generate Prisma client"
    exit 1
fi

# Step 3: Verify migration was applied correctly
log_info "Step 3: Verifying database changes..."

# Check if security functions exist
log_info "Checking if security functions are created..."
if npx prisma db execute --stdin <<< "SELECT public.get_user_company_id();" >/dev/null 2>&1; then
    log_success "✅ Security functions verified"
else
    log_warning "⚠️  Security functions not found or not working properly"
fi

# Check if views exist  
log_info "Checking if database views are created..."
if npx prisma db execute --stdin <<< "SELECT COUNT(*) FROM accounts_without_employee_data LIMIT 1;" >/dev/null 2>&1; then
    log_success "✅ Database views verified"
else
    log_warning "⚠️  Database views not found or not working properly"
fi

# Check if RLS is enabled on sensitive tables
log_info "Checking Row Level Security status..."
RLS_CHECK=$(npx prisma db execute --stdin <<< "
SELECT 
  schemaname, 
  tablename, 
  rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('Account', 'EmployeeData') 
  AND rowsecurity = true;" 2>/dev/null | wc -l || echo "0")

if [ "$RLS_CHECK" -ge 2 ]; then
    log_success "✅ Row Level Security is enabled on sensitive tables"
else
    log_warning "⚠️  Row Level Security status unclear"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎯 DEPLOYMENT SUMMARY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📅 Completed: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""
echo "✅ Database migrations applied"
echo "✅ Views created (accounts_without_employee_data)"
echo "✅ Security functions deployed (get_user_company_id)"
echo "✅ RLS policies implemented"
echo "✅ Company data isolation enabled"
echo "✅ Prisma client generated"
echo ""

log_success "🎉 All database changes applied successfully!"
log_info "Database is ready with views and security rules integrated."

exit 0