# Database Views Management System

## Overview
This system provides a centralized way to manage database views with version control, easy deployment, and single source of truth approach. Each view is defined in its own SQL file for better maintainability.

## Directory Structure
```
src/views/
├── definitions/                          # Directory containing all view SQL files
│   ├── accounts-without-employee-data.sql
│   ├── employees-with-contracts.sql     # Future view example
│   └── active-notifications.sql         # Future view example
├── cli/
│   └── apply-views.ts                   # CLI tool to apply views
└── README.md                            # This file
```

## Commands

### Apply Database Views
```bash
# Apply all views
yarn views:apply

# Apply views without confirmation prompt
yarn views:apply-force

# Preview what would be applied without making changes
yarn views:dry-run

# List all available view files
yarn views:list

# Show SQL that will be executed
yarn views:show

# Apply only specific views (partial name matching)
yarn views:apply --only=accounts-without,employees-with

# Exclude specific views from being applied
yarn views:apply --exclude=test-view,temp-view
```

### View CLI Options
- `--dry-run` - Show what would be applied without making changes
- `--force` - Skip confirmation prompt
- `--show-sql` - Display the SQL that will be executed
- `--list` - List all available view files
- `--only=view1,view2` - Apply only specific views (partial name match)
- `--exclude=view1,view2` - Exclude specific views from being applied
- `--help` - Show help message

## How to Create New Views

### 1. Create View File
Create a new `.sql` file in the `definitions/` directory using kebab-case naming:
```
definitions/my-new-view.sql
```

### 2. View File Structure
```sql
-- View: my_view_name
-- Purpose: Brief description of what this view does
-- Used by: Where this view is used (e.g., "Frontend HRIS module")
-- Created: YYYY-MM-DD

-- Drop existing view if it exists
DROP VIEW IF EXISTS my_view_name CASCADE;

-- Create the view
CREATE OR REPLACE VIEW my_view_name AS
SELECT 
    -- your SQL query here
FROM your_tables
WHERE your_conditions;

-- Grant appropriate permissions for Supabase RLS
GRANT SELECT ON my_view_name TO anon, authenticated;

-- Add comment to the view for documentation
COMMENT ON VIEW my_view_name IS 'Description of what this view contains and its purpose.';
```

### 3. Apply Views
```bash
yarn views:apply
```

## Naming Conventions

### Files
- Use **kebab-case** for SQL filenames: `accounts-without-employee-data.sql`
- Be descriptive but concise
- Use meaningful names that explain the view's purpose

### Database Objects
- Use **snake_case** for view names: `accounts_without_employee_data`
- Follow PostgreSQL naming conventions
- Keep names consistent with existing database schema

## Best Practices

### 1. View Design
- **Single Purpose**: Each view should serve one specific purpose
- **Performance**: Consider indexing needs and query performance
- **Security**: Always grant appropriate permissions
- **Documentation**: Include comprehensive comments

### 2. File Organization
- **One view per file**: Makes it easier to manage and track changes
- **Descriptive comments**: Include purpose, usage, and creation date
- **Dependencies**: If views depend on other views, document the order

### 3. SQL Structure
- **Idempotent**: Always use `CREATE OR REPLACE VIEW`
- **Drop first**: Use `DROP VIEW IF EXISTS` for safety
- **Permissions**: Always grant appropriate permissions
- **Comments**: Use `COMMENT ON VIEW` for documentation

### 4. Version Control
- **Commit files**: Always commit new/modified view files
- **Atomic changes**: One logical change per commit
- **Clear messages**: Use descriptive commit messages

## Current Views

### 1. accounts_without_employee_data
**File**: `accounts-without-employee-data.sql`
**Purpose**: Shows all Account records that don't have corresponding EmployeeData
**Used by**: HRIS Not Yet Setup tab
**Includes**: Account details with Role and Company information

## Integration with Frontend

Views are automatically accessible via Supabase just like any table:

```typescript
// Query the view directly
const { data, error } = await supabase
  .from('accounts_without_employee_data')
  .select('*')
  .eq('company_id', companyId);
```

## Security Considerations

- **RLS Policies**: Views inherit RLS policies from underlying tables
- **Permissions**: Always grant appropriate permissions (anon, authenticated)
- **Data Access**: Views follow the same security rules as regular tables
- **Read-Only**: Views are naturally read-only, which aligns with frontend access patterns

## Troubleshooting

### Common Issues

1. **"Permission denied" errors**
   - Check if `GRANT SELECT` statements are included
   - Verify RLS policies on underlying tables

2. **"View does not exist" errors**
   - Run `yarn views:apply` to create/update views
   - Check if view file exists in definitions directory

3. **"SQL syntax errors"**
   - Use `yarn views:dry-run` to test SQL before applying
   - Check SQL syntax in individual view files

### Debugging Commands
```bash
# List current views in database
yarn views:list

# Show SQL without applying
yarn views:show

# Test with dry run
yarn views:dry-run

# Check specific view only
yarn views:apply --only=my-view --dry-run
```

## Migration Strategy

When modifying existing views:
1. Update the SQL file
2. Test with `yarn views:dry-run`
3. Apply with `yarn views:apply`
4. Verify frontend integration still works

Views are applied in alphabetical order by filename for consistency.