# Trello Workflow Quick Reference

## 🚀 Quick Commands

```bash
/trello-todo     # List all pending tasks
/trello-start    # Start a task (interactive)
/trello-pr       # Create PR and move to QA
```

## 📋 Workflow at a Glance

```
┌─────────────┐
│   To Do     │ ← SOURCE OF TRUTH
└──────┬──────┘
       │ /trello-start
       ↓
┌─────────────┐
│ In Progress │ ← ACTIVE WORK
└──────┬──────┘
       │ /trello-pr
       ↓
┌─────────────┐
│  QA Review  │ ← CODE REVIEW
└──────┬──────┘
       │ Merge PR
       ↓
┌─────────────┐
│    Done     │ ← COMPLETED
└─────────────┘
```

## 🌿 Branch Naming

| Type | Prefix | Example |
|------|--------|---------|
| New Feature | `feat/` | `feat/dark-mode` |
| Enhancement | `enhancement/` | `enhancement/optimize-queries` |
| Bug Fix | `bug/` | `bug/fix-login` |

## 📝 Checklist

### Starting a Task
- [ ] On main branch?
- [ ] Main is up to date? (`git pull origin main`)
- [ ] Task in "To Do" list?
- [ ] Branch created with correct prefix?
- [ ] Card description updated with branch name?
- [ ] Card moved to "In Progress"?

### During Development
- [ ] Committing regularly?
- [ ] Referencing Trello card in commits?
- [ ] Updating card with progress/blockers?
- [ ] Tests passing locally?

### Creating PR
- [ ] All acceptance criteria met?
- [ ] Tests passing?
- [ ] Build successful?
- [ ] Branch pushed to origin?
- [ ] PR created with proper template?
- [ ] PR link added to Trello card?
- [ ] Card moved to "QA Review"?
- [ ] QA checklist added to card?

### After Merge
- [ ] PR merged?
- [ ] Feature branch deleted?
- [ ] Card moved to "Done"?
- [ ] Completion comment added?

## 🔗 Trello Board

**URL**: https://trello.com/b/I28LMp46/ante-ai-board

**List IDs** (for automation):
```
Drafts:      68de5fd99320fa7deaec281c
To Do:       68de5fcf7534f0085373f7f0  ⭐
In Progress: 68de5fd2323f4388c651cdef
QA Review:   68de606c8035e07e7dcd094c
Done:        68de5fd51be89a62a492b228
```

## 💡 Common Git Commands

```bash
# Start new task
git checkout main
git pull origin main
git checkout -b feat/my-feature

# Save work in progress
git add .
git commit -m "feat: implement feature [Trello: CARD_ID]"

# Push and create PR
git push -u origin feat/my-feature
gh pr create --title "feat: My Feature" --body "..."

# After PR merged
git checkout main
git pull origin main
git branch -d feat/my-feature
```

## 🆘 Troubleshooting

**Q: How do I know which task to work on?**
A: Check "To Do" list only. Use `/trello-todo` to see all pending tasks.

**Q: Branch already exists?**
A: Either switch to it (`git checkout existing-branch`) or create with different name.

**Q: Forgot to update Trello card?**
A: Update it now with current status. Better late than never.

**Q: Card in wrong list?**
A: Move it to correct list immediately, add comment explaining.

**Q: Can't create PR with gh CLI?**
A: Go to GitHub web UI and create manually, then update Trello card.

## 📚 Full Documentation

- **Workflow Details**: `CLAUDE.local.md` → "Trello Development Workflow"
- **Command Details**: `.claude/commands/README.md`
- **Project Instructions**: `CLAUDE.md`

---
**Last Updated**: 2025-10-05
**Version**: 1.0
