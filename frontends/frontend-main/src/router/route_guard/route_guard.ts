import { NavigationGuardNext, RouteLocationNormalized } from 'vue-router';
import { useAuthStore } from "../../stores/auth";

export function MemberRouteGuard(
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext
) {
  const authStore = useAuthStore();
  
  // Basic authentication check
  if (!authStore.token) {
    next({ name: 'front_login' });
    return;
  }
  
  // Check if account is inactive (isDeleted = true)
  if (authStore.accountInformation?.isDeleted === true) {
    // Only allow access to the inactive account page
    if (to.name === 'front_inactive_account') {
      next();
    } else {
      // Redirect to inactive account page for any other route
      next({ name: 'front_inactive_account' });
    }
    return;
  }
  
  // Note: Scope checking is now handled by the global navigation guard in router/index.ts
  // This guard only handles basic authentication and account status
  
  // Account is active and authenticated
  next();
}
