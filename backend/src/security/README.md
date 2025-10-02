# Database Security Rules System

## Overview
This system enforces database-level security policies using PostgreSQL Row Level Security (RLS) with a modular, per-table structure for easy management.

## Directory Structure

```
/src/security/
├── README.md              # This documentation
├── cli/
│   └── apply-rules.ts      # CLI tool for applying rules
├── rules/                  # NEW: Modular rule structure
│   ├── _common/            # Common operations (applied first)
│   │   ├── 00-cleanup.sql      # Drop existing policies
│   │   ├── 01-enable-rls.sql   # Enable RLS on all tables
│   │   └── 02-bypass-superuser.sql # Superuser bypass policies
│   ├── tables/             # Individual table rules
│   │   ├── account.sql
│   │   ├── account-notifications.sql
│   │   ├── account-token.sql
│   │   ├── company.sql
│   │   ├── employee-data.sql
│   │   └── [...other tables]
│   └── _grants/            # Role-based grants (applied last)
│       ├── authenticated.sql
│       └── anon.sql
└── database-rules.sql      # LEGACY: Will be removed after testing
```

## Commands

### Apply All Rules (Recommended)
```bash
# Apply all security rules using new modular structure
yarn security:apply

# Preview all changes without applying
yarn security:dry-run

# Apply with explicit --all flag
yarn security:apply-rules --all

# Skip confirmation prompt
yarn security:apply --force
```

### Apply Specific Table Rules
```bash
# List available table rule files
yarn security:list-tables

# Apply rules for specific table
yarn security:apply-table=account

# Apply rules for multiple tables
yarn security:apply-table=account,company,role

# Preview specific table changes
yarn security:apply-rules --table=account --dry-run
```

### Development & Debugging
```bash
# Show SQL without executing
yarn security:apply-rules --show-sql --dry-run

# Apply specific table with verbose output
yarn security:apply-rules --table=account --show-sql

# Force apply specific table rules
yarn security:apply-rules --table=account --force
```

## How It Works

### Database Level (RLS)
1. **All tables have RLS enabled** - Enforces policies at database level
2. **Frontend sources can only SELECT** - Read-only access
3. **Backend source has full CRUD** - Create, Read, Update, Delete
4. **Superuser bypass** - Migrations and admin operations still work

### Application Level (Middleware)
1. **Prisma middleware** intercepts all queries
2. **Source detection** from request headers
3. **Policy evaluation** before query execution
4. **Access denied** if policy doesn't allow

## Security Rules Applied

### Default Rules
- **Frontend** (`frontend-main`, `frontend-gate`, `frontend-guardian`): READ only
- **Backend** (`backend`): Full CRUD access
- **Superuser**: Bypasses all policies (for migrations)

### Special Tables
- **AccountToken**: No frontend access at all
- **EmailConfiguration**: Admin role required
- **FundAccount/FundTransaction**: Finance role required

## Important Notes

1. **RLS with Supabase**: Since we connect as superuser, RLS policies exist but are bypassed. The Prisma middleware provides the actual enforcement.

2. **To make RLS effective**, you would need:
   - Create separate database users for frontend/backend
   - Connect with non-superuser credentials
   - Set `app.source` in database session

3. **Current Setup**: 
   - Database has RLS policies (future-proofing)
   - Prisma middleware enforces security (currently active)
   - Best of both worlds approach

## Modifying Rules

### Adding New Table Rules
1. Create `/src/security/rules/tables/your-table.sql`
2. Add table-specific policies
3. Run `yarn security:apply-table=your-table --dry-run` to test
4. Apply with `yarn security:apply-table=your-table`

### Modifying Existing Table Rules
1. Edit the specific file in `/src/security/rules/tables/`
2. Preview changes: `yarn security:apply-table=table-name --dry-run`
3. Apply: `yarn security:apply-table=table-name`

### Modifying Common Rules
1. Edit files in `/src/security/rules/_common/`
2. Test with full apply: `yarn security:dry-run`
3. Apply: `yarn security:apply`

## Testing

```bash
# Check current state
yarn security:dry-run

# Test specific table rules
yarn security:apply-table=account --dry-run

# Show SQL that will be generated
yarn security:apply-rules --show-sql --dry-run

# Test from frontend (should fail for writes)
curl -X POST http://localhost:3000/accounts \
  -H "X-Source: frontend-main" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test"}'
```

## Examples

### Working with Account Table
```bash
# Preview account table changes
yarn security:apply-table=account --dry-run

# Apply account table rules only
yarn security:apply-table=account

# Show SQL for account table
yarn security:apply-rules --table=account --show-sql
```

### Working with Multiple Tables
```bash
# Apply HRIS-related tables
yarn security:apply-table=account,employee-data,company

# Preview changes for multiple tables
yarn security:apply-rules --table=account,company,role --dry-run
```

## Migration from Legacy System

The new modular system is **backward compatible**:
1. If `rules/` directory exists, it uses modular structure
2. If only `database-rules.sql` exists, it falls back to legacy file
3. Both systems produce equivalent results
4. Legacy file will be removed after successful testing

## Summary

- **Modular approach**: One file per table for easy management
- **Selective application**: Apply rules to specific tables
- **Development friendly**: Test changes on individual tables
- **Backward compatible**: Falls back to legacy system if needed

The system is designed for maintainability: one table, one file, targeted application.