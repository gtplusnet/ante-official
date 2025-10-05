---
description: Start working on a Trello task (creates branch, updates card)
tags: [trello, workflow, git]
---

# Start Trello Task

Interactive workflow to start working on a task from the Trello "To Do" list.

## Instructions

### Step 1: Check Prerequisites
1. Verify current git status
2. Check if on main branch
3. If not on main, ask user if they want to switch

### Step 2: Sync with Main
1. Ensure main branch is up to date:
   ```bash
   git checkout main
   git pull origin main
   ```

### Step 3: Select Task
1. Fetch all cards from "To Do" list (ID: 68de5fcf7534f0085373f7f0)
2. Display available tasks (if multiple)
3. Ask user to select which task to work on (or provide card ID/name)

### Step 4: Determine Task Type
1. Analyze the card to determine type:
   - **Feature**: New functionality (use `feat/` prefix)
   - **Enhancement**: Improvement to existing feature (use `enhancement/` prefix)
   - **Bug**: Bug fix (use `bug/` prefix)
2. If unclear from labels/title, ask user

### Step 5: Create Branch
1. Generate branch name from card title:
   - Convert to lowercase
   - Replace spaces with hyphens
   - Remove special characters
   - Add appropriate prefix (feat/enhancement/bug)
2. Show proposed branch name to user for confirmation
3. Create the branch:
   ```bash
   git checkout -b [branch-name]
   ```

### Step 6: Update Trello Card
1. Update card description with:
   ```markdown
   ## Development Info
   Branch: [branch-name]
   Developer: @[username]
   Started: [current-date]

   [existing description content]
   ```
2. Add a comment to the card:
   ```
   🚀 Development started
   Branch: [branch-name]
   ```
3. Move card from "To Do" → "In Progress" (ID: 68de5fd2323f4388c651cdef)

### Step 7: Display Summary
Show the user:
```
✅ Task started successfully!

Card: [Card Name]
Branch: [branch-name]
Status: In Progress

Next steps:
1. Implement the feature/fix
2. Commit changes regularly
3. Run tests before completing
4. Use /trello-pr when ready to create pull request
```

## Error Handling

- If git has uncommitted changes, warn user and ask if they want to stash
- If branch already exists, inform user and ask if they want to:
  - Switch to existing branch
  - Create new branch with different name
  - Abort
- If Trello API fails, show error and manual steps to complete
