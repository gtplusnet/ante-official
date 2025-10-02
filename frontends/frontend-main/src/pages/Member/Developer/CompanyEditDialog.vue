<template>
  <!-- Company Edit Dialog -->
  <q-dialog ref="dialog" @before-show="initForm" @hide="resetForm" :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)" class="md3-dialog">
    <q-card class="full-width dialog-card md3-card">
      <!-- MD3 Flat Header -->
      <div class="md3-header">
        <q-icon name="business" size="24px" class="md3-header-icon" />
        <span class="md3-header-title">{{ company ? 'Edit Company' : 'Add Company' }}</span>
        <q-space />
        <q-btn 
          flat 
          round 
          dense 
          icon="close" 
          v-close-popup
          class="md3-close-btn"
        />
      </div>
      <q-form ref="formRef" @submit.prevent="save" >
        <q-card-section class="md3-content">
          <div class="row">
            <div class="col-12">
              <div class="md3-field">
                <label class="md3-label">Company Name</label>
                <g-input 
                  class="md3-input" 
                  v-model="form.companyName" 
                  :rules="[(val: string) => !!val || 'Company name is required']" 
                  required 
                  outlined
                  dense
                />
              </div>
            </div>
            <div class="col-12 col-md-6">
              <div class="md3-field">
                <label class="md3-label">Company Code</label>
                <g-input 
                  class="md3-input" 
                  v-model="form.domainPrefix" 
                  :rules="[(val: string) => !!val || 'Company code is required']" 
                  required 
                  outlined
                  dense
                />
              </div>
            </div>
            <div class="col-12 col-md-6">
              <div class="md3-field">
                <label class="md3-label">Business Type</label>
                <g-input 
                  class="md3-input" 
                  v-model="form.businessType" 
                  type="select" 
                  api-url="/select-options/business-types" 
                  :null-option="'Select Business Type'" 
                  :rules="[(val: string | null) => !!val || 'Business type is required']" 
                  required 
                  outlined
                  dense
                />
              </div>
            </div>
            <div class="col-12 col-md-6">
              <div class="md3-field">
                <label class="md3-label">Industry</label>
                <g-input 
                  class="md3-input" 
                  v-model="form.industry" 
                  type="select" 
                  api-url="/select-options/industries" 
                  :null-option="'Select Industry'" 
                  :rules="[(val: string | null) => !!val || 'Industry is required']" 
                  required 
                  outlined
                  dense
                />
              </div>
            </div>
            <div class="col-12 col-md-6">
              <div class="md3-field">
                <label class="md3-label">Phone</label>
                <g-input 
                  class="md3-input" 
                  v-model="form.phone" 
                  outlined
                  dense
                />
              </div>
            </div>
          </div>

          <!-- Module Access Section -->
          <div class="md3-section">
            <div class="md3-section-title">
              Module Access
            </div>
            <div class="text-caption text-grey-7 q-mb-md q-px-xs">
              Select which modules are enabled for this company
            </div>
            <div class="row q-px-xs">
              <div v-for="module in navigationStore.toggleableModules" :key="module.route" class="col-12 col-sm-6 col-md-4">
                <q-checkbox
                  :model-value="form.enabledModules.includes(module.route)"
                  @update:model-value="toggleModule(module.route, $event)"
                  dense
                  color="primary"
                  class="md3-checkbox"
                >
                  <template v-slot:default>
                    <div class="flex items-center">
                      <q-icon :name="module.icon" size="18px" class="q-mr-xs text-grey-7" />
                      <span class="text-body2">{{ module.title }}</span>
                    </div>
                  </template>
                </q-checkbox>
              </div>
            </div>
          </div>

          <!-- Initial Admin Account Section (only for new companies) -->
          <div v-if="!company" class="md3-section">
            <div class="md3-section-title">
              Initial Admin Account
            </div>
            <div class="row">
              <div class="col-12 col-md-6">
                <div class="md3-field">
                  <label class="md3-label">Username</label>
                  <g-input 
                    class="md3-input" 
                    v-model="userForm.username" 
                    :rules="[!company ? (val: string) => !!val || 'Username is required' : () => true]" 
                    required 
                    outlined
                    dense
                  />
                </div>
              </div>
              <div class="col-12 col-md-6">
                <div class="md3-field">
                  <label class="md3-label">Email</label>
                  <g-input 
                    class="md3-input" 
                    v-model="userForm.email" 
                    type="email" 
                    :rules="[!company ? (val: string) => !!val || 'Email is required' : () => true, (val: string) => /.+@.+\..+/.test(val) || 'Email must be valid']" 
                    required 
                    outlined
                    dense
                  />
                </div>
              </div>
              <div class="col-12 col-md-6">
                <div class="md3-field">
                  <label class="md3-label">Password</label>
                  <g-input 
                    class="md3-input" 
                    v-model="userForm.password" 
                    type="password" 
                    :rules="[!company ? (val: string) => !!val || 'Password is required' : () => true, (val: string) => val.length >= 8 || 'Password must be at least 8 characters']" 
                    required 
                    outlined
                    dense
                  />
                </div>
              </div>
              <div class="col-12 col-md-6">
                <div class="md3-field">
                  <label class="md3-label">Confirm Password</label>
                  <g-input 
                    class="md3-input" 
                    v-model="userForm.confirmPassword" 
                    type="password" 
                    :rules="[!company ? (val: string) => !!val || 'Please confirm password' : () => true, (val: string) => val === userForm.password || 'Passwords must match']" 
                    required 
                    outlined
                    dense
                  />
                </div>
              </div>
              <div class="col-12 col-md-6">
                <div class="md3-field">
                  <label class="md3-label">First Name</label>
                  <g-input 
                    class="md3-input" 
                    v-model="userForm.firstName" 
                    :rules="[!company ? (val: string) => !!val || 'First name is required' : () => true]" 
                    required 
                    outlined
                    dense
                  />
                </div>
              </div>
              <div class="col-12 col-md-6">
                <div class="md3-field">
                  <label class="md3-label">Last Name</label>
                  <g-input 
                    class="md3-input" 
                    v-model="userForm.lastName" 
                    :rules="[!company ? (val: string) => !!val || 'Last name is required' : () => true]" 
                    required 
                    outlined
                    dense
                  />
                </div>
              </div>
              <div class="col-12">
                <div class="md3-field">
                  <q-banner class="md3-banner">
                    <template v-slot:avatar>
                      <q-icon name="info" color="primary" />
                    </template>
                    This user will have full administrative privileges for the company.
                  </q-banner>
                </div>
              </div>
            </div>
          </div>
        </q-card-section>
        <div class="md3-actions">
          <!-- Development only: Auto-fill button -->
          <q-btn 
            v-if="!company && isDevelopment"
            flat 
            label="Auto Fill (Dev)" 
            type="button" 
            @click="autoFillForm"
            class="md3-text-btn"
            style="margin-right: auto;"
          />
          <q-btn 
            flat 
            label="Close" 
            type="button" 
            v-close-popup 
            class="md3-text-btn"
          />
          <q-btn 
            unelevated 
            label="Save" 
            type="submit" 
            color="primary" 
            :loading="loading"
            :disable="loading"
            class="md3-filled-btn"
          />
        </div>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<style scoped lang="scss">
