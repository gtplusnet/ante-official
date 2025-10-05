---
description: List all tasks in Trello "To Do" list
tags: [trello, tasks, workflow]
---

# Trello To Do List

Display all tasks currently in the "To Do" list on the Trello board.

## Instructions

1. Fetch all cards from the "To Do" list (ID: 68de5fcf7534f0085373f7f0)
2. Display them in a formatted table with:
   - Card name
   - Card ID (for reference)
   - Labels (if any)
   - Due date (if set)
   - Link to card

3. If the list is empty, inform the user that there are no pending tasks

4. Sort by:
   - Due date (urgent first)
   - Labels/priority (if available)
   - Creation date (newest first)

## Output Format

Present the results in a clean, readable format like:

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

...
```

Provide a summary at the end with task count and any urgent/overdue items.
