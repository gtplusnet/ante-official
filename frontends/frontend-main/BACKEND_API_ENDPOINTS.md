# Backend API Endpoints - Available Now

## 📋 Task Module (`/task`)

### GET Endpoints
- `GET /task` - Get task information (query: `id`)
- `GET /task/ordered` - Get ordered tasks (query: `viewType`, `groupingMode`, `groupingValue`, `filter`)
- `GET /task/count-by-status` - Get task count by status
- `GET /task/dashboard` - Get dashboard tasks (query: `tab`, `search`)
- `GET /task/users` - Get task users
- `GET /task/own-task` - Get own task list (with filters)
- `GET /task/quest-task` - Get quest tasks (with filters)
- `GET /task/task-by-id` - Get task by ID
- `GET /task/collaborators` - Get collaborators (query: `taskId`)

### POST Endpoints
- `POST /task/create` - Create task
- `POST /task/initialize-personal-order` - Initialize personal task order

### PUT Endpoints
- `PUT /task` - Update task information (query: `id`, body: updates)
- `PUT /task/update` - Update task (body: `id` + updates)
- `PUT /task/assign` - Assign task
- `PUT /task/accept` - Accept task
- `PUT /task/reject` - Reject task
- `PUT /task/claim` - Claim task
- `PUT /task/read` - Mark task as read
- `PUT /task/start` - Start task (move to IN_PROGRESS)
- `PUT /task/complete` - Mark task as done (move to DONE)
- `PUT /task/add-watcher` - Add watcher
- `PUT /task/remove-watcher` - Remove watcher
- `PUT /task/move-task-to-backlog` - Move task to backlog
- `PUT /task/move` - Move task to project (body: `taskId`, `boardLaneId`, `projectId`, `order`)
- `PUT /task/update-order` - Update task ordering
- `PUT /task/restore/:id` - Restore deleted task

### DELETE Endpoints
- `DELETE /task/:id` - Delete task

---

## 📋 Board Lane Module (`/board-lane`)

### GET Endpoints
- `GET /board-lane` - Get all board lanes

### POST Endpoints
- `POST /board-lane` - Create board lane

---

## 👥 HRIS Employee Module (`/hris/employee`)

### GET Endpoints
- `GET /hris/employee/info` - Get employee info (query: `accountId`)
- `GET /hris/employee/leave-summary` - Get leave summary (query: `accountId`)
- `GET /hris/employee/allowances` - Get allowances (query: `accountId`)
- `GET /hris/employee/deductions` - Get deductions (query: `accountId`)
- `GET /hris/employee/scheduling-list` - Get scheduling list (query: `page`, `perPage`, `search`)
- `GET /hris/employee/scheduling-shifts` - Get shifts for scheduling
- `GET /hris/employee/export` - Export employees to Excel
- `GET /hris/employee/template` - Download employee template
- `GET /hris/employee/contract/list` - Get contracts (query: `accountId`)
- `GET /hris/employee/contract/employment-status` - Get employment status reference
- `GET /hris/employee/document/list` - Get documents (query params)
- `GET /hris/employee/document/types` - Get document types

### PUT Endpoints
- `PUT /hris/employee/table` - Get employee table (with pagination, filters)

### POST Endpoints
- `POST /hris/employee/add` - Add employee
- `POST /hris/employee/contract/add` - Add contract
- `POST /hris/employee/document/upload` - Upload document

### PATCH Endpoints
- `PATCH /hris/employee/update` - Update employee
- `PATCH /hris/employee/restore` - Restore employee
- `PATCH /hris/employee/update-job-details` - Update job details
- `PATCH /hris/employee/update-government-details` - Update government details
- `PATCH /hris/employee/update-schedule` - Update schedule
- `PATCH /hris/employee/contract/edit` - Edit contract
- `PATCH /hris/employee/contract/inactive` - Set contract inactive
- `PATCH /hris/employee/document/:id` - Update document

### DELETE Endpoints
- `DELETE /hris/employee/delete` - Delete employee
- `DELETE /hris/employee/document/:id` - Delete document

---

## ⚙️ HR Configuration Module

### Payroll Group (`/hris/payroll-group`)
- `GET /hris/payroll-group/list` - List payroll groups
- `GET /hris/payroll-group/info` - Get payroll group info
- `GET /hris/payroll-group/overtime-default` - Get overtime defaults

### Shift (`/hris/shift`)
- `GET /hris/shift/list` - List shifts
- `GET /hris/shift/info` - Get shift info
- `GET /hris/shift/type` - Get shift types

### Schedule (`/hris/schedule`)
- `GET /hris/schedule/list` - List schedules
- `GET /hris/schedule/info` - Get schedule info

### Payroll Approvers (`/hris/payroll-approvers`)
- `GET /hris/payroll-approvers/employee-select` - Get employees for selection

---

## 🏢 Branch/Location Module (`/branch`)

- `GET /branch/info` - Get branch info
- `GET /branch/parent-options` - Get parent branch options
- `GET /branch/tree` - Get branch tree

---

## 🎯 Component to API Mapping

### TaskBoardView.vue
**Current**: Uses Supabase for BoardLane and Task queries
**Replace With**:
- `GET /board-lane` - Get board lanes
- `GET /task/ordered` - Get ordered tasks
- `PUT /task/move` - Move task to different lane

### TaskList.vue
**Current**: Uses `useTask` composable (deleted)
**Replace With**:
- `GET /task/ordered` - Get ordered tasks
- `PUT /task/update-order` - Update task order

### useProjectList.ts
**Current**: Uses `useSupabaseTable` (deleted)
**Replace With**:
- `GET /project/list` - Need to verify this endpoint exists

### HRIS Components

#### ViewCreateEmployee.vue
**Current**: Uses `useSupabaseEmployees`
**Replace With**:
- `PUT /hris/employee/table` - Get employee list
- `POST /hris/employee/add` - Create employee

#### EmployeeDetailsTab.vue
**Current**: Uses `useSupabaseSchedules`, `useSupabasePayrollGroups`
**Replace With**:
- `GET /hris/schedule/list` - Get schedules
- `GET /hris/payroll-group/list` - Get payroll groups

#### JobDetailsTab.vue
**Current**: Uses `useSupabaseBranches`
**Replace With**:
- `GET /branch/tree` - Get branch tree

#### ShiftTab.vue
**Current**: Uses `useSupabaseSchedules`
**Replace With**:
- `GET /hris/schedule/list` - Get schedules
- `GET /hris/shift/list` - Get shifts

---

## 📝 Next Steps

1. Create API composables:
   - `composables/api/useTaskAPI.ts`
   - `composables/api/useBoardLaneAPI.ts`
   - `composables/api/useHRISAPI.ts`
   - `composables/api/useBranchAPI.ts`

2. Update components to use new composables

3. Remove all Supabase imports

4. Test build

---

Last Updated: 2025-10-10
