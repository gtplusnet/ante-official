<template>
  <q-card class="settings-company-card q-pa-md">
    <q-card-section>
      <div class="text-title-medium">Company Information</div>
    </q-card-section>
    <q-card-section>
      <q-form @submit="onSubmit" class="q-gutter-md">
        <div class="row">
          <div class="col-12">
            <div class="q-mx-sm q-mb-md">
              <label class="text-label-medium">Company Name</label>
              <g-input class="text-body-small" v-model="formData.companyName" :rules="[(val: string) => !!val || 'Company name is required']" required />
            </div>
          </div>
          <div class="col-12 col-md-6">
            <div class="q-mx-sm q-mb-md">
              <label class="text-label-medium">Company Code</label>
              <g-input class="text-body-small" v-model="formData.domainPrefix" :rules="[(val: string) => !!val || 'Company code is required']" required />
            </div>
          </div>
          <div class="col-12 col-md-6">
            <div class="q-mx-sm q-mb-md">
              <label class="text-label-medium">Business Type</label>
              <g-input class="text-body-small" v-model="formData.businessType" type="select" api-url="/select-options/business-types" :null-option="'Select Business Type'" :rules="[(val: string | null) => !!val || 'Business type is required']" required />
            </div>
          </div>
          <div class="col-12 col-md-6">
            <div class="q-mx-sm q-mb-md">
              <label class="text-label-medium">Industry</label>
              <g-input class="text-body-small" v-model="formData.industry" type="select" api-url="/select-options/industries" :null-option="'Select Industry'" :rules="[(val: string | null) => !!val || 'Industry is required']" required />
            </div>
          </div>
          <div class="col-12 col-md-6">
            <div class="q-mx-sm q-mb-md">
              <label class="text-label-medium">Registration No</label>
              <g-input class="text-body-small" v-model="formData.registrationNo" />
            </div>
          </div>
          <div class="col-12 col-md-6">
            <div class="q-mx-sm q-mb-md">
              <label class="text-label-medium">Website</label>
              <g-input class="text-body-small" v-model="formData.website" type="text" />
            </div>
          </div>
          <div class="col-12 col-md-6">
            <div class="q-mx-sm q-mb-md">
              <label class="text-label-medium">Email</label>
              <g-input class="text-body-small" v-model="formData.email" type="text" />
            </div>
          </div>
          <div class="col-12 col-md-6">
            <div class="q-mx-sm q-mb-md">
              <label class="text-label-medium">Phone</label>
              <g-input class="text-body-small" v-model="formData.phone" />
            </div>
          </div>
          <div class="col-12 col-md-6">
            <div class="q-mx-sm q-mb-md">
              <label class="text-label-medium">TIN No</label>
              <g-input class="text-body-small" v-model="formData.tinNo" />
            </div>
          </div>
          <div class="col-12">
            <div class="q-mx-sm q-mb-md">
              <label class="text-label-medium">Address</label>
              <g-input class="text-body-small" v-model="formData.address" type="textarea" rows="3" />
            </div>
          </div>
          <div class="col-12">
            <div class="q-mx-sm q-mb-md">
              <label class="text-label-medium">Company Logo</label>
              <div class="q-mt-sm">
                <div v-if="formData.logoUrl" class="q-mb-md">
                  <img :src="formData.logoUrl" alt="Company Logo" style="max-width: 200px; max-height: 200px; object-fit: contain;" />
                </div>
                <q-file
                  v-model="logoFile"
                  @update:model-value="uploadLogo"
                  accept=".jpg, .jpeg, .png, .gif"
                  max-file-size="5242880"
                  filled
                  label="Upload Logo"
                  class="text-body-small"
                >
                  <template v-slot:prepend>
                    <q-icon name="cloud_upload" />
                  </template>
                </q-file>
                <div class="text-caption text-grey q-mt-xs">
                  Maximum file size: 5MB. Supported formats: JPG, PNG, GIF
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="text-right q-mt-md">
          <q-btn no-caps unelevated label="Save Changes" type="submit" color="primary" :loading="loading" class="text-label-large" />
        </div>
      </q-form>
    </q-card-section>
  </q-card>
</template>

<style scoped>
.settings-company-card {
  border-radius: 0;
  box-shadow: none;
}
</style>

