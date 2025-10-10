# Supabase Removal - Testing Guide

## Overview
This guide provides instructions for testing the frontend after complete removal of Supabase client library and migration to backend APIs.

**Date**: 2025-10-10
**Status**: ✅ Build Passing | 🧪 Testing Required

---

## What Was Changed

### 1. Complete Supabase Removal
- ✅ Removed `@supabase/supabase-js` package from `package.json`
- ✅ Deleted `frontends/frontend-main/src/boot/supabase.ts`
- ✅ Deleted `frontends/frontend-main/src/services/supabase.ts`
- ✅ Deleted all Supabase composables:
  - `useSupabaseBranches.ts`
  - `useSupabaseSchedules.ts`
  - `useSupabasePayrollGroups.ts`
  - `useSupabaseShifts.ts`
  - `useSupabaseRealtime.ts`
  - `useSupabaseRealtimeTable.ts`

### 2. Task Board Migration (FULLY MIGRATED)
**File**: `frontends/frontend-main/src/pages/Member/Task/TaskBoardView.vue`

**Backend API Endpoints Used**:
- `GET /board-lane` - Fetch board lanes (columns)
- `GET /task/ordered` - Fetch tasks with ordering
- `PUT /task/move` - Move tasks between lanes (drag & drop)

**Features**:
- ✅ Centralized caching with `useCache` composable
- ✅ Optimistic updates for drag & drop
- ✅ Cache invalidation on task events
- ✅ Smooth UX with immediate UI updates
- ✅ Automatic rollback on API errors
- ✅ Cache indicator showing data freshness

**Code Changes**:
- Removed Supabase client imports
- Replaced Supabase queries with backend API calls
- Implemented optimistic updates
- Added error handling and rollback logic

### 3. HRIS Components (STUBBED - Awaiting Backend APIs)
The following HRIS components have been **stubbed** (not migrated yet) because backend APIs don't exist:

**Files**:
1. `JobDetailsTab.vue` - Stubbed `useSupabaseBranches`
2. `EmployeeDetailsTab.vue` - Stubbed `useSupabaseSchedules`, `useSupabasePayrollGroups`
3. `ShiftTab.vue` - Stubbed `useSupabaseSchedules`
4. `ManpowerAddEditScheduleDialog.vue` - Stubbed `useSupabaseShifts`
5. `ManpowerAddEditShiftDialog.vue` - Stubbed `useSupabaseSchedules`
6. `ManpowerJobDetailsDialog.vue` - Stubbed `useSupabaseBranches`
7. `EditCreateEmployee.vue` - Stubbed `useSupabaseBranches`, `useSupabaseSchedules`, `useSupabasePayrollGroups`

**Stub Pattern**:
```javascript
// Temporary stub until backend API is created
const composable = {
  options: { value: [] },
  fetchByCompany: async () => {},
  fetch: async () => {}
};
```

**Why Stubbed?**:
- No backend API endpoints exist yet
- Maintains same interface to prevent runtime errors
- Functions return empty data immediately
- Marked with `// TODO: Migrate to backend API` comments

### 4. Project Overview Widgets (STUBBED)
**Files**:
1. `ProjectMetrics.vue` - Stubbed `fetchTaskStats()`, `fetchTeamSize()`
2. `TaskSummaryWidget.vue` - Stubbed `fetchTasks()`

**Why Stubbed?**:
- Awaiting backend API for project-scoped task queries
- Shows empty/placeholder data until backend APIs are created

### 5. Store and Composables (STUBBED)
**Files**:
1. `stores/taskPhase.ts` - Stubbed realtime subscriptions
2. `useSupabaseRealtime.ts` - Stubbed (deleted)
3. `useSupabaseRealtimeTable.ts` - Stubbed (deleted)

---

## Manual Testing Instructions

### Prerequisites
1. Backend API must be running: `pm2 status ante-backend`
2. Frontend dev server must be running: `pm2 status frontend-main`
3. Login credentials: `guillermotabligan` / `water123`

### Test 1: Task Board - Basic Functionality ✅ PRIORITY
**Purpose**: Verify TaskBoardView.vue works with backend API

**Steps**:
1. Open browser: http://localhost:9000
2. Login with credentials above
3. Navigate to: **Member → Tasks** (click "My Tasks" or any task view in sidebar)
4. Open browser DevTools (F12)
5. Go to **Console** tab
6. Click on board view (should see TaskBoardView component)

**Expected Results**:
- ✅ Board lanes load (columns like "To Do", "In Progress", "Done")
- ✅ Tasks appear in appropriate columns
- ✅ Task count badges show correct numbers
- ✅ **NO console errors** (especially no Supabase errors)
- ✅ Cache indicator appears if using cached data ("Updated X minutes ago")

**Check Console For**:
- ❌ NO errors containing "supabase" or "Supabase"
- ❌ NO errors about missing modules
- ❌ NO 404 errors for API endpoints
- ✅ Should see API calls to `/board-lane` and `/task/ordered` in Network tab

