# GitHub Deployment Keys Setup Guide

This guide explains how to set up GitHub deployment keys for automatic staging deployments of the Ante ERP system.

## What are Deployment Keys?

Deployment keys are SSH keys that provide read-only (or write) access to a single GitHub repository. They're more secure than using personal SSH keys because:
- They're scoped to a single repository
- They can be easily revoked without affecting other access
- They don't require a service account

## Quick Setup

Run the automated setup script:

```bash
./scripts/setup-deployment-keys.sh
```

This script will:
1. Generate deployment key pairs
2. Display instructions for adding keys to GitHub and staging server
3. Test the connection
4. Configure GitHub Actions

## Manual Setup Steps

### Step 1: Generate Deployment Keys

```bash
# Generate ED25519 key pair (recommended)
ssh-keygen -t ed25519 -f .github/deployment-keys/ante-staging-deploy -C "ante-staging-deployment" -N ""
```

### Step 2: Add Deploy Key to GitHub Repository

1. Go to your GitHub repository: `https://github.com/[your-org]/ante`
2. Navigate to: **Settings** → **Deploy keys** → **Add deploy key**
3. Title: `Staging Server Deployment`
4. Key: Copy contents of `.github/deployment-keys/ante-staging-deploy.pub`
5. ✓ Check **Allow write access** (for status updates)
6. Click **Add key**

### Step 3: Add Public Key to Staging Server

Add the public key to the staging server's authorized keys:

```bash
# Option 1: Automatic
cat .github/deployment-keys/ante-staging-deploy.pub | \
  ssh jdev@157.230.246.107 'mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys'

# Option 2: Manual
# SSH into staging server and add the public key to ~/.ssh/authorized_keys
```

### Step 4: Configure GitHub Secrets

Add these secrets to your repository:

1. Go to: **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Add the following secrets:

| Secret Name | Value |
|-------------|-------|
| `STAGING_DEPLOY_KEY` | Contents of `.github/deployment-keys/ante-staging-deploy` (private key) |
| `STAGING_HOST` | `157.230.246.107` |
| `STAGING_USER` | `jdev` |

### Step 5: Test the Connection

Test that the deployment key works:

```bash
# Test connection using the deployment key
ssh -i .github/deployment-keys/ante-staging-deploy jdev@157.230.246.107 "echo 'Connection successful'"
```

## Security Best Practices

1. **Never commit private keys** - The `.github/deployment-keys/` directory is in `.gitignore`
2. **Use separate keys for each environment** - Don't reuse keys between staging/production
3. **Rotate keys periodically** - Replace deployment keys every 6-12 months
4. **Limit key permissions** - Only grant write access if needed for status updates
5. **Monitor key usage** - Check GitHub's security log for key usage

## Workflow Configuration

The GitHub Actions workflows are configured to use deployment keys automatically:

```yaml
- name: Setup SSH with Deployment Key
  run: |
    mkdir -p ~/.ssh
    echo "${{ secrets.STAGING_DEPLOY_KEY }}" > ~/.ssh/staging_key
    chmod 600 ~/.ssh/staging_key
    
    # Configure SSH to use deployment key
    echo "Host staging" >> ~/.ssh/config
    echo "  HostName ${{ secrets.STAGING_HOST }}" >> ~/.ssh/config
    echo "  User ${{ secrets.STAGING_USER }}" >> ~/.ssh/config
    echo "  IdentityFile ~/.ssh/staging_key" >> ~/.ssh/config
    chmod 600 ~/.ssh/config
```

## Triggering Deployments

### Manual Deployment

```bash
# Deploy frontend only
gh workflow run deploy-frontend-staging.yml

# Deploy backend only
gh workflow run deploy-backend-staging.yml

# Deploy both
gh workflow run deploy-staging-combined.yml
```

### Automatic Deployment

Deployments can be triggered automatically when:
1. Changes are pushed to main branch
2. Submodules send repository dispatch events
3. Webhooks are configured from frontend/backend repos

## Troubleshooting

### Permission Denied

If you get "Permission denied (publickey)" errors:

1. Verify the public key is in staging server's `~/.ssh/authorized_keys`
2. Check SSH key permissions: `chmod 600 ~/.ssh/authorized_keys`
3. Ensure the deployment key is added to GitHub repository

### GitHub Actions Failing

1. Check that `STAGING_DEPLOY_KEY` secret is set correctly
2. Verify the private key format (should include BEGIN/END lines)
3. Check workflow logs for specific SSH errors

### Connection Timeout

1. Verify staging server IP is correct: `157.230.246.107`
2. Check if server firewall allows SSH (port 22)
3. Ensure server is running and accessible

## Key Rotation

To rotate deployment keys:

1. Generate new key pair:
   ```bash
   ssh-keygen -t ed25519 -f .github/deployment-keys/ante-staging-deploy-new -C "ante-staging-deployment" -N ""
   ```

2. Add new public key to:
   - GitHub repository deploy keys
   - Staging server authorized_keys

3. Update GitHub secret `STAGING_DEPLOY_KEY` with new private key

4. Test deployment with new key

5. Remove old keys from:
   - GitHub repository deploy keys
   - Staging server authorized_keys

## Support

For issues or questions:
- Check workflow run logs in GitHub Actions tab
- Review this documentation
- Contact the DevOps team