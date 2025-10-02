import { route } from 'quasar/wrappers';
import {
  createMemoryHistory,
  createRouter,
  createWebHashHistory,
  createWebHistory,
} from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { hasAccess } from '../utility/access.handler';

import routes from './routes';

/*
 * If not building with SSR mode, you can
 * directly export the Router instantiation;
 *
 * The function below can be async too; either use
 * async/await or return a Promise which resolves
 * with the Router instance.
 */

export default route(function (/* { store, ssrContext } */) {
  const createHistory = process.env.SERVER
    ? createMemoryHistory
    : (process.env.VUE_ROUTER_MODE === 'history' ? createWebHistory : createWebHashHistory);

  const Router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,

    // Leave this as is and make changes in quasar.conf.js instead!
    // quasar.conf.js -> build -> vueRouterMode
    // quasar.conf.js -> build -> publicPath
    history: createHistory(process.env.VUE_ROUTER_BASE),
  });

  // Global navigation guard for scope checking on ALL routes
  Router.beforeEach((to, _from, next) => {
    // Skip scope check for non-member routes
    if (!to.path.startsWith('/member')) {
      next();
      return;
    }

    const authStore = useAuthStore();
    
    // Check authentication first for member routes
    if (!authStore.isAuthenticated) {
      next({ name: 'front_login', query: { redirect: to.fullPath } });
      return;
    }
    
    // Check if account is inactive
    if (authStore.accountInformation?.isDeleted === true) {
      if (to.name === 'front_inactive_account') {
        next();
      } else {
        next({ name: 'front_inactive_account' });
      }
      return;
    }

    // Get required scope from meta
    const requiredScope = to.meta?.requiredScope as string | string[] | undefined;
    
    // If no scope required, proceed
    if (!requiredScope) {
      next();
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
      console.warn(`[ROUTE GUARD] Access denied to ${to.path}. Required scope: ${scopes.join(' or ')}`);
      
      // Import Notify dynamically to avoid build issues
      import('quasar').then(({ Notify }) => {
        Notify.create({
          type: 'negative',
          message: 'Access Denied',
          caption: 'You do not have permission to access this page',
          position: 'top',
          timeout: 3000
        });
      });
      
      // Redirect to dashboard
      next({ name: 'member_dashboard' });
      return;
    }

    // User has required scope, proceed
    next();
  });

  return Router;
});