// Material Design 3 Dense Flat Dialog Styles
.md3-dialog {
  .dialog-card {
    max-width: 560px;
  }
}

.md3-card {
  border-radius: 16px !important;
  overflow: hidden;
  box-shadow: 0 2px 4px -1px rgba(0, 0, 0, 0.2),
              0 4px 5px 0 rgba(0, 0, 0, 0.14),
              0 1px 10px 0 rgba(0, 0, 0, 0.12) !important;
  display: flex;
  flex-direction: column;
  max-height: 85vh;
}

.md3-header {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: linear-gradient(0deg, rgba(103, 80, 164, 0.03), rgba(103, 80, 164, 0.03)), #FFFBFE;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  flex-shrink: 0;
  
  .md3-header-icon {
    color: #6750A4;
    margin-right: 12px;
  }
  
  .md3-header-title {
    font-size: 18px;
    font-weight: 500;
    line-height: 24px;
    color: #1C1B1F;
  }
  
  .md3-close-btn {
    color: #49454F;
    width: 32px;
    height: 32px;
    
    &:hover {
      background: rgba(0, 0, 0, 0.04);
    }
  }
}

.md3-content {
  padding: 16px 12px !important;
  background: #FFFBFE;
  overflow-y: auto;
  flex: 1;
  margin-bottom: 0;
  max-height: calc(100vh - 225px);
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: #F4F4F4;
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #CAC4D0;
    border-radius: 3px;
    
    &:hover {
      background: #938F99;
    }
  }
}

