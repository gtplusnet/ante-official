# Facebook App Configuration Guide

## Error: Invalid Scopes: email

This error occurs when the Facebook App hasn't been properly configured to request email permissions.

## Steps to Fix:

### 1. Go to Facebook Developers Console
- Visit: https://developers.facebook.com/apps/
- Select your app (App ID: 1088650310072618)

### 2. Configure App Settings

#### A. App Review → Permissions and Features
1. Navigate to "App Review" → "Permissions and Features"
2. Look for "email" permission
3. If it shows "Standard Access", you're good
4. If not, click "Request" next to email permission

#### B. Facebook Login Settings
1. Go to "Facebook Login" → "Settings"
2. Make sure these are configured:
   - **Valid OAuth Redirect URIs**: 
     - https://localhost:9001/
     - http://localhost:9001/
     - https://localhost:9000/
     - http://localhost:9000/
   - **Deauthorize Callback URL**: (optional)
   - **Data Deletion Request URL**: (optional)

#### C. Basic Settings
1. Go to "Settings" → "Basic"
2. Ensure these are set:
   - **App Domains**: localhost
   - **Privacy Policy URL**: (required for production)
   - **Terms of Service URL**: (required for production)
   - **App Mode**: Development (for testing)

### 3. App Mode and Status

For development/testing:
- **App Mode**: Development Mode
- This allows you to test with your developer account and test users

For production:
- **App Mode**: Live Mode
- Requires App Review for permissions beyond basic_info
- Email permission is considered "Standard Access" and typically approved automatically

### 4. Test Users (Optional)
If you want to test with other accounts while in Development Mode:
1. Go to "Roles" → "Test Users"
2. Add test users who can login during development

### 5. Required Permissions Configuration

The `email` permission is a standard permission that should be automatically available. However, if you're seeing this error, it might be because:

1. **App is in Development Mode**: Only app admins, developers, and testers can use the app
2. **App Category not set**: Some app categories require additional review
3. **Missing Platform Configuration**: Make sure "Website" platform is added

### 6. Quick Fix for Development

If you just want to test quickly:
1. Remove the email scope temporarily from the code
2. Or ensure you're logging in with an account that has a role in the app (Admin/Developer/Tester)

## Code Changes (if needed)

If you want to proceed without email permission for now, update the scope in both files:

**InviteAcceptance.vue** and **SignInForm.vue**:
```javascript
// Change from:
window.FB.login(handleFacebookCallback, { scope: 'email' });

// To (no scope):
window.FB.login(handleFacebookCallback);

// Or to (public_profile only):
window.FB.login(handleFacebookCallback, { scope: 'public_profile' });
```

## Verification Steps

1. Clear browser cache and cookies
2. Try logging in with the Facebook account that created the app (should always work)
3. Check browser console for any additional errors

## Production Checklist

Before going to production:
- [ ] Add Privacy Policy URL
- [ ] Add Terms of Service URL  
- [ ] Submit for App Review if needed
- [ ] Switch to Live Mode
- [ ] Update redirect URIs with production domain
- [ ] Test with real user accounts