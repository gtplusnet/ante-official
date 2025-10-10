# Supabase Migration Status

## ✅ Phase 1 Complete - Infrastructure Removed

### Deleted Files:
- ✅ `package.json` - Removed `@supabase/supabase-js` package
- ✅ `services/supabase.js` - Deleted
- ✅ `services/supabase/` - Entire directory deleted
- ✅ `composables/supabase/` - Entire directory deleted
- ✅ `boot/supabase.js` - Already removed
- ✅ `quasar.config.js` - Removed 'supabase' from boot array
- ✅ `stores/auth.ts` - Removed all Supabase references
- ✅ `utility/auth.success.ts` - Removed all Supabase references

---

## ⚠️ Files with Broken Imports (Need Immediate Fix)

### Priority 1: Fix Build-Breaking Imports

1. **pages/Member/Task/TaskBoardView.vue** ❌ Build Error
   - Line 98: `import supabaseService from '../../../services/supabase';`
   - Lines 129-143: Uses `supabaseService.getClient()` for BoardLane queries
   - Lines 190-231: Uses `supabaseService.getClient()` for Task queries with complex joins
   - Lines 351-360: Uses `supabaseService.getClient()` for Task updates
   - **Solution**: Migrate to backend API `/task/board-view` endpoint

2. **pages/Member/Task/TaskList.vue** ❌ Build Error
   - Uses `useTask` from deleted `composables/supabase/useTask.ts`
   - **Solution**: Migrate to backend API `/task/list` endpoint

3. **composables/useProjectList.ts** ❌ Build Error
   - Line 2: `import { useSupabaseTable } from './supabase/useSupabaseTable';`
   - **Solution**: Migrate to backend API `/project/list` endpoint

4. **composables/realtime/** ❌ Build Errors
   - `useRealtimeSubscription.ts` - Uses deleted Supabase realtime services
   - `useTaskRealtime.ts` - Uses deleted Supabase task types
   - `useNotificationRealtime.ts` - Uses deleted `supabaseDatabaseService`
   - **Solution**: Migrate to Socket.io (already in use)

### Priority 2: HRIS Pages (Build Errors)

5. **pages/Member/Manpower/HRIS/Tab/dialog/ViewCreateEmployee.vue**
   - Uses `useSupabaseEmployees` from deleted composables
   - **Solution**: Create `/hr/employee/list` API endpoint

6. **pages/Member/Manpower/HRIS/Tab/dialog/tabs/EmployeeDetailsTab.vue**
   - Uses `useSupabaseSchedules` and `useSupabasePayrollGroups`
   - **Solution**: Create `/hr/schedules` and `/hr/payroll-groups` API endpoints

7. **pages/Member/Manpower/HRIS/Tab/dialog/tabs/JobDetailsTab.vue**
   - Uses `useSupabaseSchedules` and `useSupabaseBranches`
   - **Solution**: Create `/hr/branches` API endpoint

8. **pages/Member/Manpower/HRIS/Tab/dialog/tabs/ShiftTab.vue**
   - Uses `useSupabaseSchedules`
   - **Solution**: Same as #6

---

## 📋 Migration Checklist

### Backend API Endpoints Needed:

#### Tasks Module
- [ ] `GET /task/board-lanes` - Get board lanes
- [ ] `GET /task/board-view` - Get tasks with board data (replace Supabase query)
- [ ] `PUT /task/:id/board-lane` - Update task board lane

#### Project Module
- [ ] `GET /project/list` - List projects with filters

#### HR Module
- [ ] `GET /hr/employee/list` - List employees with filters
- [ ] `GET /hr/schedules` - List schedules
- [ ] `GET /hr/payroll-groups` - List payroll groups
- [ ] `GET /hr/shifts` - List shifts
- [ ] `GET /hr/branches` - List branches

#### Realtime (Socket.io)
- [ ] Migrate from Supabase channels to Socket.io rooms
- [ ] Update notification subscriptions
- [ ] Update task subscriptions

### Frontend Composables Needed:

- [ ] `composables/api/useTaskAPI.ts` - Replace Supabase task queries
- [ ] `composables/api/useProjectAPI.ts` - Replace Supabase project queries
- [ ] `composables/api/useEmployeeAPI.ts` - Replace Supabase employee queries
- [ ] `composables/api/useHRConfigAPI.ts` - For schedules, payroll groups, shifts
- [ ] Update realtime composables to use Socket.io

---

## 🚨 Current Build Status: FAILING

**Error Count**: 73 Supabase references
**Build Breaking**: Yes
**Next Step**: Fix build-breaking imports first, then migrate functionality

---

## 📝 Notes

- All Supabase infrastructure has been successfully removed
- Backend already has PostgreSQL via Prisma - just need API endpoints
- Socket.io is already configured - just need to migrate realtime subscriptions
- Most heavy Supabase usage is in Task and HRIS modules

Last Updated: 2025-10-10
