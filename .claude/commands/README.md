# Claude Code Slash Commands

This directory contains custom slash commands for the ANTE ERP project.

## Available Commands

### Trello Workflow Commands

#### `/trello-task`
**Description**: Complete Trello task workflow (list, start, create PR)
**Usage**: `/trello-task`
**Interactive Menu**:
1. 📋 List tasks in "To Do"
2. 🚀 Start working on a task
3. 📝 Complete task and create PR

**What it does**:
- **List**: Shows all tasks in "To Do" with priorities and due dates
- **Start**: Syncs main, creates feature branch, moves card to "In Progress"
- **Complete**: Pushes branch, creates PR, moves card to "QA Review"

**Features**:
- Interactive workflow with menu selection
- Automatic branch naming (feat/enhancement/bug)
- Trello card updates with development info
- PR template generation from card details
- QA checklist added to card

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

Typical workflow for a task:

```bash
# 1. Start the task workflow
/trello-task
# → Choose option 1 to list available tasks
# → Choose option 2 to start working on a task
# → Branch created, card moved to "In Progress"

# 2. Do your development work...
# (commit regularly, run tests, etc.)

# 3. Complete the task
/trello-task
# → Choose option 3 to create PR
# → PR created, card moved to "QA Review"

# 4. Review and merge
/trello-review
# - Reviews code against guidelines (SOLID principles, etc.)
# - Runs tests (Playwright/unit tests)
# - Verifies acceptance criteria
# - Merges PR (source branch preserved)
# - Moves card to "Done" automatically
```

**Alternative Workflow** (individual steps):
```bash
# List only
/trello-task → option 1

# Start only
/trello-task → option 2

# Complete only
/trello-task → option 3

# Review
/trello-review
```

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
