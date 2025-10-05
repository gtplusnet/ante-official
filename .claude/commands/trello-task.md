---
description: Complete Trello task workflow (list, start, create PR)
tags: [trello, workflow, git, pr]
---

# Trello Task Workflow

Comprehensive workflow for managing Trello tasks from start to finish.

## Usage

When invoked, this command will:
1. Show available actions (List, Start, Complete)
2. Guide you through the selected workflow
3. Handle all Trello and Git operations

## Trello Board Configuration

### Board Lists (IDs)
- **To Do**: 68de5fcf7534f0085373f7f0
- **In Progress**: 68de5fd2323f4388c651cdef
- **QA Review**: 68de606c8035e07e7dcd094c
- **Done**: 68de5fd51be89a62a492b228

## Instructions

### Main Menu

Ask user what they want to do:
```
What would you like to do?

1. 📋 List tasks in "To Do"
2. 🚀 Start working on a task
3. 📝 Complete task and create PR
4. ❌ Cancel

Choose an option (1-4):
```

Based on selection, proceed to the appropriate workflow below.

---

## Workflow 1: List Tasks (📋)

Display all tasks currently in the "To Do" list.

### Steps

1. Fetch all cards from "To Do" list (ID: 68de5fcf7534f0085373f7f0)
2. If empty, inform user there are no pending tasks
3. Sort by:
   - Due date (urgent first)
   - Labels/priority (if available)
   - Creation date (newest first)
4. Display in formatted table with:
   - Card name
   - Card ID (for reference)
   - Labels (if any)
   - Due date (if set)
   - Link to card

### Output Format

```
📋 Tasks in "To Do" (3 tasks)

1. [URGENT] Fix login redirect bug
   ID: abc123
   Labels: bug, high-priority
   Due: 2025-10-06
   Link: https://trello.com/c/abc123

2. Add dark mode toggle
   ID: def456
   Labels: feature
   Due: Not set
   Link: https://trello.com/c/def456

3. Optimize database queries
   ID: ghi789
   Labels: enhancement, performance
   Due: 2025-10-10
   Link: https://trello.com/c/ghi789
```

Provide summary with task count and any urgent/overdue items.

After listing, ask: "Would you like to start working on one of these tasks? (y/n)"
- If yes, proceed to Workflow 2
- If no, return to main menu

---

## Workflow 2: Start Task (🚀)

Interactive workflow to start working on a task from "To Do" list.

### Step 1: Check Prerequisites

1. Verify current git status
2. Check if on main branch
3. If not on main, ask user if they want to switch
4. If uncommitted changes exist:
   - Show files
   - Ask if user wants to stash or commit them
   - Handle accordingly

### Step 2: Sync with Main

1. Ensure main branch is up to date:
   ```bash
   git checkout main
   git pull origin main
   ```

### Step 3: Select Task

1. Fetch all cards from "To Do" list (ID: 68de5fcf7534f0085373f7f0)
2. Display available tasks (if multiple)
3. Ask user to select which task to work on (by number or card ID)

### Step 4: Determine Task Type

1. Analyze the card to determine type:
   - **Feature**: New functionality (use `feat/` prefix)
   - **Enhancement**: Improvement to existing feature (use `enhancement/` prefix)
   - **Bug**: Bug fix (use `bug/` prefix)
2. Look at:
   - Card labels
   - Card title keywords (feat, fix, enhance, etc.)
   - Card description
3. If unclear, ask user to specify type

### Step 5: Create Branch

1. Generate branch name from card title:
   - Convert to lowercase
   - Replace spaces with hyphens
   - Remove special characters
   - Add appropriate prefix (feat/enhancement/bug)
   - Example: "Add dark mode toggle" → "feat/add-dark-mode-toggle"
2. Show proposed branch name to user for confirmation
3. Allow user to edit if needed
4. Create the branch:
   ```bash
   git checkout -b [branch-name]
   ```

### Step 6: Update Trello Card

1. Update card description by prepending:
   ```markdown
   ## Development Info
   Branch: [branch-name]
   Developer: @[username]
   Started: [current-date]

   ---

   [existing description content]
   ```
2. Add a comment to the card:
   ```
   🚀 Development started
   Branch: [branch-name]
   Started: [current-date]
   ```
3. Move card from "To Do" → "In Progress" (ID: 68de5fd2323f4388c651cdef)

### Step 7: Display Summary

```
✅ Task started successfully!

Card: [Card Name]
Branch: [branch-name]
Status: In Progress

Next steps:
1. Implement the feature/fix
2. Commit changes regularly
3. Run tests before completing
4. Use /trello-task (option 3) when ready to create pull request
```

### Error Handling

- If git has uncommitted changes, warn user and ask if they want to stash
- If branch already exists:
  - Inform user
  - Ask if they want to switch to existing branch or create new one with different name
  - Handle accordingly
- If Trello API fails, show error and manual steps to complete

---

## Workflow 3: Complete Task & Create PR (📝)

Automated workflow to complete a task and create a pull request.

### Step 1: Verify Current State

