---
description: Automated Trello task workflow (AI-driven, no user intervention)
tags: [trello, workflow, git, pr, automated]
---

# Automated Trello Task Workflow

Fully automated workflow for managing Trello tasks. AI analyzes and selects the most urgent task, creates branches, and handles PR creation automatically.

## Trello Board Configuration

### Board Lists (IDs)
- **To Do**: 68de5fcf7534f0085373f7f0
- **In Progress**: 68de5fd2323f4388c651cdef
- **QA Review**: 68de606c8035e07e7dcd094c
- **Done**: 68de5fd51be89a62a492b228

---

## Main Workflow Logic

When `/trello-task` is invoked, automatically determine the current state and take appropriate action:

1. **If on main branch** → Start new task workflow (Workflow A)
2. **If on feature branch** → Complete task and create PR (Workflow B)

No user prompts. AI makes all decisions based on context analysis.

---

## Workflow A: Start New Task (Auto-Select Most Urgent)

**Trigger**: User is on main branch

### Step 1: Check Prerequisites

1. Verify git status
2. If uncommitted changes:
   - Automatically stash them
   - Continue with workflow
   - Note: Will remind user to apply stash later

### Step 2: Sync with Main

```bash
git checkout main
git pull origin main
```

### Step 3: Fetch and Analyze Tasks

1. Fetch all cards from "To Do" list (ID: 68de5fcf7534f0085373f7f0)
2. If no tasks available:
   - Display: "✅ No pending tasks in 'To Do'. All caught up!"
   - Exit

### Step 4: AI Task Selection (AUTOMATIC)

Analyze all tasks and score them based on:

#### Urgency Score Calculation

**Due Date Score** (40 points max):
- Overdue: 40 points
- Due today: 35 points
- Due within 3 days: 30 points
- Due within 7 days: 20 points
- Due within 14 days: 10 points
- No due date: 0 points

**Label Score** (30 points max):
- Labels containing "urgent", "critical", "blocker", "high-priority": +30 points
- Labels containing "bug", "security", "production": +20 points
- Labels containing "enhancement", "feature": +10 points
- Labels containing "low-priority", "nice-to-have": +5 points

**Description Analysis Score** (20 points max):
- Contains "URGENT", "CRITICAL", "ASAP": +20 points
- Contains "Important", "High priority": +15 points
- Contains "Bug", "Issue", "Broken": +10 points
- Contains "Enhancement", "Improvement": +5 points

**Age Score** (10 points max):
- Created >14 days ago: +10 points
- Created >7 days ago: +5 points
- Created >3 days ago: +2 points
- Created recently: 0 points

**Total Score**: Sum all scores (max 100 points)

**Selection**: Pick the task with the highest score

### Step 5: Determine Task Type (AUTOMATIC)

Analyze selected card to determine type:

**Check labels first**:
- If has "bug", "fix", "issue" label → `bug/`
- If has "feature", "new" label → `feat/`
- If has "enhancement", "improve", "optimize" label → `enhancement/`

**Check title if labels unclear**:
- Title starts with "Fix", "Bug", "Issue" → `bug/`
- Title starts with "Add", "New", "Create" → `feat/`
- Title starts with "Improve", "Enhance", "Optimize", "Update" → `enhancement/`

**Default**: `enhancement/`

### Step 6: Generate Branch Name (AUTOMATIC)

1. Extract card title
2. Apply transformations:
   - Convert to lowercase
   - Remove special characters (keep only alphanumeric and spaces)
   - Replace spaces with hyphens
   - Truncate to max 50 characters
   - Add type prefix
3. Branch name format: `{type}/{sanitized-title}`

**Examples**:
- "Fix login redirect bug" → `bug/fix-login-redirect-bug`
- "Add dark mode toggle" → `feat/add-dark-mode-toggle`
- "Optimize database queries for performance" → `enhancement/optimize-database-queries-for-performance`

### Step 7: Create Branch

```bash
git checkout -b [generated-branch-name]
```

### Step 8: Update Trello Card

1. Prepend to card description:
   ```markdown
   ## Development Info
   Branch: [branch-name]
   Developer: @[username]
   Started: [current-date]
   AI Selected: Yes (Urgency Score: [score]/100)

   ---

   [existing description]
   ```

2. Add comment:
   ```
   🤖 AI automatically started this task
   Branch: [branch-name]
   Urgency Score: [score]/100
   Reason: [brief explanation of why this task was selected]
   Started: [current-date]
   ```

3. Move card from "To Do" → "In Progress" (ID: 68de5fd2323f4388c651cdef)

### Step 9: Display Summary

