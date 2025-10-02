<template>
  <q-dialog
    :model-value="open"
    @update:model-value="$emit('close')"
    persistent
    transition-show="slide-up"
    transition-hide="slide-down"
  >
    <q-card class="dialog-card">
      <q-bar class="bg-primary text-white" dark>
        <q-icon :name="mode === 'create' ? 'person_add' : 'edit'" size="sm" />
        <div class="q-ml-sm text-weight-medium">{{ mode === 'create' ? 'Create New User' : 'Edit User Details' }}</div>
        <q-space />
        <q-btn dense flat icon="close" v-close-popup>
          <q-tooltip>Close</q-tooltip>
        </q-btn>
      </q-bar>

      <q-card-section class="q-pa-none">
        <q-form @submit="onSubmit">
          <!-- Personal Information Section -->
          <div class="section-container">
            <div class="section-header">
              <q-icon name="badge" size="sm" class="q-mr-sm" />
              <span class="text-weight-medium">Personal Information</span>
            </div>
            <div class="q-pa-md">
              <div class="row q-col-gutter-md">
                <div class="col-12 col-md-6">
                  <label class="field-label">First Name <span class="text-red">*</span></label>
                  <q-input
                    v-model="form.firstName"
                    placeholder="Enter first name"
                    outlined
                    dense
                    :rules="[val => !!val || 'First name is required']"
                    class="q-mb-sm"
                  />
                </div>
                <div class="col-12 col-md-6">
                  <label class="field-label">Last Name <span class="text-red">*</span></label>
                  <q-input
                    v-model="form.lastName"
                    placeholder="Enter last name"
                    outlined
                    dense
                    :rules="[val => !!val || 'Last name is required']"
                    class="q-mb-sm"
                  />
                </div>
                <div class="col-12 col-md-6">
                  <label class="field-label">Middle Name</label>
                  <q-input
                    v-model="form.middleName"
                    placeholder="Enter middle name (optional)"
                    outlined
                    dense
                    class="q-mb-sm"
                  />
                </div>
                <div class="col-12 col-md-6">
                  <label class="field-label">Contact Number</label>
                  <q-input
                    v-model="form.contactNumber"
                    placeholder="Enter contact number"
                    outlined
                    dense
                    mask="(###) ###-####"
                    unmasked-value
                    class="q-mb-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- Account Information Section -->
          <div class="section-container">
            <div class="section-header">
              <q-icon name="account_circle" size="sm" class="q-mr-sm" />
              <span class="text-weight-medium">Account Information</span>
            </div>
            <div class="q-pa-md">
              <div class="row q-col-gutter-md">
                <div class="col-12 col-md-6">
                  <label class="field-label">Username <span class="text-red">*</span></label>
                  <q-input
                    v-model="form.username"
                    placeholder="Enter username"
                    outlined
                    dense
                    :rules="[val => !!val || 'Username is required']"
                    :disable="mode === 'edit'"
                    class="q-mb-sm"
                  >
                    <template v-slot:prepend>
                      <q-icon name="person" />
                    </template>
                  </q-input>
                </div>
                <div class="col-12 col-md-6">
                  <label class="field-label">Email Address <span class="text-red">*</span></label>
                  <q-input
                    v-model="form.email"
                    placeholder="Enter email address"
                    type="email"
                    outlined
                    dense
                    :rules="[
                      val => !!val || 'Email is required',
                      val => /.+@.+\..+/.test(val) || 'Email must be valid'
                    ]"
                    class="q-mb-sm"
                  >
                    <template v-slot:prepend>
                      <q-icon name="email" />
                    </template>
                  </q-input>
                </div>

                <div class="col-12">
                  <label class="field-label">Password <span class="text-red" v-if="mode === 'create'">*</span></label>
                  <q-input
                    v-model="form.password"
                    :placeholder="mode === 'create' ? 'Enter password' : 'Leave blank to keep current password'"
                    :type="showPassword ? 'text' : 'password'"
                    outlined
                    dense
                    :rules="mode === 'create' ? [
                      val => !!val || 'Password is required',
                      val => val.length >= 6 || 'Password must be at least 6 characters'
                    ] : [
                      val => !val || val.length >= 6 || 'Password must be at least 6 characters'
                    ]"
                    class="q-mb-sm"
                  >
                    <template v-slot:prepend>
                      <q-icon name="lock" />
                    </template>
                    <template v-slot:append>
                      <q-icon
                        :name="showPassword ? 'visibility_off' : 'visibility'"
                        class="cursor-pointer"
                        @click="showPassword = !showPassword"
                      />
                    </template>
                  </q-input>
                </div>
              </div>
            </div>
          </div>

          <!-- Organization Section -->
          <div class="section-container">
            <div class="section-header">
              <q-icon name="business" size="sm" class="q-mr-sm" />
              <span class="text-weight-medium">Organization Details</span>
            </div>
            <div class="q-pa-md">
              <div class="row q-col-gutter-md">
                <div class="col-12 col-md-6">
                  <label class="field-label">Company <span class="text-red">*</span></label>
                  <q-input
                    v-if="mode === 'edit'"
                    :model-value="getCompanyName()"
                    readonly
                    outlined
                    dense
                    class="q-mb-sm"
                  >
                    <template v-slot:prepend>
                      <q-icon name="domain" />
                    </template>
                  </q-input>
                  <q-select
                    v-else
                    v-model="form.companyId"
                    placeholder="Select company"
                    outlined
                    dense
                    :options="filteredCompanyOptions"
                    option-value="id"
                    option-label="companyName"
                    emit-value
                    map-options
                    use-input
                    input-debounce="300"
                    @filter="filterCompanies"
                    clearable
                    :rules="[val => !!val || 'Company is required']"
                    class="q-mb-sm"
                  >
                    <template v-slot:prepend>
                      <q-icon name="domain" />
                    </template>
                    <template v-slot:no-option>
                      <q-item>
                        <q-item-section class="text-grey">
                          No results
                        </q-item-section>
                      </q-item>
                    </template>
                  </q-select>
                </div>
                <div class="col-12 col-md-6">
                  <label class="field-label">Role <span class="text-red">*</span></label>
                  <q-select
                    v-model="form.roleId"
                    placeholder="Select role"
                    outlined
                    dense
                    :options="filteredRoleOptions"
                    option-value="id"
                    option-label="name"
                    emit-value
                    map-options
                    use-input
                    input-debounce="300"
                    @filter="filterRoles"
                    clearable
                    :rules="[val => !!val || 'Role is required']"
                    class="q-mb-sm"
                  >
                    <template v-slot:prepend>
                      <q-icon name="work" />
                    </template>
                    <template v-slot:no-option>
                      <q-item>
                        <q-item-section class="text-grey">
                          No results
                        </q-item-section>
                      </q-item>
                    </template>
                  </q-select>
                </div>
              </div>
            </div>
          </div>

          <!-- Access Control Section -->
          <div class="section-container">
            <div class="section-header">
              <q-icon name="security" size="sm" class="q-mr-sm" />
              <span class="text-weight-medium">Access Control</span>
            </div>
            <div class="q-pa-md">
              <q-item class="q-pa-none">
                <q-item-section avatar>
                  <q-toggle
                    v-model="form.isDeveloper"
                    color="primary"
                    size="lg"
                  />
                </q-item-section>
                <q-item-section>
                  <q-item-label class="text-weight-medium">Developer Access</q-item-label>
                  <q-item-label caption class="text-grey-7">
                    Enable this to grant developer-level permissions to this user
                  </q-item-label>
                </q-item-section>
              </q-item>
            </div>
          </div>

          <!-- Action Buttons -->
          <q-separator />
          <div class="q-pa-md bg-grey-1">
            <div class="flex justify-end q-gutter-sm">
              <q-btn
                label="Cancel"
                color="grey-8"
                flat
                padding="sm lg"
                @click="$emit('close')"
              />
              <q-btn
                :label="mode === 'create' ? 'Create User' : 'Save Changes'"
                color="primary"
                type="submit"
                padding="sm lg"
                :loading="loading"
                :disable="loading"
              />
            </div>
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script lang="ts">
import { defineComponent, ref, reactive, onMounted, watch, PropType } from 'vue';
import { useQuasar } from 'quasar';
import { api } from 'src/boot/axios';