.md3-field {
  margin: 0 4px 12px;
  
  .md3-label {
    display: block;
    font-size: 11px;
    font-weight: 500;
    color: #49454F;
    margin-bottom: 4px;
    letter-spacing: 0.3px;
    text-transform: uppercase;
  }
  
  .md3-input {
    :deep(.q-field__control) {
      background: #FFFBFE;
      border-radius: 4px;
      height: 36px !important;
      
      &:before {
        border-color: #79747E;
      }
      
      &:hover:before {
        border-color: #1C1B1F;
      }
    }
    
    :deep(.q-field--focused .q-field__control) {
      &:before,
      &:after {
        border-color: #6750A4;
        border-width: 2px;
      }
    }
    
    :deep(.q-field__native) {
      color: #1C1B1F;
      font-size: 14px;
      padding-top: 0 !important;
      padding-bottom: 0 !important;
    }
    
    :deep(.q-field__marginal) {
      height: 36px !important;
    }
  }
}

.md3-section {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid #E7E0EC;
  
  .md3-section-title {
    font-size: 14px;
    font-weight: 500;
    color: #1C1B1F;
    margin-bottom: 12px;
    letter-spacing: 0.1px;
    padding: 0 4px;
  }
}

.md3-banner {
  background: linear-gradient(0deg, rgba(103, 80, 164, 0.05), rgba(103, 80, 164, 0.05)), #FFFBFE !important;
  border: 1px solid #E7E0EC;
  border-radius: 8px;
  color: #49454F;
  padding: 8px !important;
  font-size: 13px;
  
  :deep(.q-banner__avatar) {
    padding-right: 8px !important;
    min-width: 0 !important;
  }
  
  :deep(.q-icon) {
    color: #6750A4;
    font-size: 18px !important;
  }
  
  :deep(.q-banner__content) {
    padding: 0 !important;
  }
}

.md3-checkbox {
  margin-bottom: 8px;
  
  :deep(.q-checkbox__inner) {
    color: #6750A4;
  }
  
  :deep(.q-checkbox__label) {
    font-size: 13px;
    color: #1C1B1F;
  }
}

.md3-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 16px;
  border-top: 1px solid #E7E0EC;
  background: #FFFBFE;
  flex-shrink: 0;
  position: sticky;
  bottom: 0;
  z-index: 10;
  
  .md3-text-btn {
    color: #6750A4;
    font-weight: 500;
    font-size: 13px;
    letter-spacing: 0.1px;
    padding: 6px 16px;
    border-radius: 100px;
    min-height: 32px;
    
    &:hover {
      background: rgba(103, 80, 164, 0.08);
    }
  }
  
  .md3-filled-btn {
    background: #6750A4 !important;
    color: #FFFFFF;
    font-weight: 500;
    font-size: 13px;
    letter-spacing: 0.1px;
    padding: 6px 16px;
    border-radius: 100px;
    box-shadow: none !important;
    min-height: 32px;
    
    &:hover {
      background: #7965AF !important;
      box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.3),
                  0 1px 3px 1px rgba(0, 0, 0, 0.15) !important;
    }
  }
}

// Responsive adjustments
@media (max-width: 599px) {
  .md3-card {
    border-radius: 0 !important;
  }
  
  .md3-header {
    padding: 12px;
  }
  
  .md3-content {
    padding: 12px 8px !important;
  }
  
  .md3-field {
    margin: 0 2px 10px;
  }
}
</style>

<script lang="ts">
import { defineComponent, ref, watch, reactive, computed } from 'vue';
import { useQuasar } from 'quasar';
import { api } from 'src/boot/axios';
import GInput from "../../../components/shared/form/GInput.vue";
import { handleAxiosError } from "../../../utility/axios.error.handler";
import { AxiosError } from 'axios';
import type {  CompanyDataResponse  } from "@shared/response";
import { useNavigationStore } from "src/stores/navigation";

interface CompanyForm {
  companyName: string;
  domainPrefix: string;
  businessType: string | null;
  industry: string | null;
  phone: string;
  enabledModules: string[];
}

interface UserForm {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
}

