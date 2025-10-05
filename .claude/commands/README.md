# Claude Code Slash Commands

This directory contains custom slash commands for the ANTE ERP project.

## Available Commands

### Trello Workflow Commands

#### `/trello-task`
**Description**: Fully automated Trello task workflow (AI-driven, zero user prompts)
**Usage**: `/trello-task`

**AI-Powered Automation**:
- **On main branch**: AI automatically selects most urgent task and starts work
- **On feature branch**: AI automatically creates PR and moves card to QA Review

**What it does**:
- **Smart Task Selection**: AI scores tasks by urgency (due date, labels, age, keywords)
- **Auto Branch Creation**: Creates properly named branch (feat/enhancement/bug)
- **Auto PR Creation**: Generates PR with proper title and body from commits
- **Trello Sync**: Updates cards with branch info, PR links, and QA checklists

**Zero User Interaction**:
- No menus or prompts
- AI decides everything based on context
- Transparent decision-making (shows reasoning)

#### `/trello-review`
**Description**: Review PR in QA Review and move to Done when merged
**Usage**: `/trello-review`
**What it does**:
- Lists all cards in "QA Review" lane
- Reviews PR code against coding guidelines
- Checks SOLID principles adherence
- Runs tests (Playwright for frontend, unit tests for backend)
- Verifies all acceptance criteria met
- Approves/requests changes/rejects PR
- Moves card to "Done" after PR is merged
- Provides comprehensive review summary

## Command Workflow

**Fully automated workflow** - AI handles all decisions:

```bash
# 1. Start task (AI auto-selects most urgent)
/trello-task

🤖 AI SELECTED TASK
✅ Automatically started most urgent task:

Card: Fix login redirect bug
Urgency Score: 85/100
Type: Bug Fix
Branch: bug/fix-login-redirect-bug

Selection Reasoning:
- Due Date: 2025-10-07 (overdue)
- Labels: bug, urgent, production
- Priority: Critical production issue

# 2. Do your development work...
# (commit regularly, run tests, etc.)

# 3. Complete task (AI auto-creates PR)
/trello-task

🤖 PULL REQUEST CREATED AUTOMATICALLY
✅ Task completed and ready for review!

PR: https://github.com/.../pull/15
Branch: bug/fix-login-redirect-bug
Status: QA Review

# 4. Review and merge (AI handles review)
/trello-review
# - AI reviews code against guidelines
# - Runs all tests
# - Verifies acceptance criteria
# - Merges PR and moves to "Done"
```

**Total commands needed**: 3
1. `/trello-task` - AI starts most urgent task
2. `/trello-task` - AI creates PR when done
3. `/trello-review` - AI reviews and merges

**Key Features**:
- ✅ Zero user prompts or menus
- ✅ AI makes all decisions transparently
- ✅ Shows reasoning for selections
- ✅ Context-aware (branch determines action)

## Creating New Commands

To create a new slash command:

1. Create a new `.md` file in this directory
2. Add frontmatter with description and tags:
   ```markdown
   ---
   description: Brief description of what the command does
   tags: [tag1, tag2, tag3]
   ---
   ```
3. Write detailed instructions for Claude to follow
4. Document the command in this README

## Notes

- Commands are project-specific and checked into git
- Trello commands require MCP server configuration (see CLAUDE.local.md)
- Commands use natural language instructions, not code
- Claude interprets and executes the instructions when command is invoked

## Documentation

- **Main Project Instructions**: `/CLAUDE.md`
- **Local/Sensitive Config**: `/CLAUDE.local.md` (not in git)
- **Trello Workflow**: See "Trello Development Workflow" section in `CLAUDE.local.md`

## Support

If you have issues with commands:
1. Check that MCP server is configured correctly: `claude mcp list`
2. Verify Trello credentials in `CLAUDE.local.md`
3. Ensure you have GitHub CLI installed: `gh --version`
4. Review command documentation in the respective `.md` files

---
**Last Updated**: 2025-10-05
**Project**: GEER-ANTE ERP
