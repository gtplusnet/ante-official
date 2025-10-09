# 📋 Manual Drag-and-Drop Testing Guide

**Project Board Drag-and-Drop Functionality**
**Date**: October 9, 2025
**Status**: Ready for Testing ✅

---

## 🎯 Prerequisites

- ✅ Frontend running on http://localhost:9000
- ✅ Backend running on http://localhost:3000
- ✅ Console errors fixed (404 connections.json resolved)
- ✅ Test user credentials: `guillermotabligan / water123`

---

## 🧪 Testing Procedure

### Step 1: Open Application with DevTools

1. Open Chrome/Edge browser
2. Navigate to: **http://localhost:9000**
3. Press **F12** to open Developer Tools
4. Go to **Console** tab (to monitor errors)
5. Go to **Network** tab (to monitor API calls)

---

### Step 2: Login

1. Login with credentials:
   - **Username**: `guillermotabligan`
   - **Password**: `water123`
2. Wait for dashboard to load
3. **Check Console**: Should be **ZERO errors** ✅

---

### Step 3: Navigate to Projects Page

1. Click on **Projects** in the sidebar menu
2. Wait for projects page to load
3. **Check Console**: Should still be **ZERO errors** ✅
4. **Check Network Tab**: Look for `PUT /project` API call
   - Status should be **200 OK**
   - Response should contain project list

---

### Step 4: Locate Board View

The project page may have different view modes:
- List View (table)
- Grid View (cards)
- **Board View** (Kanban board) ← This is what we need

**Look for**:
- View toggle buttons (usually in toolbar/header)
- Icons like: 📋 (List), 🎴 (Grid), 📊 (Board)
- Button labeled "Board View" or "Kanban"

**If Board View button found**:
- Click it to switch to board view
- Continue to Step 5

**If NO Board View button visible**:
- The board view might be the default view
- OR it might not be implemented yet
- Look for columns with project cards
- Continue to Step 5 anyway

---

### Step 5: Verify Board Structure

**Expected Board Columns** (based on project stages):
- To Do / Backlog
- In Progress
- In Review
- Done / Completed
- Or similar stage names

**Check**:
- [ ] Columns are visible
- [ ] Project cards appear in columns
- [ ] Cards show project name, description, budget
- [ ] Cards have visual drag handles or are draggable

**If NO projects visible**:
- Proceed to **Step 6A: Create Test Projects**

**If projects visible**:
- Proceed to **Step 6B: Test Drag-and-Drop**

---

### Step 6A: Create Test Projects (If Needed)

1. Look for "Add Project" or "New Project" button
2. Create **3 test projects** with different names:
   - **Test Project Alpha**
   - **Test Project Beta**
   - **Test Project Gamma**
3. Set different stages for each project:
   - Alpha: "To Do"
   - Beta: "In Progress"
   - Gamma: "Done"
4. Save each project
5. Return to Board View
6. Verify all 3 projects appear in their respective columns
7. Proceed to **Step 6B**

---

### Step 6B: Test Drag-and-Drop

#### 🎯 Test Case 1: Drag from Column A to Column B

1. **Select a project card** in the first column (e.g., "To Do")
2. **Click and hold** the card with your mouse
3. **Drag** the card to a different column (e.g., "In Progress")
4. **Drop** the card in the target column

**Expected Behavior**:
- ✅ Card moves smoothly during drag
- ✅ Visual feedback (card follows mouse)
- ✅ Target column highlights when card hovers over it
- ✅ Card **instantly appears** in new column (optimistic update)
- ✅ **NO console errors** ❗ **CRITICAL**

**Monitor Network Tab**:
- Look for: `PATCH /project/board-stage`
- Method: **PATCH**
- Status: **200 OK** or **201 Created**

**Click on the request** and check:
- **Request Payload**:
  ```json
  {
    "projectId": "123",
    "nowBoardStageKey": "IN_PROGRESS"
  }
  ```
- **Response** should be success message

**If API call fails**:
- ❌ Note the error status code (400, 404, 500)
- ❌ Check response error message
- ❌ Report back with details

---

#### 🎯 Test Case 2: Drag Back to Original Column

1. **Drag the same card back** to its original column
2. Verify smooth animation
3. Check Network tab for another `PATCH /project/board-stage` call
4. Status should be **200 OK**

**Expected**:
- ✅ Card returns to original position
- ✅ API call succeeds
- ✅ **NO console errors**

---

#### 🎯 Test Case 3: Drag Multiple Cards

1. Drag **2-3 different project cards** to various columns
2. Move cards between multiple columns
3. Create a sequence like:
   - Card A: To Do → In Progress
   - Card B: In Progress → Done
   - Card C: Done → To Do

**Monitor**:
- ✅ Each drag triggers separate API call
- ✅ All API calls return 200 OK
- ✅ Cards stay in their new positions
- ✅ **ZERO console errors** throughout

---

### Step 7: Test Persistence (Refresh Page)

1. **Note the current positions** of all project cards
   - Which cards are in which columns
   - Take a mental snapshot or screenshot

2. **Refresh the page** (F5 or Ctrl+R)

3. **Wait for page to reload**

4. **Verify positions are saved**:
   - ✅ All cards appear in the same columns as before refresh
   - ✅ Positions are persisted in database
   - ✅ **NO console errors** after refresh

