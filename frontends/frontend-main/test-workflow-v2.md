# Test Workflow V2 - Source Branch to Production

This file tests the updated auto-PR to production workflow.

## What's New
- Workflow now creates PRs from source branch directly to production
- Prevents unintended changes from main being included
- Each production PR contains only the specific branch changes

## Test Details
- Created at: 2025-01-16
- Branch: test-branch-to-prod-1755327558
- Expected: When merged to main, creates PR from this branch to production

## Verification Steps
1. This PR gets merged to main
2. Workflow triggers and creates PR from `test-branch-to-prod-1755327558` to `production`
3. The production PR should NOT be from `main` to `production`