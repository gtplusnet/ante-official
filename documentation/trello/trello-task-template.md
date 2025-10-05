# Trello Task Creation Template

**Quick guide for creating well-structured development tasks.**

---

## 📋 Steps When Asked to Create a Task

When someone asks you to create a Trello task, follow these steps:

### 1. **Understand the Requirements**
   - Read the request carefully
   - Identify the core objective and desired outcome
   - Determine task type: [FEAT], [BUG], [ENHANCEMENT], [REFACTOR], etc.

### 2. **Ask Clarifying Questions**
   Before creating the task, ask questions about anything unclear:

   **Required Information:**
   - ❓ **Which frontend app?** (frontend-main, gate-app, guardian-app, facial, user-manual)
   - ❓ **Who is the target user?** (For user story: "As a...")
   - ❓ **What is the expected behavior?** (For acceptance criteria)
   - ❓ **Are there backend changes needed?** (API endpoints, database)
   - ❓ **What is the priority?** (High, Medium, Low)
   - ❓ **Complexity estimate?** (Easy, Medium, Hard)
   - ❓ **Which module?** (HRIS, CMS, Treasury, etc.)
   - ❓ **Any dependencies?** (Other tasks, external APIs)

   **Example Clarification Questions:**
   ```
   Before I create the task, I need to clarify:

   1. Which frontend app should this be implemented in?
      - frontend-main (Main ERP)?
      - frontend-gate-app (School gate)?
      - frontend-guardian-app (Parent portal)?
      - ante-facial-recognition (Mobile app)?

   2. Who is the primary user for this feature?
      (e.g., HR Manager, Teacher, Student, Admin)

   3. What are the specific success criteria?
      (What should happen when the feature works correctly?)

   4. Are there any backend/database changes needed?

   5. What is the priority and complexity level?
   ```

### 3. **Gather Complete Information**
   - Don't make assumptions - ask for clarification
   - Understand edge cases and error scenarios
   - Confirm technical scope (frontend only, backend only, full-stack?)
   - Identify any existing code/components to reference

### 4. **Create the Task**
   - Only after all questions are answered
   - Use the template below with complete information
   - Include all gathered details in appropriate sections
   - ⚠️ **IMPORTANT: Create task in "Drafts" list** (not "To Do")

### 5. **Validate Before Posting**
   - Review the Quick Checklist (see below)
   - Ensure all required sections are filled
   - Confirm frontend app is specified
   - Verify acceptance criteria are clear and testable
   - ✅ **Confirm task is in "Drafts" list** - Tasks are reviewed and moved to "To Do" when ready

---

## Card Title Format
```
[TYPE] Brief, clear description of what needs to be done
```

**Types:** `[FEAT]` `[BUG]` `[ENHANCEMENT]` `[REFACTOR]` `[DOCS]` `[TEST]` `[CHORE]`

**Examples:**
- `[FEAT] Add employee attendance export to Excel`
- `[BUG] Fix login timeout on mobile devices`
- `[ENHANCEMENT] Improve dashboard loading performance`

---

## Card Description Template

**⚠️ IMPORTANT: We have multiple frontend apps!** Always specify which one:
- `frontend-main` - Main ERP application (Vue 3 + Quasar)
- `frontend-gate-app` - School gate attendance app (Vue 3 + Quasar)
- `frontend-guardian-app` - Parent portal app (Vue 3 + Quasar)
- `ante-facial-recognition` - Facial recognition mobile app (Flutter)
- `user-manual` - User documentation (VitePress)

**Not sure which frontend?** Ask the project manager or team for clarification BEFORE creating the task!

Copy and paste this into your Trello card description:

