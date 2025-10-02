import { NavigationGuardNext, RouteLocationNormalized } from 'vue-router';
import { useAuthStore } from "../../stores/auth";

export function FrontRouteGuard(
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext
) {
  const authStore = useAuthStore();
  
  console.log('FrontRouteGuard - Checking route:', {
    toName: to.name,
    toPath: to.path,
    toFullPath: to.fullPath,
    toHash: to.hash,
    fromName: from.name,
    fromPath: from.path,
    hasToken: !!authStore.token,
    windowHash: window.location.hash
  });
  
  // List of routes that should be accessible regardless of auth status
  const publicRoutes = ['front_landing', 'front_login', 'front_signup', 'front_verify_email', 'front_invite_accept'];
  
  // Check if URL contains verify-email or invite path (for hash routing edge case)
  const isVerificationUrl = to.fullPath.includes('verify-email') || 
                           to.path.includes('verify-email') ||
                           window.location.hash.includes('verify-email');
  
  const isInviteUrl = to.fullPath.includes('invite') || 
                      to.path.includes('invite') ||
                      window.location.hash.includes('invite');
  
  // If it's a public route, verification URL, or invite URL, always allow access
  if (publicRoutes.includes(to.name as string) || isVerificationUrl || isInviteUrl) {
    console.log('FrontRouteGuard - Allowing access to public route/verification/invite URL:', to.name || 'verify-email/invite');
    next();
    return;
  }
  
  // For authenticated users on non-public routes, redirect to appropriate dashboard
  if (authStore.token && authStore.accountInformation) {
    console.log('FrontRouteGuard - User is authenticated, checking account status');
    
    // Check if account is inactive
    if (authStore.accountInformation.isDeleted === true) {
      // Allow access to inactive account page
      if (to.name === 'front_inactive_account') {
        next();
      } else {
        // Redirect to inactive account page
        console.log('FrontRouteGuard - Redirecting to inactive account page');
        next({ name: 'front_inactive_account' });
      }
    } else {
      // Active account - redirect to member dashboard
      console.log('FrontRouteGuard - Redirecting authenticated user to member dashboard');
      next({ name: 'member_dashboard' });
    }
    return;
  }
  
  // Not authenticated - allow access to front routes
  next();
}