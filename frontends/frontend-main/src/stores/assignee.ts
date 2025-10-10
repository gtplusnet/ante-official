import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { api } from 'src/boot/axios';
import { useAuthStore } from 'src/stores/auth';

export interface Assignee {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  email?: string;
  image?: string;
  companyId?: number;
  isActive?: boolean;
}

export interface FormattedAssignee {
  id: string;
  key: string;
  value: string;
  label: string;
  name: string;
  firstName: string;
  lastName: string;
  username: string;
  email?: string;
  image?: string;
  initials: string;
  avatarColor: string;
}

/**
 * Global Assignee Store
 *
 * Centralized state management for task users/assignees across the application.
 * Initialized once on app load (MainLayout.vue) to prevent multiple API calls.
 *
 * Usage:
 *   const assigneeStore = useAssigneeStore();
 *   const assignees = assigneeStore.formattedAssignees;
 *   await assigneeStore.fetchAssignees(); // manual refresh
 */
export const useAssigneeStore = defineStore('assignee', () => {
  // Get auth store for current user info
  const authStore = useAuthStore();

  // State
  const assignees = ref<Assignee[]>([]);
  const loading = ref(false);
  const error = ref<Error | null>(null);
  const initialized = ref(false);

  /**
   * Capitalize first letter of each word
   */
  const capitalizeName = (name?: string): string => {
    if (!name) return '';
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  /**
   * Get initials from name
   */
  const getInitials = (firstName?: string, lastName?: string): string => {
    if (!firstName && !lastName) return '?';

    if (firstName && lastName) {
      return (firstName[0] + lastName[0]).toUpperCase();
    }

    const name = firstName || lastName || '';
    return name.length >= 2 ? name.substring(0, 2).toUpperCase() : name.toUpperCase();
  };

  /**
   * Generate consistent avatar color based on name
   */
  const getAvatarColor = (firstName?: string, lastName?: string): string => {
    const name = `${firstName || ''} ${lastName || ''}`.trim();
    if (!name) return '#6d6e78'; // Default gray

    const colors = [
      '#FF6900', // Orange
      '#097BFF', // Blue
      '#00D084', // Green
      '#8ED1FC', // Light Blue
      '#FE9200', // Dark Orange
      '#E27D00', // Brown Orange
      '#9B59B6', // Purple
      '#E74C3C', // Red
      '#F39C12', // Yellow
      '#27AE60', // Green
      '#2980B9', // Dark Blue
      '#8E44AD'  // Dark Purple
    ];

    // Generate hash from name for consistent color
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  /**
   * Fetch task users/assignees from backend API
   * Backend handles company filtering automatically
   */
  const fetchAssignees = async () => {
    loading.value = true;
    error.value = null;

    try {
      console.log('[AssigneeStore] Fetching task users/assignees');

      const response = await api.get('/task/users');

      // Backend returns { items: [...], total: N, timestamp: ... }
      const items = response.data?.items || response.data || [];
      assignees.value = items;
      initialized.value = true;

      console.log('[AssigneeStore] Loaded', assignees.value.length, 'assignees');
    } catch (err) {
      console.error('[AssigneeStore] Failed to fetch assignees:', err);
      error.value = err as Error;
      assignees.value = [];
    } finally {
      loading.value = false;
    }
  };

  /**
   * Formatted assignees for dropdown/select display
   * Ensures current user is always included in the list
   */
  const formattedAssignees = computed<FormattedAssignee[]>(() => {
    if (!assignees.value) return [];

    const currentUserId = authStore.accountInformation?.id;
    const currentUserInfo = authStore.accountInformation;
    const accountsList = [...assignees.value];

    // Check if current user is in the list
    const currentUserInList = accountsList.some(a => a.id === currentUserId);

    // If current user is not in the list and we have their info, add them
    // This ensures the logged-in user always appears in assignee lists
    if (!currentUserInList && currentUserInfo && currentUserId) {
      const currentUserAccount: Assignee = {
        id: currentUserId,
        firstName: currentUserInfo.firstName || '',
        lastName: currentUserInfo.lastName || '',
        username: currentUserInfo.username || '',
        email: currentUserInfo.email || '',
        companyId: currentUserInfo.company?.id,  // Get from auth store
      };

      // Add current user at the beginning of the list
      accountsList.unshift(currentUserAccount);
    }

    return accountsList.map((account: Assignee) => {
      const fullName = `${capitalizeName(account.firstName)} ${capitalizeName(account.lastName)}`.trim();

      return {
        // Standard properties for compatibility
        id: account.id,
        key: account.id,
        value: account.id,
        label: fullName,

        // Extended properties for richer display
        name: fullName,
        firstName: account.firstName,
        lastName: account.lastName,
        username: account.username,
        email: account.email,
        image: account.image,
        initials: getInitials(account.firstName, account.lastName),
        avatarColor: getAvatarColor(account.firstName, account.lastName),
      };
    });
  });

  /**
   * Search assignees by name or username
   */
  const searchAssignees = (query: string): FormattedAssignee[] => {
    if (!query) return formattedAssignees.value;

    const searchTerm = query.toLowerCase();
    return formattedAssignees.value.filter(assignee => {
      return (
        assignee.name.toLowerCase().includes(searchTerm) ||
        assignee.username?.toLowerCase().includes(searchTerm)
      );
    });
  };

  /**
   * Get assignee by ID
   */
  const getAssigneeById = (id: string): FormattedAssignee | undefined => {
    return formattedAssignees.value.find(assignee => assignee.id === id);
  };

  /**
   * Format assignee name for display (with "Me" support for current user)
   */
  const formatAssigneeName = (assigneeId?: string): string => {
    if (!assigneeId) return 'Unassigned';

    // Check if it's the current user
    if (assigneeId === authStore.accountInformation?.id) {
      return 'Me';
    }

    const assignee = getAssigneeById(assigneeId);
    return assignee ? assignee.name : 'Unknown';
  };

  /**
   * Clear all assignee data
   * Used when logging out or switching accounts
   */
  const clearData = () => {
    assignees.value = [];
    initialized.value = false;
    error.value = null;
    console.log('[AssigneeStore] Data cleared');
  };

  return {
    // State
    assignees,
    loading,
    error,
    initialized,

    // Computed
    formattedAssignees,

    // Actions
    fetchAssignees,
    clearData,

    // Helpers
    getInitials,
    getAvatarColor,
    searchAssignees,
    getAssigneeById,
    formatAssigneeName
  };
});
