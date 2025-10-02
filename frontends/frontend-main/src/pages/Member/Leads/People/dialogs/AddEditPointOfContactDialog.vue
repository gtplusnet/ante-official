<template>
  <q-dialog ref="dialog" @before-show="onDialogShow">
    <q-card class="full-width dialog-card">
      <q-bar class="bg-primary text-white cursor-default" dark>
        <q-icon :name="isEditMode ? 'edit' : 'person_add'" />
        <div class="text-title-medium">{{ isEditMode ? 'Edit Point of Contact' : 'Add Point of Contact' }}</div>

        <q-space />

        <q-btn dense flat icon="close" v-close-popup>
          <q-tooltip class="text-label-small">Close</q-tooltip>
        </q-btn>
      </q-bar>

      <q-card-section>
        <q-form @submit.prevent="submitContact" ref="form">
          <div class="row q-col-gutter-md">
            <!-- Full Name Field -->
            <div class="col-12 col-md-6">
              <q-input
                v-model="formData.fullName"
                label="Full Name *"
                outlined
                dense
                :rules="[val => !!val || 'Full name is required']"
                class="q-mb-md"
                ref="firstInput"
              />
            </div>

            <!-- Email Field -->
            <div class="col-12 col-md-6">
              <q-input
                v-model="formData.email"
                label="Email *"
                type="email"
                outlined
                dense
                :rules="[
                  val => !!val || 'Email is required',
                  val => /.+@.+\..+/.test(val) || 'Please enter a valid email'
                ]"
                class="q-mb-md"
              />
            </div>

            <!-- Company Field -->
            <div class="col-12 col-md-6">
              <q-select
                v-model="formData.companyId"
                :options="companyOptions"
                label="Company *"
                option-label="label"
                option-value="value"
                emit-value
                map-options
                outlined
                dense
                :rules="[val => val !== null && val !== undefined || 'Company is required']"
                class="q-mb-md"
                :loading="loadingCompanies"
              />
            </div>

            <!-- Job Title Field -->
            <div class="col-12 col-md-6">
              <q-input
                v-model="formData.jobTitle"
                label="Job Title"
                outlined
                dense
                class="q-mb-md"
              />
            </div>

            <!-- Phone Field -->
            <div class="col-12">
              <q-input
                v-model="formData.phone"
                label="Phone"
                outlined
                dense
                class="q-mb-md"
              />
            </div>
          </div>

          <!-- Actions -->
          <div class="text-right q-mt-md">
            <q-btn
              no-caps
              class="q-mr-sm text-label-large"
              outline
              label="Cancel"
              type="button"
              color="primary"
              v-close-popup
              :disable="submitting"
            />
            <q-btn
              no-caps
              unelevated
              :label="isEditMode ? 'Update Contact' : 'Create Contact'"
              type="submit"
              color="primary"
              class="text-label-large"
              :loading="submitting"
              :disable="submitting"
            />
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script lang="ts" setup>
import { ref, getCurrentInstance, nextTick, computed } from 'vue';
import { useQuasar } from 'quasar';

defineOptions({
  name: 'AddEditPointOfContactDialog',
});

// Props
const props = defineProps<{
  contactId?: number;
}>();

// Emits
const emit = defineEmits<{
  created: [contact: any];
  updated: [contact: any];
}>();

// Computed
const isEditMode = computed(() => !!props.contactId);

const $q = useQuasar();
const instance = getCurrentInstance();
const $api = instance?.appContext.config.globalProperties.$api;

// Refs
const dialog = ref();
const form = ref();
const firstInput = ref();

// Form data
interface ContactForm {
  fullName: string;
  email: string;
  phone: string;
  jobTitle: string;
  companyId: number | null;
}

const initialForm: ContactForm = {
  fullName: '',
  email: '',
  phone: '',
  jobTitle: '',
  companyId: null
};

const formData = ref<ContactForm>({ ...initialForm });

// State
const submitting = ref(false);
const loadingCompanies = ref(false);

interface CompanyOption {
  label: string;
  value: number;
}

const companyOptions = ref<CompanyOption[]>([]);

// Methods
const fetchCompanies = async () => {
  if (!$api) return;
  
  loadingCompanies.value = true;
  try {
    const response = await $api.get('/lead-company/list');
    const companies = response.data.data || response.data || [];
    
    companyOptions.value = companies.map((company: any) => ({
      label: company.name || company.label || company.companyName,
      value: company.id || company.value
    }));
  } catch (error) {
    console.error('Error fetching companies:', error);
    $q.notify({
      color: 'negative',
      message: 'Failed to load companies',
      icon: 'error'
    });
  } finally {
    loadingCompanies.value = false;
  }
};

const fetchContactData = async () => {
  if (!$api || !props.contactId) return;
  
  submitting.value = true;
  try {
    const response = await $api.get(`/point-of-contact/${props.contactId}`);
    const contact = response.data;
    
    // Populate form with existing data
    formData.value = {
      fullName: contact.fullName || '',
      email: contact.email || '',
      phone: contact.phone || '',
      jobTitle: contact.jobTitle || '',
      companyId: contact.company?.id || contact.companyId || null
    };
  } catch (error) {
    console.error('Error fetching contact data:', error);
    $q.notify({
      color: 'negative',
      message: 'Failed to load contact data',
      icon: 'error'
    });
  } finally {
    submitting.value = false;
  }
};

const resetForm = () => {
  formData.value = { ...initialForm };
  if (form.value) {
    form.value.resetValidation();
  }
};

const onDialogShow = async () => {
  resetForm();
  await fetchCompanies();
  
  // If in edit mode, fetch the contact data
  if (isEditMode.value) {
    await fetchContactData();
  }
  
  // Focus on first input after dialog is fully shown
  nextTick(() => {
    if (firstInput.value) {
      firstInput.value.focus();
    }
  });
};

const submitContact = async () => {
  if (!$api) return;
  
  // Validate form
  const isValid = await form.value.validate();
  if (!isValid) {
    return;
  }
  
  submitting.value = true;
  try {
    let response;
    let successMessage;
    
    if (isEditMode.value) {
      // Update existing contact
      response = await $api.put(`/point-of-contact/${props.contactId}`, formData.value);
      successMessage = `Successfully updated contact: ${formData.value.fullName}`;
      
      // Emit the updated event
      emit('updated', response.data);
    } else {
      // Create new contact
      response = await $api.post('/point-of-contact', formData.value);
      successMessage = `Successfully created contact: ${formData.value.fullName}`;
      
      // Emit the created event
      emit('created', response.data);
    }
    
    $q.notify({
      color: 'positive',
      message: successMessage,
      icon: 'check_circle'
    });
    
    // Close dialog
    dialog.value.hide();
    
  } catch (error: any) {
    console.error(`Error ${isEditMode.value ? 'updating' : 'creating'} contact:`, error);
    
    let errorMessage = `Failed to ${isEditMode.value ? 'update' : 'create'} contact`;
    if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    }
    
    $q.notify({
      color: 'negative',
      message: errorMessage,
      icon: 'error'
    });
  } finally {
    submitting.value = false;
  }
};

// Expose methods for parent component
defineExpose({
  show: () => dialog.value.show(),
  hide: () => dialog.value.hide(),
});
</script>

<style scoped lang="scss">
.dialog-card {
  max-width: 600px;
  width: 100%;
}

@media (max-width: 599px) {
  .dialog-card {
    margin: 16px;
    max-width: calc(100vw - 32px);
  }
}
</style>