1. Get current branch name
2. Verify it's not main branch (if main, warn and exit)
3. Check git status for uncommitted changes
4. If uncommitted changes exist:
   - Show files with changes
   - Ask if user wants to commit them now
   - If yes, ask for commit message and commit

### Step 2: Find Associated Trello Card

1. Look for card in "In Progress" list (ID: 68de5fd2323f4388c651cdef)
2. Match by branch name in card description
3. If multiple matches or no match:
   - Show available cards in "In Progress"
   - Ask user to select the correct card
   - Manual fallback: ask for card ID

### Step 3: Pre-PR Checks

Ask user to confirm:
```
Before creating PR, please confirm:
- [ ] All acceptance criteria met?
- [ ] Tests passing locally?
- [ ] Build successful?
- [ ] Code reviewed (self-review completed)?
- [ ] Documentation updated (if needed)?

Ready to proceed? (y/n)
```

If any "No" or user declines, suggest completing those items first and exit.

### Step 4: Push Branch

1. Push current branch to origin:
   ```bash
   git push -u origin [current-branch]
   ```
2. Handle errors (e.g., remote already exists, conflicts)

### Step 5: Generate PR Details

1. Get card details (title, description, labels)
2. Generate PR title from branch name and card:
   - Format: `type: Brief description`
   - Examples:
     - `feat: Add dark mode toggle`
     - `enhancement: Optimize database queries`
     - `bug: Fix login redirect issue`
3. Generate PR body template:
   ```markdown
   ## Summary
   [Brief description from Trello card]

   **Trello Card**: [Link to card]
   **Type**: [Feature/Enhancement/Bug]

   ## Changes
   - [List main changes - extracted from commits or ask user]

   ## Testing
   - [ ] Manual testing completed
   - [ ] E2E tests added/updated
   - [ ] All tests passing

   ## Screenshots/Demos
   [If applicable - ask user]

   ## Checklist
   - [ ] Code follows project style guide
   - [ ] Documentation updated
   - [ ] No console warnings/errors
   - [ ] Performance impact considered
   ```
4. Show generated PR title and body to user for review/editing

### Step 6: Create Pull Request

1. Create PR using GitHub CLI:
   ```bash
   gh pr create --title "[PR title]" --body "[PR body]"
   ```
2. Get PR URL from output
3. Display PR URL to user

### Step 7: Update Trello Card

1. Update card description to add PR link:
   ```markdown
   ## Development Info
   Branch: [branch-name]
   Developer: @[username]
   Started: [start-date]
   PR: [PR-URL]
   ```
2. Add comment to card:
   ```
   📝 Pull request created
   PR: [PR-URL]
   Ready for review
   Created: [current-date]
   ```
3. Move card from "In Progress" → "QA Review" (ID: 68de606c8035e07e7dcd094c)

### Step 8: Add QA Checklist to Card

Add a comment with QA checklist:
```markdown
## QA Review Checklist
- [ ] Code review passed
- [ ] All tests passing
- [ ] Manual testing completed
- [ ] No console errors
- [ ] Responsive design verified (if UI changes)
- [ ] Performance acceptable
- [ ] Documentation updated
- [ ] Meets acceptance criteria
```

### Step 9: Display Summary

```
✅ Pull request created successfully!

PR: [PR-URL]
Branch: [branch-name]
Card Status: QA Review

Next steps:
1. Wait for code review
2. Address any feedback
3. Once approved, use /trello-review to merge
4. Card will automatically move to "Done" after merge

To review and merge:
/trello-review
```

### Error Handling

- If branch not pushed, show error and provide manual steps
- If gh CLI not available, provide web URL to create PR manually
- If Trello update fails, show manual steps to update card
- If card not found in "In Progress", search other lists and inform user
- Handle PR creation failures gracefully

---

## Complete Workflow Example

### Typical Flow

```bash
# 1. Invoke command
/trello-task

# 2. List available tasks
Choose option 1 → See all tasks in "To Do"

# 3. Start working on a task
Choose option 2 → Select task → Branch created → Card moved to "In Progress"

# 4. Do development work...
[User implements feature, commits regularly, tests locally]

# 5. Complete task
/trello-task → Choose option 3 → PR created → Card moved to "QA Review"

# 6. Review and merge
/trello-review → PR merged → Card moved to "Done"
```

---

## Notes

- **Trello API**: Commands use MCP server configured in CLAUDE.local.md
- **GitHub CLI**: Requires `gh` CLI to be installed and authenticated
- **Branch Strategy**: Uses feat/enhancement/bug prefixes
- **PR Strategy**: Always use squash and merge (never delete source branch)
- **Card Movement**: Follows To Do → In Progress → QA Review → Done

## Tips

- Use `/trello-task` option 1 regularly to see what's pending
- Start tasks from "To Do" only (maintains clean workflow)
- Commit frequently during development
- Run tests before creating PR
- Update documentation as you code (not after)
- Use meaningful commit messages

## Related Commands

- `/trello-review` - Review PRs in QA Review and merge when approved
- See `.claude/commands/README.md` for complete workflow
