<template>
  <q-dialog v-model="isOpen" persistent>
    <TemplateDialog maxWidth="400px">
      <template #DialogIcon>
        <q-icon name="o_business" />
      </template>
      <template #DialogTitle>
        {{ viewOnly ? 'View Company' : (isEditing ? 'Edit Company' : 'New Company') }}
      </template>
      <template #DialogContent>
        <q-form @submit.prevent="onSubmit" class="q-px-md q-pb-md">
          <!-- Company Name -->
          <GInput
            v-model="formData.name"
            label="Company Name"
            type="text"
            :required="!viewOnly"
            :rules="viewOnly ? [] : [(val: string) => !!val || 'Company name is required']"
            :isDisabled="viewOnly"
            ref="companyNameRef"
            class="text-body-small"
          />

          <!-- Number of Employees -->
          <GInput
            v-model="formData.employees"
            label="Number of Employees"
            type="number"
            :rules="viewOnly ? [] : [(val: number) => val >= 0 || 'Must be a positive number']"
            :isDisabled="viewOnly"
            class="text-body-small"
          />

          <!-- Actions -->
          <div class="text-right q-mt-lg">
            <GButton
              no-caps
              class="q-mr-sm"
              variant="tonal"
              :label="viewOnly ? 'Close' : 'Cancel'"
              type="button"
              v-close-popup
            />
            <GButton
              v-if="!viewOnly"
              no-caps
              :label="isEditing ? 'Update' : 'Create'"
              type="submit"
              color="primary"
              :loading="loading"
            />
          </div>
        </q-form>
      </template>
    </TemplateDialog>
  </q-dialog>
</template>

<script lang="ts" setup>
import { ref, watch, nextTick, defineAsyncComponent } from 'vue';
import GButton from 'src/components/shared/buttons/GButton.vue';
import GInput from 'src/components/shared/form/GInput.vue';

// Lazy-loaded dialogs (ALL dialogs must be lazy loaded - CLAUDE.md)
const TemplateDialog = defineAsyncComponent(() =>
  import('src/components/dialog/TemplateDialog.vue')
);

interface CompanyFormData {
  name: string;
  employees: number;
}

interface Company {
  id: number;
  name: string;
  employees: number;
  deals: number;
  dateCreated: string;
  createdBy: string;
}

const props = defineProps<{
  modelValue: boolean;
  company?: Company | null;
  loading?: boolean;
  viewOnly?: boolean;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  'submit': [data: CompanyFormData & { deals: number }];
}>();

const isOpen = ref(props.modelValue);
const companyNameRef = ref();

const formData = ref<CompanyFormData>({
  name: '',
  employees: 0,
});

const isEditing = ref(false);

// Watch for dialog open/close
watch(() => props.modelValue, (newVal) => {
  isOpen.value = newVal;
  if (newVal) {
    resetForm();
    // Focus on company name field when dialog opens (only if not in view mode)
    if (!props.viewOnly) {
      nextTick(() => {
        companyNameRef.value?.focus();
      });
    }
  }
});

// Watch for company prop changes (editing mode)
watch(() => props.company, (newCompany) => {
  if (newCompany) {
    isEditing.value = true;
    formData.value = {
      name: newCompany.name,
      employees: newCompany.employees,
    };
  } else {
    isEditing.value = false;
  }
});

// Watch for internal dialog state changes
watch(isOpen, (newVal) => {
  emit('update:modelValue', newVal);
});

const resetForm = () => {
  if (props.company) {
    // Editing mode
    isEditing.value = true;
    formData.value = {
      name: props.company.name,
      employees: props.company.employees,
    };
  } else {
    // New company mode
    isEditing.value = false;
    formData.value = {
      name: '',
      employees: 0,
    };
  }
};

const onSubmit = async () => {
  // Validate form
  if (!formData.value.name.trim()) {
    companyNameRef.value.focus();
    return;
  }

  // Emit the form data with proper type conversion
  emit('submit', {
    name: formData.value.name.trim(),
    employees: parseInt(formData.value.employees.toString()) || 0,
    deals: 0,
  });
};
</script>

<style scoped>
/* TemplateDialog handles all dialog styling */
</style>