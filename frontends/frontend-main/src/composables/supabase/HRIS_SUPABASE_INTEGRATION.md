# HRIS Supabase Integration Documentation

## Overview
This document describes the HRIS (Human Resource Information System) Supabase integration that provides direct database access from the frontend, bypassing the backend API for improved performance.

## Architecture

### Components
1. **useSupabaseTable** - Generic composable for Supabase table operations
2. **useHRISEmployees** - HRIS-specific composable for employee data management
3. **SupabaseGTable** - Vue component for displaying Supabase data in tables
4. **Database RLS Policies** - Row Level Security for company-based access control

## Current Limitations

### 1. Nested Relation Filters
**Status**: ❌ Not Supported
**Example**: `account.role.roleGroupId`
**Workaround**: Filters on nested relations are skipped with console warnings
**Future Solution**: Implement Supabase RPC functions or backend API fallback

### 2. Nested Column Search
**Status**: ⚠️ Partial Support
**Example**: `account.firstName`, `account.lastName`
**Workaround**: Defaults to `employeeCode` search
**Future Solution**: Create database functions for cross-table searching

### 3. Complex Aggregations
**Status**: ❌ Not Supported
**Example**: Count employees by department
**Workaround**: Use backend API for reports
**Future Solution**: Create materialized views or RPC functions

## Supported Features

### ✅ Direct Operations
- Filter by `isActive`
- Filter by `branchId`
- Search by `employeeCode`
- Pagination (offset-based)
- Sorting by direct columns
- Company-based data isolation via RLS

### ✅ Data Transformations
- `payrollGroupCode` → `name` mapping
- `scheduleCode` → `name` mapping
- Safe date formatting
- Null/undefined handling
- Error recovery with fallback values

## Field Mappings

### Database → UI Transformations
```javascript
// PayrollGroup
database.payrollGroupCode → ui.payrollGroup.name

// Schedule
database.scheduleCode → ui.schedule.name

// Dates
database.createdAt → ui.createdAt.dateFull + ui.createdAt.dateTime
```

## Error Handling

### Safe Defaults
All data transformations include fallback values:
- Strings: `''` (empty string)
- Numbers: `0`
- Booleans: `false`
- Objects: `{}` or specific structure
- Arrays: `[]`

### Console Warnings
The system logs warnings for:
- Unsupported nested filters
- Unsupported nested searches
- Data transformation errors

## Future Improvements

### Phase 1: Enhanced Search (Priority: High)
- [ ] Implement Supabase RPC functions for nested searches
- [ ] Add full-text search capabilities
- [ ] Support multiple search columns

### Phase 2: Advanced Filters (Priority: Medium)
- [ ] Create database views for complex relationships
- [ ] Implement client-side filtering for unsupported operations
- [ ] Add filter combination logic (AND/OR)

### Phase 3: Performance Optimization (Priority: Low)
- [ ] Implement cursor-based pagination
- [ ] Add query result caching with longer TTL
- [ ] Optimize select statements for minimal data transfer

### Phase 4: Full Feature Parity (Priority: Low)
- [ ] Support all existing backend API filters
- [ ] Implement aggregation functions
- [ ] Add export capabilities

## Migration Path

### Hybrid Approach
For features not yet supported by direct Supabase access:
1. Check if operation is supported
2. If yes: Use Supabase direct access
3. If no: Fall back to backend API
4. Log usage patterns for prioritization

### Code Example
```javascript
// Future hybrid implementation
async function fetchEmployees(filters) {
  const hasUnsupportedFilters = filters.some(f => f.includes('.'));
  
  if (hasUnsupportedFilters) {
    // Use backend API
    return await api.get('/hris/employees', { params: filters });
  } else {
    // Use Supabase direct
    return await supabaseTable.fetch(filters);
  }
}
```

## Security Considerations

### RLS Policies
All data access is controlled by Row Level Security policies:
- Users can only see data from their own company
- Frontend has read-only access
- Policies defined in `/backend/src/security/database-rules.sql`

### Best Practices
1. Never expose service keys in frontend
2. Always use anon key for frontend access
3. Validate all data transformations
4. Log security-related errors

## Testing Checklist

- [x] Active employees tab loads
- [x] Inactive employees tab loads
- [x] Separated employees tab loads
- [x] Not yet setup tab loads
- [x] Pagination works
- [x] Basic filters work (isActive, branchId)
- [x] Search by employee code works
- [ ] Nested filters show warnings
- [ ] Nested searches default correctly
- [x] Error handling prevents crashes
- [x] Company isolation works (RLS)

## Developer Notes

### Adding New Features
1. Check if Supabase supports the operation natively
2. If not, evaluate workarounds:
   - RPC functions
   - Database views
   - Client-side processing
   - Backend API fallback
3. Update this documentation
4. Add console warnings for unsupported features

### Debugging
Enable verbose logging:
```javascript
// In useSupabaseTable.ts
const DEBUG = true; // Set to true for detailed logs
```

Check browser console for:
- ⚠️ Warning messages about unsupported features
- Error transformation logs
- Query performance metrics

## Related Files
- `/frontends/frontend-main/src/composables/supabase/useSupabaseTable.ts`
- `/frontends/frontend-main/src/composables/supabase/useHRISEmployees.ts`
- `/frontends/frontend-main/src/components/shared/display/SupabaseGTable.vue`
- `/backend/src/security/database-rules.sql`
- All HRIS tab pages in `/frontends/frontend-main/src/pages/Member/Manpower/HRIS/Tab/`