**If positions NOT saved**:
- ❌ Cards return to original positions
- ❌ This indicates backend is not saving the changes
- ❌ Check Network tab for failed API calls

---

### Step 8: Advanced Testing (Optional)

#### Edge Case 1: Rapid Dragging
- Drag multiple cards quickly one after another
- Verify all API calls complete successfully
- No race conditions or conflicts

#### Edge Case 2: Network Error Simulation
- Open DevTools → Network tab
- Enable "Offline" mode
- Try dragging a card
- **Expected**: Card should stay in original position (rollback)
- Re-enable network and verify functionality returns

#### Edge Case 3: Cross-Column Drag
- Drag a card from first column to last column (skipping middle columns)
- Verify direct column-to-column movement works

---

## ✅ Success Criteria

All of the following MUST be true for drag-and-drop to be considered "100% working":

- [ ] **Zero console errors** throughout all testing
- [ ] **Zero 404 errors** in Network tab
- [ ] Drag-and-drop animation is smooth
- [ ] Visual feedback during drag (card follows mouse)
- [ ] Target column highlights when card hovers
- [ ] Card instantly moves to new column (optimistic UI)
- [ ] `PATCH /project/board-stage` API call succeeds (200 OK)
- [ ] API request payload is correct (projectId, nowBoardStageKey)
- [ ] Position persists after page refresh
- [ ] Multiple cards can be dragged successfully
- [ ] No race conditions or conflicts
- [ ] Rollback works if API call fails (error handling)

---

## ❌ Failure Scenarios and Solutions

### Scenario 1: Console Errors Appear

**Error**: `Failed to load resource: 404`
- **Solution**: Already fixed for connections.json
- **If other 404s appear**: Identify missing resource and fix

**Error**: `400 Bad Request` on API call
- **Check**: Request payload format
- **Verify**: Backend expects `projectId` and `nowBoardStageKey`

**Error**: `500 Internal Server Error`
- **Check**: Backend logs (`pm2 logs ante-backend --lines 50 --nostream`)
- **Look for**: Exception stack traces
- **Fix**: Backend issue in `project.controller.ts` or `project.service.ts`

---

### Scenario 2: Drag-and-Drop Not Working

**Card won't drag**:
- Check if card has `draggable="true"` attribute (inspect element)
- Verify drag event handlers are attached

**Card drags but doesn't drop**:
- Check drop zone event handlers
- Look for JavaScript errors in console

**Card drops but doesn't stay**:
- API call likely failing
- Check Network tab for error response
- Verify optimistic update and rollback logic

---

### Scenario 3: Position Not Persisting

**Refresh returns cards to original positions**:
- Backend is not saving changes
- Check `PATCH /project/board-stage` endpoint
- Verify database update query executes
- Check backend logs for errors

---

## 🔧 Debugging Commands

**Check backend logs**:
```bash
pm2 logs ante-backend --lines 50 --nostream
```

**Test API endpoint directly**:
```bash
# Get auth token first
TOKEN=$(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"guillermotabligan","password":"water123"}' | jq -r '.token')

# Test drag-drop endpoint
curl -X PATCH http://localhost:3000/project/board-stage \
  -H "Content-Type: application/json" \
  -H "token: $TOKEN" \
  -d '{"projectId":"1","nowBoardStageKey":"IN_PROGRESS"}' | jq
```

**Run Playwright verification test**:
```bash
cd /home/jhay/projects/ante-official/playwright-testing
npx playwright test tests/verify-no-404-errors.spec.ts --reporter=list
```

---

## 📊 Report Template

After testing, fill out this template:

```
# Drag-and-Drop Testing Report

Date: [Insert Date]
Tester: [Your Name]

## Test Results

### Console Errors:
- [ ] Zero errors ✅
- [ ] Errors found ❌ (list below)
  - Error 1: [description]
  - Error 2: [description]

### Drag-and-Drop Functionality:
- [ ] Cards drag smoothly ✅ / ❌
- [ ] Visual feedback works ✅ / ❌
- [ ] Cards drop successfully ✅ / ❌
- [ ] Optimistic UI updates ✅ / ❌

### API Calls:
- [ ] PATCH /project/board-stage called ✅ / ❌
- [ ] Status code: [200/400/500/etc]
- [ ] Request payload correct ✅ / ❌
- [ ] Response successful ✅ / ❌

### Persistence:
- [ ] Positions saved after refresh ✅ / ❌

### Overall Status:
- [ ] 100% Working ✅
- [ ] Issues found ❌

### Issues/Notes:
[Any issues, bugs, or observations]

### Screenshots:
[Attach screenshots if needed]
```

---

## 🎉 Expected Final State

**When all tests pass, you should have**:
- Clean console (zero errors)
- Smooth drag-and-drop functionality
- Successful API calls
- Persistent project positions
- Perfect user experience

**This confirms the drag-and-drop feature is working 100%! ✅**

---

**Need Help?**
- Check backend logs: `pm2 logs ante-backend --nostream`
- Review API endpoint: `backend/src/modules/project/project/project/project.controller.ts`
- Review frontend component: `frontends/frontend-main/src/pages/Member/Project/ProjectBoardView.vue`
