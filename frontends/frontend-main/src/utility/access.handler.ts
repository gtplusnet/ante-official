import { useAuthStore } from "../stores/auth";

const hasAccess = (requiredScope: string | null) => {
  const authStore = useAuthStore();
  
  // Check if auth store and account information exist
  if (!authStore?.accountInformation?.role) {
    return false;
  }
  
  // Check if user has developer or full access privileges
  if (authStore.accountInformation.role.isDeveloper || authStore.accountInformation.role.isFullAccess) {
    return true;
  }
  
  const scopeList = authStore.accountInformation.role.scopeList as string[];
  
  // Check if scopeList exists and is an array
  if (!scopeList || !Array.isArray(scopeList)) {
    return false;
  }
  
  return requiredScope ? scopeList.includes(requiredScope) : true;
};

export { hasAccess };