export default defineComponent({
  name: 'DeveloperUserManagementDialog',
  props: {
    open: {
      type: Boolean,
      required: true,
    },
    mode: {
      type: String as PropType<'create' | 'edit'>,
      required: true,
    },
    user: {
      type: Object as PropType<any>,
      default: null,
    },
  },
  emits: ['close', 'success'],
  setup(props, { emit }) {
    const $q = useQuasar();
    const loading = ref(false);
    const showPassword = ref(false);
    const companyOptions = ref<any[]>([]);
    const roleOptions = ref<any[]>([]);
    const filteredCompanyOptions = ref<any[]>([]);
    const filteredRoleOptions = ref<any[]>([]);

    const form = reactive({
      username: '',
      email: '',
      firstName: '',
      lastName: '',
      middleName: '',
      contactNumber: '',
      companyId: null as number | null,
      roleId: null as number | null,
      password: '',
      isDeveloper: true,
    });

    const loadCompanies = async () => {
      try {
        const { data } = await api.get('/developer-account/companies');
        // API returns raw array, not wrapped in success/data
        companyOptions.value = data || [];
        filteredCompanyOptions.value = companyOptions.value;
      } catch (error) {
        console.error('Failed to load companies', error);
        $q.notify({
          type: 'negative',
          message: 'Failed to load companies',
        });
      }
    };

    const loadRoles = async (companyId?: number) => {
      try {
        roleOptions.value = [];
        filteredRoleOptions.value = [];
        form.roleId = null;
        
        if (!companyId && props.mode === 'create') {
          // Don't load roles if no company selected in create mode
          return;
        }
        
        const url = companyId 
          ? `/developer-account/roles?companyId=${companyId}`
          : '/developer-account/roles';
          
        const { data } = await api.get(url);
        // API returns raw array, not wrapped in success/data
        roleOptions.value = data || [];
        filteredRoleOptions.value = roleOptions.value;
      } catch (error) {
        console.error('Failed to load roles', error);
        $q.notify({
          type: 'negative',
          message: 'Failed to load roles',
        });
      }
    };

    const filterCompanies = (val: string, update: any) => {
      if (val === '') {
        update(() => {
          filteredCompanyOptions.value = companyOptions.value;
        });
        return;
      }

      update(() => {
        const needle = val.toLowerCase();
        filteredCompanyOptions.value = companyOptions.value.filter(
          company => company.companyName.toLowerCase().indexOf(needle) > -1
        );
      });
    };

    const filterRoles = (val: string, update: any) => {
      if (val === '') {
        update(() => {
          filteredRoleOptions.value = roleOptions.value;
        });
        return;
      }

      update(() => {
        const needle = val.toLowerCase();
        filteredRoleOptions.value = roleOptions.value.filter(
          role => role.name.toLowerCase().indexOf(needle) > -1
        );
      });
    };

    const onSubmit = async () => {
      loading.value = true;
      try {
        const payload: any = {
          username: form.username,
          email: form.email,
          firstName: form.firstName,
          lastName: form.lastName,
          middleName: form.middleName,
          contactNumber: form.contactNumber,
          companyId: form.companyId,
          roleId: form.roleId,
          isDeveloper: form.isDeveloper,
        };

        if (props.mode === 'edit') {
          payload.id = props.user?.id;
          // Don't send password on updates unless it's provided
          if (form.password && form.password.trim() !== '') {
            payload.password = form.password;
          }
        } else {
          // Password is required for create
          payload.password = form.password;
        }

        const endpoint = '/developer-account';
        const method = props.mode === 'create' ? 'post' : 'patch';
        
        const { data } = await api[method](endpoint, payload);
        
        // API returns raw data, not wrapped in success/data
        if (data) {
          $q.notify({
            type: 'positive',
            message: `User ${props.mode === 'create' ? 'created' : 'updated'} successfully`,
          });
          emit('success');
        }
      } catch (error: any) {
        $q.notify({
          type: 'negative',
          message: error.response?.data?.message || 'Failed to save user',
        });
      } finally {
        loading.value = false;
      }
    };

    const getCompanyName = () => {
      if (!form.companyId) return '';
      const company = companyOptions.value.find(c => c.id === form.companyId);
      return company?.companyName || '';
    };

    // Watch for company changes to reload roles
    watch(() => form.companyId, async (newCompanyId) => {
      if (newCompanyId) {
        await loadRoles(newCompanyId);
      } else {
        roleOptions.value = [];
        filteredRoleOptions.value = [];
        form.roleId = null;
      }
    });

    onMounted(async () => {
      await loadCompanies();
      
      if (props.mode === 'create') {
        // Clear form for create mode
        form.username = '';
        form.email = '';
        form.firstName = '';
        form.lastName = '';
        form.middleName = '';
        form.contactNumber = '';
        form.companyId = null;
        form.roleId = null;
        form.password = '';
        form.isDeveloper = true;
      } else if (props.mode === 'edit' && props.user) {
        form.username = props.user.username;
        form.email = props.user.email;
        form.firstName = props.user.firstName;
        form.lastName = props.user.lastName;
        form.middleName = props.user.middleName || '';
        form.contactNumber = props.user.contactNumber || '';
        form.companyId = props.user.company?.id || props.user.companyId;
        form.isDeveloper = props.user.isDeveloper;
        form.password = ''; // Clear password field for edits
        
        // Load roles for the user's company
        if (form.companyId) {
          await loadRoles(form.companyId);
          // Set role after roles are loaded
          form.roleId = props.user.role?.id || props.user.roleId || props.user.roleID;
        }
      }
    });

    return {
      loading,
      showPassword,
      form,
      companyOptions,
      roleOptions,
      filteredCompanyOptions,
      filteredRoleOptions,
      filterCompanies,
      filterRoles,
      getCompanyName,
      onSubmit,
    };
  },
});
</script>

<style lang="scss" scoped>
.dialog-card {
  width: 100%;
  max-width: 900px;
  margin: auto;
  height: 90vh;
  display: flex;
  flex-direction: column;
  
  .q-card-section {
    flex: 1;
    overflow-y: auto;
  }
}

.section-container {
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 8px;
  margin-bottom: 16px;
  overflow: hidden;
  
  &:last-child {
    margin-bottom: 0;
  }
}

.section-header {
  background-color: rgba(0, 0, 0, 0.03);
  padding: 12px 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  font-size: 14px;
  color: rgba(0, 0, 0, 0.87);
}

.field-label {
  display: block;
  font-size: 12px;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.7);
  margin-bottom: 4px;
  
  .text-red {
    color: #f44336;
  }
}

:deep(.q-field__control) {
  height: 40px;
}

:deep(.q-field__native) {
  padding: 0 12px;
}

:deep(.q-field--outlined .q-field__control:before) {
  border-color: rgba(0, 0, 0, 0.12);
}

:deep(.q-field--outlined:hover .q-field__control:before) {
  border-color: rgba(0, 0, 0, 0.3);
}
</style>