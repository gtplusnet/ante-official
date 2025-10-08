import { ref, computed } from 'vue';
import { api } from 'src/boot/axios';
import { useQuasar } from 'quasar';

export interface CalendarCategory {
  id: number;
  name: string;
  colorCode: string;
  icon?: string;
  description?: string;
  isSystem: boolean;
  creatorId?: string;
  companyId: number;
  isActive: boolean;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

export function useCalendarCategories() {
  const $q = useQuasar();

  const categories = ref<CalendarCategory[]>([]);
  const selectedCategories = ref<number[]>([]);
  const loading = ref(false);
  const error = ref<any>(null);

  // Fetch all categories
  const fetchCategories = async () => {
    loading.value = true;
    error.value = null;

    try {
      const response = await api.get('/calendar/category');
      categories.value = response.data || [];

      // Auto-select all categories initially
      if (selectedCategories.value.length === 0) {
        selectedCategories.value = categories.value.map(c => c.id);
      }

      return categories.value;

    } catch (err) {
      console.error('Error in fetchCategories:', err);
      error.value = err;
      $q.notify({
        type: 'negative',
        message: 'Failed to load calendar categories'
      });
      return [];
    } finally {
      loading.value = false;
    }
  };

  // Create a new category
  const createCategory = async (categoryData: {
    name: string;
    colorCode: string;
    icon?: string;
    description?: string;
    sortOrder?: number;
  }) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await api.post('/calendar/category', categoryData);
      const data = response.data;

      // Add to local list
      categories.value.push(data);

      // Auto-select new category
      selectedCategories.value.push(data.id);

      $q.notify({
        type: 'positive',
        message: 'Category created successfully'
      });

      return data;

    } catch (err) {
      console.error('Error creating category:', err);
      error.value = err;
      $q.notify({
        type: 'negative',
        message: 'Failed to create category'
      });
      return null;
    } finally {
      loading.value = false;
    }
  };

  // Update a category
  const updateCategory = async (categoryId: number, updates: {
    name?: string;
    colorCode?: string;
    icon?: string;
    description?: string;
    sortOrder?: number;
    isActive?: boolean;
  }) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await api.put(`/calendar/category/${categoryId}`, updates);
      const data = response.data;

      // Update local list
      const index = categories.value.findIndex(c => c.id === categoryId);
      if (index !== -1) {
        categories.value[index] = data;
      }

      $q.notify({
        type: 'positive',
        message: 'Category updated successfully'
      });

      return data;

    } catch (err: any) {
      console.error('Error updating category:', err);
      error.value = err;
      $q.notify({
        type: 'negative',
        message: err?.response?.data?.message || 'Failed to update category'
      });
      return null;
    } finally {
      loading.value = false;
    }
  };

  // Delete a category (soft delete)
  const deleteCategory = async (categoryId: number) => {
    loading.value = true;
    error.value = null;

    try {
      // Check if it's a system category
      const category = categories.value.find(c => c.id === categoryId);
      if (category?.isSystem) {
        $q.notify({
          type: 'warning',
          message: 'Cannot delete system categories'
        });
        return false;
      }

      await api.delete(`/calendar/category/${categoryId}`);

      // Remove from local list
      categories.value = categories.value.filter(c => c.id !== categoryId);

      // Remove from selected categories
      selectedCategories.value = selectedCategories.value.filter(id => id !== categoryId);

      $q.notify({
        type: 'positive',
        message: 'Category deleted successfully'
      });

      return true;

    } catch (err: any) {
      console.error('Error deleting category:', err);
      error.value = err;
      $q.notify({
        type: 'negative',
        message: err?.response?.data?.message || 'Failed to delete category'
      });
      return false;
    } finally {
      loading.value = false;
    }
  };

  // Toggle category selection
  const toggleCategory = (categoryId: number) => {
    const index = selectedCategories.value.indexOf(categoryId);
    if (index > -1) {
      selectedCategories.value.splice(index, 1);
    } else {
      selectedCategories.value.push(categoryId);
    }
  };

  // Select all categories
  const selectAllCategories = () => {
    selectedCategories.value = categories.value.map(c => c.id);
  };

  // Deselect all categories
  const deselectAllCategories = () => {
    selectedCategories.value = [];
  };

  // Check if category is selected
  const isCategorySelected = (categoryId: number) => {
    return selectedCategories.value.includes(categoryId);
  };

  // Get category by ID
  const getCategoryById = (categoryId: number) => {
    return categories.value.find(c => c.id === categoryId);
  };

  // Get categories for dropdown
  const categoryOptions = computed(() => {
    return categories.value.map(category => ({
      label: category.name,
      value: category.id,
      icon: category.icon,
      color: category.colorCode
    }));
  });

  // Get selected category objects
  const selectedCategoryObjects = computed(() => {
    return categories.value.filter(c => selectedCategories.value.includes(c.id));
  });

  // Predefined colors for category creation
  const predefinedColors = [
    '#2196F3', // Blue
    '#4CAF50', // Green
    '#FF9800', // Orange
    '#E91E63', // Pink
    '#9C27B0', // Purple
    '#00BCD4', // Cyan
    '#FFC107', // Amber
    '#795548', // Brown
    '#607D8B', // Blue Grey
    '#F44336', // Red
    '#3F51B5', // Indigo
    '#009688', // Teal
    '#CDDC39', // Lime
    '#FF5722', // Deep Orange
    '#9E9E9E'  // Grey
  ];

  return {
    // State
    categories,
    selectedCategories,
    loading,
    error,

    // Methods
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    toggleCategory,
    selectAllCategories,
    deselectAllCategories,
    isCategorySelected,
    getCategoryById,

    // Computed
    categoryOptions,
    selectedCategoryObjects,

    // Constants
    predefinedColors
  };
}
