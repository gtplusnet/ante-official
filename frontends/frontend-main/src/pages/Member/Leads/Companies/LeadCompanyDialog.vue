<template>
  <q-dialog v-model="isOpen" persistent>
    <q-card class="company-dialog" style="min-width: 500px">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">{{ isEditing ? 'Edit Company' : 'New Company' }}</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section>
        <q-form @submit="onSubmit" class="q-gutter-md">
          <!-- Company Name -->
          <q-input
            v-model="formData.name"
            label="Company Name *"
            outlined
            :rules="[val => !!val || 'Company name is required']"
            ref="companyNameRef"
          />

          <!-- Number of Employees -->
          <q-input
            v-model.number="formData.employees"
            label="Number of Employees"
            outlined
            type="number"
            min="0"
            :rules="[val => val >= 0 || 'Must be a positive number']"
          />

        </q-form>
      </q-card-section>

      <q-card-actions align="right" class="q-pt-none">
        <q-btn flat label="Cancel" color="grey-7" v-close-popup />
        <q-btn
          unelevated
          :label="isEditing ? 'Update' : 'Create'"
          color="primary"
          @click="onSubmit"
          :loading="loading"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script lang="ts" setup>
import { ref, watch, nextTick } from 'vue';

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
    // Focus on company name field when dialog opens
    nextTick(() => {
      companyNameRef.value?.focus();
    });
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
.company-dialog {
  max-width: 90vw;
}

.company-dialog .q-card-section {
  padding: 16px 24px;
}

.company-dialog .q-card-actions {
  padding: 8px 24px 24px;
}
</style>