```
🤖 AI SELECTED TASK

✅ Automatically started most urgent task:

Card: [Card Name]
Urgency Score: [score]/100
Type: [Feature/Enhancement/Bug]
Branch: [branch-name]

Selection Reasoning:
- Due Date: [due date or "Not set"]
- Labels: [list labels]
- Priority Indicators: [what made it urgent]

Status: In Progress

📝 NEXT STEPS:
1. Implement the feature/fix
2. Commit changes regularly
3. When done, run /trello-task again to auto-create PR
```

If stash was created:
```
⚠️ Note: Previous uncommitted changes were stashed
Run 'git stash pop' to restore them if needed
```

---

## Workflow B: Complete Task & Auto-Create PR

**Trigger**: User is on a feature branch (not main)

### Step 1: Verify Readiness

1. Get current branch name
2. Check git status
3. If uncommitted changes:
   - Display files with changes
   - Display: "⚠️ You have uncommitted changes. Please commit them first, then run /trello-task again."
   - Exit (do not proceed)

### Step 2: Find Associated Trello Card (AUTOMATIC)

1. Search "In Progress" list (ID: 68de5fd2323f4388c651cdef)
2. Match by branch name in card description
3. If not found in "In Progress":
   - Search "To Do" list
   - Search "QA Review" list
4. If still not found:
   - Display: "⚠️ Cannot find Trello card for branch: [branch-name]"
   - Display: "Create PR manually or check Trello card description"
   - Exit

### Step 3: Push Branch (AUTOMATIC)

```bash
git push -u origin [current-branch]
```

If push fails (e.g., conflicts):
- Display error
- Provide resolution steps
- Exit

### Step 4: Generate PR Details (AUTOMATIC)

**PR Title** (from branch name):
- Extract type prefix (bug/feat/enhancement)
- Convert branch name to title case
- Remove hyphens
- Format: `{type}: {Title}`

Examples:
- Branch: `bug/fix-login-redirect` → PR Title: `bug: Fix login redirect`
- Branch: `feat/add-dark-mode` → PR Title: `feat: Add dark mode`
- Branch: `enhancement/optimize-queries` → PR Title: `enhancement: Optimize queries`

**PR Body** (from card details):

```markdown
## Summary
[First paragraph from Trello card description, or card name if no description]

**Trello Card**: [Link to card]
**Type**: [Feature/Enhancement/Bug based on branch prefix]
**AI Automated**: Yes

## Changes
[Extract from commit messages - list all commits in this branch]

## Implementation Details
[Extract remaining content from Trello card description]

## Testing
- [ ] Manual testing completed
- [ ] E2E tests added/updated (if applicable)
- [ ] All tests passing
- [ ] No console errors

## Checklist
- [ ] Code follows project style guide
- [ ] Documentation updated (if needed)
- [ ] No console warnings/errors
- [ ] Performance impact considered
- [ ] SOLID principles followed

---

🤖 PR created automatically by AI workflow
```

### Step 5: Create Pull Request (AUTOMATIC)

```bash
gh pr create --title "[PR title]" --body "[PR body]"
```

Get PR URL from output.

### Step 6: Update Trello Card (AUTOMATIC)

1. Update card description to add PR link:
   ```markdown
   ## Development Info
   Branch: [branch-name]
   Developer: @[username]
   Started: [start-date]
   PR: [PR-URL]
   PR Created: [current-date]
   ```

2. Add comment:
   ```
   🤖 AI automatically created pull request
   PR: [PR-URL]
   Ready for review
   Created: [current-date]

   Commits included:
   [List all commit messages]
   ```

3. Move card from "In Progress" → "QA Review" (ID: 68de606c8035e07e7dcd094c)

### Step 7: Add QA Checklist to Card (AUTOMATIC)

Add comment with QA checklist:
```markdown
## QA Review Checklist

### Code Quality
- [ ] Follows coding standards
- [ ] SOLID principles applied
- [ ] No TypeScript/ESLint errors
- [ ] Proper error handling

### Testing
- [ ] All tests passing
- [ ] Manual testing completed
- [ ] No console errors
- [ ] Performance acceptable

### Acceptance Criteria
- [ ] All criteria met
- [ ] Edge cases handled
- [ ] Documentation updated

**Auto-generated by AI workflow**
```

### Step 8: Display Summary

```
🤖 PULL REQUEST CREATED AUTOMATICALLY

✅ Task completed and ready for review!

PR: [PR-URL]
Branch: [branch-name]
Card: [Card Name]
Status: QA Review

PR Details:
- Title: [PR title]
- Commits: [number] commits
- Files changed: [number] files

Card has been moved to "QA Review" with checklist added.

📝 NEXT STEPS:
1. Code review will be conducted
2. Address any feedback if requested
3. Use /trello-review to merge when approved
4. Card will auto-move to "Done" after merge

🔗 View PR: [PR-URL]
```

