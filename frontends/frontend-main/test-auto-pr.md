# Test Auto-PR to Production

This file is created to test the automatic PR creation to production branch when a PR is merged to main.

## Test Details
- Created at: 2025-01-16
- Purpose: Verify GitHub Actions can create PRs after permissions update
- Expected: When this PR is merged to main, it should automatically create a PR to production branch

## Workflow Being Tested
- File: `.github/workflows/frontend-pr.yml`
- Job: `create-production-pr`
- Trigger: PR merged to main branch