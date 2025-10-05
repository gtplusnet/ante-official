---
description: Complete Trello task and create pull request
tags: [trello, workflow, git, pr]
---

# Complete Trello Task & Create PR

Automated workflow to complete a task and create a pull request.

## Instructions

### Step 1: Verify Current State
1. Get current branch name
2. Verify it's not main branch
3. Check git status for uncommitted changes
4. If uncommitted changes exist:
   - Show files
   - Ask if user wants to commit them now
   - If yes, ask for commit message

### Step 2: Find Associated Trello Card
1. Look for card in "In Progress" list (ID: 68de5fd2323f4388c651cdef)
2. Match by branch name in card description
3. If multiple matches or no match:
   - Show available cards
   - Ask user to select the correct card

### Step 3: Pre-PR Checks
Ask user to confirm:
- [ ] All acceptance criteria met?
- [ ] Tests passing locally?
- [ ] Build successful?
- [ ] Code reviewed (if applicable)?

If any "No", suggest completing those items first.

### Step 4: Push Branch
1. Push current branch to origin:
   ```bash
   git push -u origin [current-branch]
   ```

### Step 5: Create Pull Request
1. Get card details (title, description, labels)
2. Generate PR title from branch name:
   - Format: `type: Brief description`
   - Example: `feat: Add dark mode toggle`
3. Generate PR body template:
   ```markdown
   ## Summary
   [Brief description from Trello card]

   **Trello Card**: [Link to card]
   **Type**: [Feature/Enhancement/Bug]

   ## Changes
   - [List main changes]

   ## Testing
   - [ ] Manual testing completed
   - [ ] E2E tests added/updated
   - [ ] All tests passing

   ## Screenshots/Demos
   [If applicable]

   ## Checklist
   - [ ] Code follows project style guide
   - [ ] Documentation updated
   - [ ] No console warnings/errors
   - [ ] Performance impact considered
   ```
4. Create PR using GitHub CLI:
   ```bash
   gh pr create --title "[PR title]" --body "[PR body]"
   ```

### Step 6: Update Trello Card
1. Get PR URL from GitHub
2. Update card description to add PR link:
   ```markdown
   ## Development Info
   Branch: [branch-name]
   Developer: @[username]
   Started: [start-date]
   PR: [PR-URL] ⬅️ ADD THIS
   ```
3. Add comment to card:
   ```
   📝 Pull request created
   PR: [PR-URL]
   Ready for review
   ```
4. Move card from "In Progress" → "QA Review" (ID: 68de606c8035e07e7dcd094c)

### Step 7: Add QA Checklist to Card
Add a comment with QA checklist:
```markdown
## QA Review Checklist
- [ ] Code review passed
- [ ] All tests passing
- [ ] Manual testing completed
- [ ] No console errors
- [ ] Responsive design verified
- [ ] Performance acceptable
- [ ] Documentation updated
- [ ] Meets acceptance criteria
```

### Step 8: Display Summary
Show the user:
```
✅ Pull request created successfully!

PR: [PR-URL]
Branch: [branch-name]
Card Status: QA Review

Next steps:
1. Wait for code review
2. Address any feedback
3. Once approved, merge PR
4. Move Trello card to "Done"
5. Delete feature branch

To merge when approved:
gh pr merge --squash
git checkout main
git pull origin main
git branch -d [branch-name]
```

## Error Handling

- If branch not pushed, inform user and provide manual steps
- If gh CLI not available, provide web URL to create PR manually
- If Trello update fails, show manual steps to update card
- If card not found in "In Progress", search other lists and inform user
