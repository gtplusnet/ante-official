# Submodule Deployment Setup

This guide explains how to set up automatic deployments when pushing to frontend or backend repositories.

## Architecture Overview

```
ante-frontend (push) → Triggers → ante (main) → Deploys to → Staging Server
ante-backend (push)  → Triggers → ante (main) → Deploys to → Staging Server
```

The main repository (`ante`) handles all deployments. The submodule repositories just trigger the deployment.

## Setup Instructions

### Step 1: Create a Personal Access Token (PAT)

1. Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Name: `Ante Deployment Trigger`
4. Scopes needed:
   - ✓ `repo` (full control)
   - ✓ `workflow` (update workflows)
5. Click "Generate token"
6. **Copy the token immediately** (you won't see it again!)

### Step 2: Add Token to Submodule Repositories

For **both** frontend and backend repositories:

1. Go to the repository (ante-frontend or ante-backend)
2. Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Name: `MAIN_REPO_TOKEN`
5. Value: Paste the PAT you created
6. Click "Add secret"

### Step 3: Add Workflow to Submodule Repositories

#### For Frontend Repository (ante-frontend):

1. Create `.github/workflows/trigger-deployment.yml`
2. Copy contents from `.github/submodule-workflows/frontend-trigger.yml`
3. Commit and push

#### For Backend Repository (ante-backend):

1. Create `.github/workflows/trigger-deployment.yml`
2. Copy contents from `.github/submodule-workflows/backend-trigger.yml`
3. Commit and push

## How It Works

1. **Developer pushes to frontend/backend** → 
2. **Submodule workflow triggers** → 
3. **Sends repository_dispatch event to main repo** → 
4. **Main repo workflow runs** → 
5. **Deploys only the changed service to staging**

## Testing

After setup, test by pushing a small change:

```bash
# In frontend repo
echo "# Test deployment" >> README.md
git add README.md
git commit -m "Test deployment trigger"
git push

# Check GitHub Actions in the main ante repository
# You should see "Auto Deploy on Push" workflow running
```

## Alternative: Webhook Approach (No PAT needed)

If you prefer not to use Personal Access Tokens, you can use GitHub Webhooks:

1. In the main `ante` repository:
   - Settings → Webhooks → Add webhook
   - Payload URL: Use a webhook relay service or your own endpoint
   - Events: Choose "Pushes"
   
2. Configure the webhook to trigger GitHub Actions using the API

This approach is more complex but doesn't require PATs.

## Monitoring Deployments

Check deployment status:
- Main repository: Actions tab → "Auto Deploy on Push" workflow
- Submodule repositories: Actions tab → "Trigger Main Deployment" workflow

## Troubleshooting

### "Bad credentials" error
- Regenerate the PAT and update `MAIN_REPO_TOKEN` secret

### Workflow not triggering
- Ensure the PAT has `repo` and `workflow` scopes
- Check that the workflow file is in `.github/workflows/`
- Verify you're pushing to the `main` branch

### Deployment not happening
- Check the main repository's Actions tab
- Look for "Auto Deploy on Push" workflow runs
- Review logs for any errors

## Security Notes

- **PATs are powerful** - Treat them like passwords
- **Rotate tokens regularly** - Every 3-6 months
- **Use minimum scopes** - Only `repo` and `workflow` needed
- **Consider using GitHub Apps** - For production, GitHub Apps are more secure than PATs