### Test 2: Task Board - Drag & Drop ✅ PRIORITY
**Purpose**: Verify drag & drop uses backend API

**Steps**:
1. In Task Board view (from Test 1)
2. Find a task card
3. Drag it from one column to another
4. Watch the DevTools **Network** tab
5. Check **Console** tab for errors

**Expected Results**:
- ✅ Task moves immediately (optimistic update)
- ✅ Task stays in new column after drop
- ✅ Network tab shows `PUT /task/move` request
- ✅ No errors in console
- ✅ If error occurs, task rolls back to original column

### Test 3: Task Board - Refresh
**Purpose**: Verify cache refresh works

**Steps**:
1. In Task Board view
2. Look for refresh icon button (circular arrow)
3. Click the refresh button
4. Watch for notification and cache indicator

**Expected Results**:
- ✅ Loading spinner appears briefly
- ✅ "Tasks refreshed" notification shows
- ✅ Cache indicator updates ("Updated just now")
- ✅ Tasks reload from backend API

### Test 4: HRIS Components - Stubbed Features ⚠️ KNOWN LIMITATION
**Purpose**: Verify stubbed components don't crash

**Steps**:
1. Navigate to: **Member → Manpower → HRIS**
2. Click "Add Employee" or edit an existing employee
3. Open different tabs in the dialog:
   - Employee Details
   - Job Details
   - Shift

**Expected Results**:
- ✅ Dialogs open without errors
- ✅ Forms render correctly
- ⚠️ Dropdowns for Branch, Schedule, Payroll Group, Shift may be EMPTY
- ✅ Console shows warnings: `"fetchBranches not implemented - needs backend API"`
- ❌ NO crashes or unhandled errors

**Known Limitations**:
- Branch dropdowns: Empty (awaiting `/branch/list` backend API)
- Schedule dropdowns: Empty (awaiting `/schedule/list` backend API)
- Payroll Group dropdowns: Empty (awaiting `/payroll-group/list` backend API)
- Shift dropdowns: Empty (awaiting `/shift/list` backend API)

### Test 5: Project Overview Widgets ⚠️ KNOWN LIMITATION
**Purpose**: Verify project widgets don't crash

**Steps**:
1. Navigate to: **Member → Projects**
2. Click on any project
3. View the Project Overview page
4. Look at the widgets:
   - Project Metrics (Budget Health, Days to Deadline, Task Progress, Team Members)
   - Task Summary Widget

**Expected Results**:
- ✅ Widgets render without crashing
- ⚠️ Task Progress and Team Members show "No Tasks" / "No Team"
- ✅ Console shows warnings: `"fetchTaskStats not implemented - needs backend API"`
- ❌ NO unhandled errors

---

## Console Error Checklist

### ✅ ZERO Errors Expected
When testing, the browser console should have **ZERO** errors related to:
- ❌ "supabase" or "Supabase"
- ❌ "Could not resolve" or "Cannot find module"
- ❌ "TypeError" or "ReferenceError" from deleted files
- ❌ Unhandled promise rejections

### ⚠️ Warnings Expected (OK)
These console warnings are **expected** and **acceptable**:
- ✅ `"fetchBranches not implemented - needs backend API"`
- ✅ `"fetchSchedules not implemented - needs backend API"`
- ✅ `"fetchTaskStats not implemented - needs backend API"`
- ✅ `"fetchTeamSize not implemented - needs backend API"`

These warnings indicate stubbed functionality awaiting backend API development.

---

## Playwright Test Suite

**File**: `/home/jhay/projects/ante-official/playwright-testing/tests/frontend/task-board-migration.spec.ts`

**Tests Included**:
1. Should load board lanes from backend API
2. Should load tasks from backend API
3. Should refresh tasks using backend API
4. Should show cached data indicator when data is from cache
5. Should not have any Supabase console errors
6. Should handle drag and drop using backend API

**Run Tests** (headless only):
```bash
cd /home/jhay/projects/ante-official/playwright-testing
npx playwright test tests/frontend/task-board-migration.spec.ts
```

**Note**: Tests may need route adjustments based on actual task page routing.

---

## Backend API Requirements

### ✅ Already Implemented
- `GET /board-lane` - Get board lanes
- `GET /task/ordered` - Get ordered tasks
- `PUT /task/move` - Move task to different lane

### ⏳ Pending Implementation
The following APIs need to be created to complete the migration:

**Branch Management**:
- `GET /branch/list` - List branches for dropdowns

**Schedule Management**:
- `GET /schedule/list` - List schedules for dropdowns
- `GET /schedule/:id` - Get schedule details

**Payroll Group Management**:
- `GET /payroll-group/list` - List payroll groups for dropdowns

**Shift Management**:
- `GET /shift/list` - List shifts for dropdowns
- `GET /shift/:id` - Get shift details

**Project Tasks**:
- `GET /task/by-project/:projectId` - Get tasks for a specific project
- `GET /task/stats/:projectId` - Get task statistics for project metrics

