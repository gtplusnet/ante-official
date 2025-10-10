import { ref, computed, onMounted } from 'vue';
import { useAuthStore } from 'src/stores/auth';
import { api } from 'src/boot/axios';

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

export function useAssigneeList() {
  // Get the current user's company ID from auth store
  const authStore = useAuthStore();
  const currentUserId = authStore.accountInformation?.id;
  const currentUserInfo = authStore.accountInformation;

  // State
  const accounts = ref<Assignee[]>([]);
  const loading = ref(false);
  const error = ref<Error | null>(null);

  // Fetch task users from backend API (bypasses RLS restrictions)
  const fetchTaskUsers = async () => {
    loading.value = true;
    error.value = null;

    try {
      const response = await api.get('/task/users');

      // Backend returns { items: [...], total: N, timestamp: ... }
      const items = response.data?.items || response.data || [];
      accounts.value = items;
    } catch (err) {
      console.error('Failed to fetch task users:', err);
      error.value = err as Error;
      accounts.value = [];
    } finally {
      loading.value = false;
    }
  };

  // Auto-fetch on mount
  onMounted(() => {
    fetchTaskUsers();
  });

  // Helper function to capitalize first letter of each word
  const capitalizeName = (name?: string): string => {
    if (!name) return '';
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  // Helper function to get initials from name
  const getInitials = (firstName?: string, lastName?: string): string => {
    if (!firstName && !lastName) return '?';

    if (firstName && lastName) {
      return (firstName[0] + lastName[0]).toUpperCase();
    }

    const name = firstName || lastName || '';
    return name.length >= 2 ? name.substring(0, 2).toUpperCase() : name.toUpperCase();
  };

  // Helper function to generate consistent avatar color based on name
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

  // Format assignees for dropdown display (compatible with GInput select)
  const formattedAssignees = computed(() => {
    if (!accounts.value) return [];

    const accountsList = [...accounts.value];

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

        // Original account data
        ...account
      };
    });
  });

  // Assignees list compatible with both TaskListView and select dropdowns
  const assignees = computed(() => {
    return formattedAssignees.value.map(assignee => ({
      id: assignee.id,
      name: assignee.name,
      username: assignee.username,
      image: assignee.image,
      // For GInput select compatibility
      label: assignee.label,
      value: assignee.value,
      // Helper properties
      initials: assignee.initials,
      avatarColor: assignee.avatarColor
    }));
  });

  // Add search functionality
  const searchAssignees = (query: string) => {
    if (!query) return assignees.value;

    const searchTerm = query.toLowerCase();
    return assignees.value.filter(assignee => {
      return (
        assignee.name.toLowerCase().includes(searchTerm) ||
        assignee.username?.toLowerCase().includes(searchTerm)
      );
    });
  };

  // Get assignee by ID
  const getAssigneeById = (id: string) => {
    return formattedAssignees.value.find(assignee => assignee.id === id);
  };

  // Format assignee name for display (with "Me" support for current user)
  const formatAssigneeName = (assigneeId?: string): string => {
    if (!assigneeId) return 'Unassigned';

    // Check if it's the current user
    if (assigneeId === authStore.accountInformation?.id) {
      return 'Me';
    }

    const assignee = getAssigneeById(assigneeId);
    return assignee ? assignee.name : 'Unknown';
  };

  return {
    // Main data
    assignees,
    formattedAssignees,
    loading,
    error,

    // Helper functions
    getInitials,
    getAvatarColor,
    searchAssignees,
    getAssigneeById,
    formatAssigneeName,

    // Refresh function
    refetch: fetchTaskUsers
  };
}