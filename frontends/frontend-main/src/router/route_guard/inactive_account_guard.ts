import { NavigationGuardNext, RouteLocationNormalized } from 'vue-router';
import { useAuthStore } from "../../stores/auth";

export function InactiveAccountGuard(
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext
) {
  const authStore = useAuthStore();
  
  // Check if user is authenticated
  if (!authStore.token) {
    next({ name: 'front_login' });
    return;
  }
  
  // Check if account is inactive (isDeleted = true)
  if (authStore.accountInformation?.isDeleted === true) {
    // Allow access to inactive account page
    if (to.name === 'front_inactive_account') {
      next();
    } else {
      // Redirect to inactive account page for all other routes
      next({ name: 'front_inactive_account' });
    }
  } else {
    // Account is active, proceed normally
    next();
  }
}