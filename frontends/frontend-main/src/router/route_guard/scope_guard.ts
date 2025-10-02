import { NavigationGuardNext, RouteLocationNormalized } from 'vue-router';
import { hasAccess } from '../../utility/access.handler';
import { Notify } from 'quasar';
import { useAuthStore } from '../../stores/auth';

/**
 * Creates a navigation guard that checks for required scopes
 * @param requiredScope - Single scope or array of scopes (OR logic)
 * @returns Navigation guard function
 */
export function createScopeGuard(requiredScope?: string | string[]) {
  return (
    to: RouteLocationNormalized,
    from: RouteLocationNormalized,
    next: NavigationGuardNext
  ) => {
    // If no scope required, proceed
    if (!requiredScope) {
      next();
      return;
    }

    const authStore = useAuthStore();

    // Check authentication first
    if (!authStore.isAuthenticated) {
      next({ 
        name: 'front_login', 
        query: { redirect: to.fullPath } 
      });
      return;
    }

    // Check if user has developer or full access privileges
    if (authStore.accountInformation?.role?.isDeveloper || 
        authStore.accountInformation?.role?.isFullAccess) {
      next();
      return;
    }

    // Check scope access
    const scopes = Array.isArray(requiredScope) ? requiredScope : [requiredScope];
    const hasRequiredAccess = scopes.some(scope => hasAccess(scope));

    if (!hasRequiredAccess) {
      // Log for debugging
      console.warn(`[SCOPE GUARD] Access denied to ${to.path}. Required scope: ${scopes.join(' or ')}`);

      // Show notification
      Notify.create({
        type: 'negative',
        message: 'Access Denied',
        caption: 'You do not have permission to access this page',
        position: 'top',
        timeout: 3000
      });

      // Smart redirect logic
      if (from.name && from.name !== 'front_login' && from.name !== 'front_landing') {
        // Stay on current page if coming from an authenticated page
        next(false);
      } else {
        // Redirect to dashboard if coming from login or no previous page
        next({ name: 'member_dashboard' });
      }
      return;
    }

    // User has required scope, proceed
    next();
  };
}

/**
 * Checks if the current user has access to a specific route based on its scope requirements
 * @param to - The route to check
 * @returns boolean indicating if user has access
 */
export function checkRouteScope(to: RouteLocationNormalized): boolean {
  const requiredScope = to.meta?.requiredScope as string | string[] | undefined;
  
  if (!requiredScope) {
    return true; // No scope required
  }

  const authStore = useAuthStore();
  
  // Check authentication
  if (!authStore.isAuthenticated) {
    return false;
  }

  // Check developer/full access
  if (authStore.accountInformation?.role?.isDeveloper || 
      authStore.accountInformation?.role?.isFullAccess) {
    return true;
  }

  // Check specific scopes
  const scopes = Array.isArray(requiredScope) ? requiredScope : [requiredScope];
  return scopes.some(scope => hasAccess(scope));
}

/**
 * Navigation guard that checks scopes defined in route meta
 */
export function ScopeRouteGuard(
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext
) {
  const requiredScope = to.meta?.requiredScope as string | string[] | undefined;
  
  // Use the createScopeGuard with the meta scope
  const guard = createScopeGuard(requiredScope);
  guard(to, from, next);
}