```markdown
## User Story
As a [type of user],
I want to [perform some action],
So that I can [achieve some goal].

## Why This Task?
[Brief explanation of the problem this solves or value it provides]

## Acceptance Criteria
- [ ] Given [context], when [action], then [expected result]
- [ ] Given [context], when [action], then [expected result]
- [ ] Given [context], when [action], then [expected result]

## Technical Requirements

### Frontend
⚠️ **IMPORTANT:** Specify which frontend app!
- **Frontend App:** [frontend-main | frontend-gate-app | frontend-guardian-app | ante-facial-recognition | user-manual]
  - **Not sure?** Ask project manager/team for clarification first!
- Files: [list files to modify/create]
- Components: [list components]
- UI: [any specific UI requirements]

### Backend
- Endpoints: [list API endpoints]
- Database: [any schema changes - YES/NO]
- Logic: [brief description]

### Testing Required
- [ ] Unit tests
- [ ] E2E tests (playwright-testing/)
- [ ] Manual testing scenarios

## Definition of Done
- [ ] Code follows SOLID principles
- [ ] Tests written and passing (80%+ coverage)
- [ ] Code reviewed by peer
- [ ] `yarn build` runs without errors
- [ ] Documentation updated
- [ ] PR created with clear description
- [ ] Manual testing completed
- [ ] No console errors/warnings

## Dependencies
[List any dependent tasks or external dependencies]

## Notes
[Any additional context, links, or important information]
```

---

## Quick Checklist

Before saving your card, verify:

- [ ] **Card in "Drafts" List** - ⚠️ New tasks MUST go in "Drafts", not "To Do"
- [ ] **Title** - Clear with [TYPE] prefix
- [ ] **User Story** - As a/I want/So that format filled
- [ ] **Acceptance Criteria** - At least 3 specific criteria
- [ ] **Technical Requirements** - Frontend/Backend sections completed
- [ ] **Frontend App Specified** - Which frontend: main/gate/guardian/facial/manual?
- [ ] **DoD Checklist** - Present and relevant items checked
- [ ] **Labels Added** - Priority, Module, Complexity
- [ ] **Assignee** - Developer assigned
- [ ] **Due Date** - Realistic deadline set (if needed)

---

## Labels to Add

**Priority:** High | Medium | Low
**Complexity:** Easy | Medium | Hard
**Module:** HRIS | CMS | Treasury | Assets | Projects | Tasks
**Type:** Frontend | Backend | Full-Stack | Database

---

## Board Lists & Workflow

**⚠️ CRITICAL: Newly created tasks MUST be in "Drafts" list!**

**Board Lists (in order):**
1. **Drafts** - ✅ **All new tasks go here first**
   - Tasks are reviewed by project manager/team
   - Refined and validated before moving to "To Do"

2. **To Do** - Ready to be worked on (source of truth)
   - Only well-defined, approved tasks
   - Moved here after review from "Drafts"

3. **In Progress** - Active development
   - Moved here when developer starts working

4. **QA Review** - Awaiting review/testing
   - Moved here after PR is created

5. **Done** - Completed tasks
   - Moved here after PR is merged

**Workflow:**
```
Drafts → To Do → In Progress → QA Review → Done
```

---

## Common Mistakes to Avoid

1. ❌ **Creating tasks in "To Do" instead of "Drafts"** - All new tasks MUST start in "Drafts" list!
2. ❌ **Creating tasks without asking clarifying questions** - Always understand requirements fully first!
3. ❌ Vague titles like "Fix bug" or "Update feature"
4. ❌ **Not specifying which frontend app** (we have 5 different frontends!)
5. ❌ Missing acceptance criteria
6. ❌ No Definition of Done checklist
7. ❌ Tasks too large (should be 1-3 days max)
8. ❌ Forgetting to add labels or assignee
9. ❌ Making assumptions instead of asking for clarification

---

## Tips

- **Follow the 5-step process** - See "Steps When Asked to Create a Task" section above
- **Ask questions first** - Never create a task without fully understanding requirements
- **Specify the frontend** - We have 5 different frontends! Always specify which one. If unsure, ask for clarification first.
- **Keep it small** - If task takes >3 days, break it down
- **Be specific** - What exactly should work when done?
- **Think errors** - Add acceptance criteria for error cases
- **Link related work** - Reference other cards, PRs, docs
- **Update progress** - Use comments to track status

---

**Questions?** See full guide at `/documentation/` or ask the team.

**Last Updated:** 2025-10-05
