# Claude Code Slash Commands

This directory contains custom slash commands for the ANTE ERP project.

## Available Commands

### Trello Workflow Commands

#### `/trello-todo`
**Description**: List all tasks in Trello "To Do" list
**Usage**: `/trello-todo`
**Output**: Formatted table of pending tasks with priorities and due dates

#### `/trello-start`
**Description**: Start working on a Trello task (interactive workflow)
**Usage**: `/trello-start`
**What it does**:
- Ensures you're on latest main branch
- Shows available tasks from "To Do" list
- Creates feature branch with proper naming
- Updates Trello card with branch info
- Moves card to "In Progress"

#### `/trello-pr`
**Description**: Complete task and create pull request
**Usage**: `/trello-pr`
**What it does**:
- Verifies all changes are committed
- Pushes branch to origin
- Creates PR with proper template
- Updates Trello card with PR link
- Moves card to "QA Review"
- Adds QA checklist to card

## Command Workflow

Typical workflow for a task:

```bash
# 1. See what tasks are available
/trello-todo

# 2. Start working on a task
/trello-start

# 3. Do your development work...
# (commit regularly, run tests, etc.)

# 4. Create PR when done
/trello-pr

# 5. After PR approved and merged, move card to "Done" manually
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
