<template>
  <div>
    <!-- Company Selection -->
    <g-input
      ref="selectBox"
      v-model="selectedCompanyId"
      type="select-search-with-add"
      apiUrl="/select-box/company-list"
      :label="label"
      :require="required"
      :isDisabled="disabled"
      @showAddDialog="showAddDialog"
    ></g-input>

    <!-- Add/Edit Company Dialog -->
    <LeadCompanyDialog
      v-model="isDialogOpen"
      :loading="dialogLoading"
      @submit="handleCompanySubmit"
    />
  </div>
</template>

<script lang="ts" setup>
import { ref, watch, getCurrentInstance, defineAsyncComponent } from 'vue';
import { useQuasar } from 'quasar';
import GInput from 'src/components/shared/form/GInput.vue';

// Lazy-loaded dialogs (ALL dialogs must be lazy loaded - CLAUDE.md)
const LeadCompanyDialog = defineAsyncComponent(
  () => import('src/pages/Member/Leads/Companies/LeadCompanyDialog.vue')
);

defineOptions({
  name: 'SelectionCompany',
});

// Props
interface Props {
  modelValue?: number | null;
  required?: boolean;
  disabled?: boolean;
  label?: string;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: null,
  required: false,
  disabled: false,
  label: 'Company',
});

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: number | null];
}>();

const $q = useQuasar();
const instance = getCurrentInstance();
const $api = instance?.appContext.config.globalProperties.$api;

// State
const selectedCompanyId = ref<number | null>(null);
const isDialogOpen = ref(false);
const dialogLoading = ref(false);
const selectBox = ref();

// Watch for prop changes
watch(
  () => props.modelValue,
  (newVal: number | null | undefined) => {
    selectedCompanyId.value = newVal ?? null;
  },
  { immediate: true }
);

// Watch for internal changes
watch(selectedCompanyId, (newVal: number | null) => {
  emit('update:modelValue', newVal);
});

// Methods
const showAddDialog = () => {
  isDialogOpen.value = true;
};

const handleCompanySubmit = async (companyData: {
  name: string;
  employees: number;
  deals: number;
}) => {
  if (!$api) return;

  try {
    dialogLoading.value = true;

    // Create new company
    const response = await $api.post('/lead-company', companyData);

    $q.notify({
      color: 'positive',
      message: 'Company created successfully',
      icon: 'check_circle',
    });

    // Get the new company ID (API uses responseHandler, returns data directly)
    const newCompanyId = response.data.id;

    // Reload the select box and auto-select the new company
    if (selectBox.value && newCompanyId) {
      await selectBox.value.reloadGSelect(newCompanyId);
    } else if (selectBox.value) {
      // If no ID returned, just reload
      await selectBox.value.reloadGSelect();
    }

    // Close dialog
    isDialogOpen.value = false;
  } catch (error: any) {
    console.error('Error creating company:', error);
    const errorMessage =
      error?.response?.data?.message ||
      error?.message ||
      'Failed to create company';
    $q.notify({
      color: 'negative',
      message: errorMessage,
      icon: 'error',
    });
  } finally {
    dialogLoading.value = false;
  }
};
</script>

<style scoped lang="scss">
/* Styles handled by GInput component */
</style>
