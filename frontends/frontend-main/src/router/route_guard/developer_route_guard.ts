import { NavigationGuardNext, RouteLocationNormalized } from 'vue-router';
import { useAuthStore } from '../../stores/auth';
import { Notify } from 'quasar';

export function DeveloperRouteGuard(
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext
) {
  const authStore = useAuthStore();
  
  // First check if user is authenticated
  if (!authStore.token) {
    next({ name: 'front_login' });
    return;
  }
  
  // Check if account is inactive (isDeleted = true)
  if (authStore.accountInformation?.isDeleted === true) {
    next({ name: 'front_inactive_account' });
    return;
  }
  
  // Check if user is a developer
  if (authStore.isDeveloper) {
    next();
  } else {
    // Show notification
    Notify.create({
      type: 'negative',
      message: 'Access Denied: Developer privileges required',
      position: 'top',
      timeout: 3000
    });
    
    // Redirect to dashboard
    next({ name: 'member_dashboard' });
  }
}