export default defineComponent({
  name: 'CompanyEditDialog',
  components: {
    GInput
  },
  props: {
    modelValue: {
      type: Boolean,
      required: true
    },
    company: {
      type: Object as () => CompanyDataResponse | null,
      default: null
    }
  },
  emits: ['update:modelValue', 'close', 'saveDone'],
  setup(props, { emit }) {
    const $q = useQuasar();
    const navigationStore = useNavigationStore();
    const dialog = ref();
    const formRef = ref();
    const loading = ref(false);
    const form = reactive<CompanyForm>({
      companyName: '',
      domainPrefix: '',
      businessType: null,
      industry: null,
      phone: '',
      enabledModules: []
    });

    const userForm = reactive<UserForm>({
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      firstName: '',
      lastName: ''
    });

    const isDevelopment = computed(() => process.env.NODE_ENV === 'development');

    const initForm = () => {
      console.log('🔧 InitForm - Called with company:', props.company);
      // Get all toggleable module routes
      const allModules = navigationStore.toggleableModules.map((m: any) => m.route);
      console.log('🔧 InitForm - All toggleable modules:', allModules);
      
      if (props.company) {
        const disabledModules = props.company.disabledModules || [];
        console.log('🔧 InitForm - Disabled modules from company:', disabledModules);
        
        // Convert disabled modules to enabled modules
        const enabledModules = allModules.filter((route: string) => !disabledModules.includes(route));
        console.log('🔧 InitForm - Calculated enabled modules:', enabledModules);
        
        form.companyName = props.company.companyName || '';
        form.domainPrefix = props.company.domainPrefix || '';
        form.businessType = props.company.businessType || null;
        form.industry = props.company.industry || null;
        form.phone = props.company.phone || '';
        form.enabledModules = enabledModules;
        
        console.log('🔧 InitForm - Form after initialization:', {
          companyName: form.companyName,
          domainPrefix: form.domainPrefix,
          businessType: form.businessType,
          industry: form.industry,
          phone: form.phone,
          enabledModules: form.enabledModules
        });
      } else {
        // All modules enabled by default for new companies
        form.companyName = '';
        form.domainPrefix = '';
        form.businessType = null;
        form.industry = null;
        form.phone = '';
        form.enabledModules = allModules;
      }
    };

    const resetForm = () => {
      const allModules = navigationStore.toggleableModules.map((m: any) => m.route);
      form.companyName = '';
      form.domainPrefix = '';
      form.businessType = null;
      form.industry = null;
      form.phone = '';
      form.enabledModules = allModules;
      
      userForm.username = '';
      userForm.email = '';
      userForm.password = '';
      userForm.confirmPassword = '';
      userForm.firstName = '';
      userForm.lastName = '';
    };

    const autoFillForm = () => {
      // Generate random number for uniqueness
      const randomNum = Math.floor(Math.random() * 10000);
      
      // Available business types: SOLE_PROPRIETORSHIP, PARTNERSHIP, CORPORATION, OTHERS
      const businessTypes = ['SOLE_PROPRIETORSHIP', 'PARTNERSHIP', 'CORPORATION', 'OTHERS'];
      const randomBusinessType = businessTypes[Math.floor(Math.random() * businessTypes.length)];
      
      // Available industries: CONSTRUCTION, MANUFACTURING, RETAIL, SERVICES, OTHERS
      const industries = ['CONSTRUCTION', 'MANUFACTURING', 'RETAIL', 'SERVICES', 'OTHERS'];
      const randomIndustry = industries[Math.floor(Math.random() * industries.length)];
      
      // Auto-fill company information
      form.companyName = `Test Company ${randomNum}`;
      form.domainPrefix = `testcompany${randomNum}`;
      form.businessType = randomBusinessType;
      form.industry = randomIndustry;
      form.phone = `+1555${randomNum.toString().padStart(7, '0')}`;
      
      // Auto-fill user information
      userForm.username = `testadmin${randomNum}`;
      userForm.email = `admin${randomNum}@testcompany.com`;
      userForm.password = 'water123';
      userForm.confirmPassword = 'water123';
      userForm.firstName = 'Test';
      userForm.lastName = `Admin${randomNum}`;
      
      $q.notify({
        type: 'info',
        message: 'Form auto-filled with test data',
        timeout: 1000
      });
    };

    const toggleModule = (route: string, enabled: boolean) => {
      if (enabled) {
        // Add to enabled modules if not already there
        if (!form.enabledModules.includes(route)) {
          form.enabledModules.push(route);
        }
      } else {
        // Remove from enabled modules
        form.enabledModules = form.enabledModules.filter(r => r !== route);
      }
    };

    const save = async () => {
      try {
        loading.value = true;
        
        if (props.company) {
          // Update existing company
          // Convert enabled modules to disabled modules for storage
          const allModules = navigationStore.toggleableModules.map((m: any) => m.route);
          const disabledModules = allModules.filter((route: string) => !form.enabledModules.includes(route));
          
          console.log('🔧 Save - All toggleable modules:', allModules);
          console.log('🔧 Save - Enabled modules in form:', form.enabledModules);
          console.log('🔧 Save - Disabled modules to save:', disabledModules);
          
          const param = {
            companyName: form.companyName,
            domainPrefix: form.domainPrefix,
            businessType: form.businessType,
            industry: form.industry,
            phone: form.phone,
            disabledModules: disabledModules
          };
          
          console.log('🔧 Save - Sending PATCH request with param:', param);
          
          const response = await api.patch(`company/companies/${props.company.id}`, param);
          console.log('🔧 Save - Response from backend:', response.data);
          
          // Verify the update worked
          if (response.data?.disabledModules) {
            console.log('🔧 Save - Verified disabledModules in response:', response.data.disabledModules);
          } else {
            console.warn('🔧 Save - WARNING: No disabledModules in response!');
          }
          
          $q.notify({
            type: 'positive',
            message: 'Company updated successfully'
          });
        } else {
          // Create new company with initial user
          // Convert enabled modules to disabled modules for storage
          const allModules = navigationStore.toggleableModules.map((m: any) => m.route);
          const disabledModules = allModules.filter((route: string) => !form.enabledModules.includes(route));
          
          const param = {
            company: {
              companyName: form.companyName,
              domainPrefix: form.domainPrefix,
              businessType: form.businessType,
              industry: form.industry,
              phone: form.phone,
              disabledModules: disabledModules
            },
            user: {
              username: userForm.username,
              email: userForm.email,
              password: userForm.password,
              firstName: userForm.firstName,
              lastName: userForm.lastName
            }
          };
          
          await api.post('company/companies/with-initial-user', param);
          $q.notify({
            type: 'positive',
            message: 'Company and admin user created successfully'
          });
        }

        emit('saveDone');
        emit('update:modelValue', false);
      } catch (error) {
        handleAxiosError($q, error as AxiosError);
      } finally {
        loading.value = false;
      }
    };

    watch(() => props.modelValue, (newVal) => {
      console.log('🔧 Dialog modelValue changed:', newVal);
      if (newVal) {
        initForm();
      }
    });

    watch(() => props.company, (newCompany, oldCompany) => {
      console.log('🔧 Company prop changed from:', oldCompany, 'to:', newCompany);
      if (props.modelValue) {
        initForm();
      }
    }, { deep: true });

    // Auto-generate company code from company name (only for new companies)
    watch(() => form.companyName, (newName) => {
      // Only auto-generate when creating new company, not editing
      if (!props.company && newName) {
        // Convert to lowercase and remove special characters
        let code = newName.toLowerCase()
          // Replace spaces with empty string
          .replace(/\s+/g, '')
          // Remove all characters except lowercase letters and dots
          .replace(/[^a-z.]/g, '')
          // Remove consecutive dots
          .replace(/\.+/g, '.')
          // Remove leading and trailing dots
          .replace(/^\.+|\.+$/g, '');
        
        // Ensure minimum length of 3 characters
        if (code.length < 3 && code.length > 0) {
          // Pad with the first letter repeated if too short
          const firstLetter = code[0] || 'c';
          while (code.length < 3) {
            code += firstLetter;
          }
        }
        
        // Limit to reasonable length
        if (code.length > 20) {
          code = code.substring(0, 20);
        }
        
        form.domainPrefix = code;
      }
    });

    return {
      dialog,
      formRef,
      loading,
      form,
      userForm,
      isDevelopment,
      navigationStore,
      initForm,
      resetForm,
      autoFillForm,
      toggleModule,
      save
    };
  }
});
</script>