<script lang="ts" setup>
import { ref, onMounted, getCurrentInstance } from 'vue';
import { useQuasar } from 'quasar';
import { AxiosInstance } from 'axios';
import GInput from "../../../components/shared/form/GInput.vue";

// Get the current instance to access global properties
const instance = getCurrentInstance();
const $api = instance?.appContext.config.globalProperties.$api;
const $q = useQuasar();

// Type assertion for the global properties
declare module 'vue' {
  interface ComponentCustomProperties {
    $axios: AxiosInstance;
    $api: AxiosInstance;
  }
}

interface CompanyData {
  companyName: string;
  domainPrefix: string;
  businessType: string | null;
  industry: string | null;
  registrationNo: string;
  website: string;
  email: string;
  phone: string;
  tinNo: string;
  address: string;
  logoUrl: string;
}

const loading = ref(false);
const logoFile = ref<File | null>(null);

const formData = ref<CompanyData>({
  companyName: '',
  domainPrefix: '',
  businessType: null,
  industry: null,
  registrationNo: '',
  website: '',
  email: '',
  phone: '',
  tinNo: '',
  address: '',
  logoUrl: ''
});

const fetchCompanyData = async () => {
  try {
    loading.value = true;
    if (!$api) {
      console.error('$api is not available');
      return;
    }
    const response = await $api.get('/company');
    const companyData = response.data;

    // Map the response data to our form data, ensuring all fields are properly typed
    formData.value = {
      companyName: companyData.companyName || '',
      domainPrefix: companyData.domainPrefix || '',
      businessType: companyData.businessType || null,
      industry: companyData.industry || null,
      registrationNo: companyData.registrationNo || '',
      website: companyData.website || '',
      email: companyData.email || '',
      phone: companyData.phone || '',
      tinNo: companyData.tinNo || '',
      address: companyData.address || '',
      logoUrl: companyData.logoUrl || ''
    };
  } catch (error) {
    console.error('Failed to fetch company data:', error);
    $q.notify({
      color: 'negative',
      message: 'Failed to load company data',
      icon: 'report_problem'
    });
  } finally {
    loading.value = false;
  }
};

const onSubmit = async () => {
  try {
    loading.value = true;

    // Create a clean payload with only the fields that have values
    const payload: Partial<CompanyData> = {};

    // Only include fields that have values
    (Object.keys(formData.value) as Array<keyof CompanyData>).forEach(key => {
      const value = formData.value[key];
      if (value !== null && value !== '') {
        payload[key] = value;
      }
    });

    // Make the API call to update the company
    if (!$api) {
      console.error('$api is not available');
      return;
    }
    await $api.patch('/company', payload);

    // Show success message
    $q.notify({
      color: 'positive',
      message: 'Company information updated successfully',
      icon: 'check_circle',
      position: 'top',
      timeout: 3000
    });

    // Refresh the company data to ensure we have the latest from the server
    await fetchCompanyData();
  } catch (error) {
    console.error('Failed to update company:', error);
    $q.notify({
      color: 'negative',
      message: 'Failed to update company information',
      icon: 'report_problem',
      position: 'top',
      timeout: 3000
    });
  } finally {
    loading.value = false;
  }
};

const uploadLogo = async (file: File | null) => {
  if (!file) return;

  try {
    const uploadFormData = new FormData();
    uploadFormData.append('file', file);

    if (!$api) {
      console.error('$api is not available');
      return;
    }

    const response = await $api.post('/company/upload-logo', uploadFormData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    // Update the logo URL in our form data
    if (response.data.logoUrl) {
      formData.value.logoUrl = response.data.logoUrl;
      
      $q.notify({
        color: 'positive',
        message: 'Logo uploaded successfully',
        icon: 'check_circle',
        position: 'top',
        timeout: 3000
      });
    }
  } catch (error) {
    console.error('Failed to upload logo:', error);
    $q.notify({
      color: 'negative',
      message: 'Failed to upload logo',
      icon: 'report_problem',
      position: 'top',
      timeout: 3000
    });
  } finally {
    // Clear the file input
    logoFile.value = null;
  }
};

onMounted(() => {
  fetchCompanyData();
});
</script>
