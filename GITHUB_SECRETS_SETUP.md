# GitHub Secrets Setup for Vercel Deployment

## 🔑 Required GitHub Repository Secrets

To enable automatic deployment to Vercel via GitHub Actions, you need to add the following secrets to your GitHub repository.

### Where to Add Secrets

Navigate to: **https://github.com/gtplusnet/ante-official/settings/secrets/actions**

Or follow these steps:
1. Go to your repository on GitHub
2. Click **Settings** tab
3. In the left sidebar, click **Secrets and variables** → **Actions**
4. Click **New repository secret** button

---

## 📋 Secrets to Add

### 1. VERCEL_TOKEN
```
I1eeF0mdzbemRK7ZOOnjNRh0
```
**Description**: Vercel authentication token for CLI deployments
**Used by**: All workflow files

### 2. VERCEL_ORG_ID
```
ante-73eb5469
```
**Description**: Vercel team/organization ID
**Used by**: All workflow files

### 3. VERCEL_PROJECT_ID_FRONTEND_MAIN
```
prj_96zz5i9lKcdV7MlYcQD2fCRyXgD3
```
**Description**: Project ID for Frontend Main (ERP app)
**Used by**: `deploy-frontend-main.yml`

### 4. VERCEL_PROJECT_ID_GATE_APP
```
prj_dgxFqGSheEXelIUCTOlV4aT1oB9d
```
**Description**: Project ID for Gate App
**Used by**: `deploy-gate-app.yml`

### 5. VERCEL_PROJECT_ID_GUARDIAN_APP
```
prj_3p2gtMLxAz25siKsyEyLbb5p9dBa
```
**Description**: Project ID for Guardian App
**Used by**: `deploy-guardian-app.yml`

---

## 📸 Step-by-Step Instructions

### For Each Secret:

1. Click **New repository secret**
2. **Name**: Enter the secret name exactly as shown above (e.g., `VERCEL_TOKEN`)
3. **Secret**: Paste the corresponding value
4. Click **Add secret**

**Repeat for all 5 secrets.**

---

## ✅ Verification

After adding all secrets, you should see:
- ✅ VERCEL_TOKEN
- ✅ VERCEL_ORG_ID
- ✅ VERCEL_PROJECT_ID_FRONTEND_MAIN
- ✅ VERCEL_PROJECT_ID_GATE_APP
- ✅ VERCEL_PROJECT_ID_GUARDIAN_APP

---

## 🚀 After Setup

Once all secrets are added:

1. **Automatic Deployment**: Push code to `main` branch
   - Changes in `/frontends/frontend-main/` trigger Frontend Main deployment
   - Changes in `/frontends/frontend-gate-app/` trigger Gate App deployment
   - Changes in `/frontends/frontend-guardian-app/` trigger Guardian App deployment

2. **Manual Deployment**:
   - Go to **Actions** tab
   - Select workflow (e.g., "Deploy Frontend Main to Vercel Staging")
   - Click **Run workflow**
   - Choose branch and click **Run workflow** button

---

## 🔒 Security Notes

- ✅ These secrets are encrypted by GitHub
- ✅ Only accessible to GitHub Actions workflows
- ✅ Never exposed in logs or pull request comments
- ✅ Can be updated anytime without code changes

---

## 🆘 Troubleshooting

### If deployment fails with "Invalid token":
- Verify `VERCEL_TOKEN` is correct
- Check token hasn't expired
- Ensure token has full access permissions

### If deployment fails with "Project not found":
- Verify Project IDs match `.vercel/project.json`
- Ensure projects exist in Vercel dashboard
- Check `VERCEL_ORG_ID` matches team ID

### If workflow doesn't trigger:
- Check GitHub Actions is enabled for repository
- Verify workflow files are in `.github/workflows/`
- Ensure branch name is `main` (not `master`)

---

**Last Updated**: 2025-01-03
**Reference**: See [CLAUDE.local.md](CLAUDE.local.md) for all credentials (not version controlled)