**Team Management**:
- `GET /team/by-project/:projectId` - Get team members for a project

---

## Files Modified Summary

### Deleted Files (8)
1. `boot/supabase.ts`
2. `services/supabase.ts`
3. `composables/supabase/useSupabaseBranches.ts`
4. `composables/supabase/useSupabaseSchedules.ts`
5. `composables/supabase/useSupabasePayrollGroups.ts`
6. `composables/supabase/useSupabaseShifts.ts`
7. `composables/supabase/useSupabaseRealtime.ts`
8. `composables/supabase/useSupabaseRealtimeTable.ts`

### Fully Migrated (1)
1. `pages/Member/Task/TaskBoardView.vue` - ✅ Backend API

### Stubbed - HRIS Components (7)
1. `pages/Member/Manpower/HRIS/Tab/dialog/tabs/JobDetailsTab.vue`
2. `pages/Member/Manpower/HRIS/Tab/dialog/tabs/EmployeeDetailsTab.vue`
3. `pages/Member/Manpower/HRIS/Tab/dialog/tabs/ShiftTab.vue`
4. `pages/Member/Manpower/dialogs/configuration/ManpowerAddEditScheduleDialog.vue`
5. `pages/Member/Manpower/dialogs/configuration/ManpowerAddEditShiftDialog.vue`
6. `pages/Member/Manpower/dialogs/ManpowerJobDetailsDialog.vue`
7. `pages/Member/Manpower/dialogs/EditCreateEmployee.vue`

### Stubbed - Project Widgets (2)
1. `pages/Member/Project/ProjectOverview/Widgets/ProjectMetrics.vue`
2. `pages/Member/Project/ProjectOverview/Widgets/TaskSummaryWidget.vue`

### Stubbed - Stores (1)
1. `stores/taskPhase.ts`

### Stubbed - Other (1)
1. `pages/Member/Task/TaskList.vue`

---

## Known Issues & Limitations

### 1. HRIS Dropdowns Empty
**Issue**: Branch, Schedule, Payroll Group, and Shift dropdowns are empty
**Reason**: No backend APIs exist yet
**Impact**: Cannot create/edit employee job details with these fields
**Workaround**: Backend APIs need to be implemented first
**Status**: ⏳ Pending backend development

### 2. Project Widgets Show Empty Data
**Issue**: Task Progress and Team Members show "No Tasks" / "No Team"
**Reason**: No backend APIs for project-scoped queries
**Impact**: Project overview widgets don't show real data
**Workaround**: Backend APIs need to be implemented
**Status**: ⏳ Pending backend development

### 3. Realtime Updates Disabled
**Issue**: Task board doesn't update in realtime when other users make changes
**Reason**: Supabase realtime subscriptions removed, WebSocket not implemented
**Impact**: Users need to manually refresh to see updates
**Workaround**: Implement WebSocket-based realtime updates in backend
**Status**: ⏳ Future enhancement

---

## Success Criteria

### ✅ Must Pass
- [x] Build passes with no errors
- [ ] Task Board loads without errors
- [ ] Task Board drag & drop works
- [ ] **ZERO Supabase console errors**
- [ ] **ZERO unhandled runtime errors**
- [ ] HRIS dialogs open without crashing (even with empty dropdowns)

### ⚠️ Known Limitations (Acceptable)
- [ ] HRIS dropdowns may be empty (stubbed)
- [ ] Project widgets may show placeholder data (stubbed)
- [ ] Console warnings for unimplemented APIs (expected)

---

## Next Steps

### 1. Complete Manual Testing
Follow all test cases in this guide and verify:
- Task Board fully functional
- No console errors
- Stubbed components render without crashing

### 2. Backend API Development
Prioritize these APIs:
1. `/branch/list` - Unblock employee job details
2. `/schedule/list` - Unblock shift management
3. `/task/by-project/:projectId` - Unblock project widgets
4. `/team/by-project/:projectId` - Unblock team widget

### 3. Progressive Migration
As backend APIs become available:
- Replace stubbed composables with real API calls
- Update components to use backend data
- Remove `// TODO: Migrate to backend API` comments

### 4. Realtime Updates (Future)
Consider implementing:
- WebSocket-based realtime updates for task board
- Server-sent events for notifications
- Polling fallback for browsers without WebSocket support

---

## Questions or Issues?

If you encounter:
- Unexpected console errors
- Application crashes
- Features not working as described

**Check**:
1. Backend API is running (`pm2 status ante-backend`)
2. Frontend dev server is running (`pm2 status frontend-main`)
3. No network errors in DevTools Network tab
4. API endpoints return valid responses (not 404)

**Report**:
- Screenshot of console errors
- Browser and version
- Steps to reproduce
- Expected vs actual behavior

---

**Last Updated**: 2025-10-10
**Build Status**: ✅ PASSING
**Test Status**: ⏳ Manual testing required
