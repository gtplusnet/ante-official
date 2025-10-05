# Trello Task Creation Template

**Quick guide for creating well-structured development tasks.**

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

- [ ] **Title** - Clear with [TYPE] prefix
- [ ] **User Story** - As a/I want/So that format filled
- [ ] **Acceptance Criteria** - At least 3 specific criteria
- [ ] **Technical Requirements** - Frontend/Backend sections completed
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

## Common Mistakes to Avoid

1. ❌ Vague titles like "Fix bug" or "Update feature"
2. ❌ Missing acceptance criteria
3. ❌ No Definition of Done checklist
4. ❌ Tasks too large (should be 1-3 days max)
5. ❌ Forgetting to add labels or assignee

---

## Tips

- **Keep it small** - If task takes >3 days, break it down
- **Be specific** - What exactly should work when done?
- **Think errors** - Add acceptance criteria for error cases
- **Link related work** - Reference other cards, PRs, docs
- **Update progress** - Use comments to track status

---

**Questions?** See full guide at `/documentation/` or ask the team.

**Last Updated:** 2025-10-05