---

## AI Decision Making Examples

### Example 1: Urgent Bug Selection

**Available Tasks**:
1. "Add dark mode" (no due date, "feature" label)
2. "Fix login crash" (overdue, "bug, urgent" labels)
3. "Optimize images" (due in 7 days, "enhancement" label)

**AI Analysis**:
```
Task 1 Score: 10 (label: feature)
Task 2 Score: 90 (overdue: 40, labels: 50)
Task 3 Score: 30 (due soon: 20, label: 10)

✅ SELECTED: Task 2 - "Fix login crash"
Reason: Overdue critical bug
```

### Example 2: No Clear Winner

**Available Tasks**:
1. "Update docs" (no due date, "documentation" label)
2. "Add analytics" (due in 5 days, "feature" label)
3. "Refactor service" (due in 4 days, "enhancement" label)

**AI Analysis**:
```
Task 1 Score: 5
Task 2 Score: 40 (due soon: 30, label: 10)
Task 3 Score: 45 (due soon: 30, label: 10, age: 5)

✅ SELECTED: Task 3 - "Refactor service"
Reason: Due sooner and slightly older
```

### Example 3: All Equal Priority

**Available Tasks**:
1. "Feature A" (due in 7 days)
2. "Feature B" (due in 7 days)
3. "Feature C" (due in 7 days)

**AI Analysis**:
```
All tasks have equal scores (20 points each)

✅ SELECTED: Task 1 - "Feature A"
Reason: First in list (oldest creation date)
```

---

## Error Handling

### No Tasks Available
```
✅ No pending tasks in "To Do"

All caught up! Great work! 🎉
```

### Git Conflicts on Push
```
❌ Failed to push branch

Error: [git error message]

Resolution steps:
1. Pull latest changes: git pull origin main
2. Resolve any conflicts
3. Run /trello-task again to retry PR creation
```

### PR Creation Failed
```
❌ Failed to create pull request

Error: [gh error message]

Manual steps:
1. Go to: https://github.com/[repo]/compare/[branch]
2. Create PR manually
3. Update Trello card with PR link

Branch pushed successfully: [branch-name]
```

### Trello API Failed
```
⚠️ Trello update failed but PR created successfully

PR: [PR-URL]

Manual Trello steps:
1. Open card: [Card Name]
2. Add PR link to description
3. Move card to "QA Review"
4. Add QA checklist comment
```

---

## Complete Automated Flow Example

### Scenario: Starting Fresh

```bash
# User runs command on main branch
/trello-task

🤖 AI SELECTED TASK
✅ Automatically started most urgent task:

Card: Fix login redirect bug
Urgency Score: 85/100
Type: Bug Fix
Branch: bug/fix-login-redirect-bug

Selection Reasoning:
- Due Date: 2025-10-07 (2 days overdue)
- Labels: bug, urgent, production
- Priority Indicators: Overdue, critical label, production impact

Status: In Progress

📝 NEXT STEPS:
1. Implement the bug fix
2. Commit changes regularly
3. When done, run /trello-task again to auto-create PR
```

### Scenario: Completing Work

```bash
# User completes work, commits, then runs command on feature branch
/trello-task

🤖 PULL REQUEST CREATED AUTOMATICALLY

✅ Task completed and ready for review!

PR: https://github.com/gtplusnet/ante-official/pull/15
Branch: bug/fix-login-redirect-bug
Card: Fix login redirect bug
Status: QA Review

PR Details:
- Title: bug: Fix login redirect bug
- Commits: 3 commits
- Files changed: 5 files

Card has been moved to "QA Review" with checklist added.

📝 NEXT STEPS:
1. Code review will be conducted
2. Address any feedback if requested
3. Use /trello-review to merge when approved
4. Card will auto-move to "Done" after merge

🔗 View PR: https://github.com/gtplusnet/ante-official/pull/15
```

---

## Notes

- **Zero user prompts**: AI makes all decisions automatically
- **Smart selection**: AI analyzes urgency, deadlines, labels, and content
- **Context-aware**: Different actions based on current branch
- **Fail-safe**: Clear error messages with manual fallback steps
- **Transparent**: Shows reasoning for AI decisions

## Integration

Use with `/trello-review` for complete automated workflow:
```bash
/trello-task   # Auto-selects and starts task
[Do the work]
/trello-task   # Auto-creates PR
/trello-review # Reviews and merges
```

**Total commands needed**: 2 (`/trello-task` twice, once before and once after work)
