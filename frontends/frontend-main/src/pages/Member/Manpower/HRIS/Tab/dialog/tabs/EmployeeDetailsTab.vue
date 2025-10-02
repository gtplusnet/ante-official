<template>
  <div class="employee-details-tab compact relative-position">
    <!-- Initial Loading Overlay -->
    <q-inner-loading :showing="isInitialLoading">
      <q-spinner-dots size="50px" color="primary" />
      <div class="q-mt-md text-body2 text-grey-7">Loading employee details...</div>
    </q-inner-loading>

    <!-- Personal & Contact Information Section -->
    <div class="md3-surface">
      <h3 class="md3-title-medium">
        <q-icon name="person" class="q-mr-xs" color="primary" size="20px" />
        Personal & Contact Information
      </h3>
      <div class="md3-body-small text-grey-7 q-mb-sm">
        Employee personal details and contact information.
      </div>

      <div class="row q-col-gutter-sm">
        <div class="col-12 col-sm-6 col-md-3">
          <label class="md3-field-label">Employee Code</label>
          <q-input
            v-model="employeeCodes"
            outlined
            dense
            class="md3-input"
          />
        </div>
        <div class="col-12 col-sm-6 col-md-3">
          <label class="md3-field-label">Last Name</label>
          <q-input
            v-model="accountDetails.lastName"
            outlined
            dense
            class="md3-input"
          />
        </div>
        <div class="col-12 col-sm-6 col-md-3">
          <label class="md3-field-label">First Name</label>
          <q-input
            v-model="accountDetails.firstName"
            outlined
            dense
            class="md3-input"
          />
        </div>
        <div class="col-12 col-sm-6 col-md-3">
          <label class="md3-field-label">Middle Name <span class="optional">(Optional)</span></label>
          <q-input
            v-model="accountDetails.middleName"
            outlined
            dense
            class="md3-input"
          />
        </div>
        <div class="col-12 col-sm-6 col-md-4">
          <label class="md3-field-label">Username</label>
          <q-input
            v-model="accountDetails.username"
            outlined
            dense
            class="md3-input"
          >
            <template v-slot:prepend>
              <q-icon name="account_circle" color="primary" />
            </template>
          </q-input>
        </div>
        <div class="col-12 col-sm-6 col-md-4">
          <label class="md3-field-label">Email Address</label>
          <q-input
            v-model="accountDetails.email"
            outlined
            dense
            class="md3-input"
            type="email"
          >
            <template v-slot:prepend>
              <q-icon name="email" color="primary" />
            </template>
          </q-input>
        </div>
        <div class="col-12 col-sm-6 col-md-4">
          <label class="md3-field-label">Contact Number</label>
          <q-input
            v-model="accountDetails.contactNumber"
            outlined
            dense
            class="md3-input"
          >
            <template v-slot:prepend>
              <q-icon name="phone" color="primary" />
            </template>
          </q-input>
        </div>
        <div class="col-12 col-sm-6 col-md-4">
          <label class="md3-field-label">Birthdate</label>
          <q-input
            v-model="accountDetails.dateOfBirth"
            outlined
            dense
            class="md3-input"
            type="date"
          >
            <template v-slot:prepend>
              <q-icon name="cake" color="primary" />
            </template>
          </q-input>
        </div>
        <div class="col-12 col-sm-6 col-md-4">
          <label class="md3-field-label">Civil Status</label>
          <q-select
            v-model="accountDetails.civilStatus"
            :options="civilStatusOptions"
            outlined
            dense
            emit-value
            map-options
            class="md3-select"
          >
            <template v-slot:prepend>
              <q-icon name="favorite" color="primary" />
            </template>
          </q-select>
        </div>
        <div class="col-12 col-sm-6 col-md-4">
          <label class="md3-field-label">Sex</label>
          <q-select
            v-model="accountDetails.gender"
            :options="sexOptions"
            outlined
            dense
            emit-value
            map-options
            class="md3-select"
          >
            <template v-slot:prepend>
              <q-icon name="wc" color="primary" />
            </template>
          </q-select>
        </div>
      </div>
    </div>

    <!-- Work Assignment Section -->
    <div class="md3-surface">
      <h3 class="md3-title-medium">
        <q-icon name="business_center" class="q-mr-xs" color="primary" size="20px" />
        Work Assignment
      </h3>
      <div class="md3-body-small text-grey-7 q-mb-sm">
        Schedule and payroll group assignments for the employee's work configuration.
      </div>

      <div class="row q-col-gutter-sm">
        <div class="col-12 col-sm-6">
          <label class="md3-field-label">Schedule Code</label>
          <div class="input-with-extension">
            <q-select
              v-model="scheduleId"
              :options="scheduleOption"
              :loading="isScheduleLoading"
              outlined
              dense
              emit-value
              map-options
              class="md3-select"
            >
              <template v-slot:prepend>
                <q-icon name="schedule" color="primary" />
              </template>
            </q-select>
            <GButton
              variant="outline"
              class="text-dark"
              icon="add"
              @click="openNewScheduleCode"
            >
              <q-tooltip>Add New Schedule</q-tooltip>
            </GButton>
          </div>
        </div>
        <div class="col-12 col-sm-6">
          <label class="md3-field-label">Payroll Group Code</label>
          <div class="input-with-extension">
            <q-select
              v-model="payrollGroupId"
              :options="payrolGroupCode"
              :loading="isPayrollLoading"
              outlined
              dense
              emit-value
              map-options
              class="md3-select"
            >
              <template v-slot:prepend>
                <q-icon name="account_balance_wallet" color="primary" />
              </template>
            </q-select>
            <GButton
              variant="outline"
              class="text-dark"
              icon="add"
              @click="openPayrollGroupCodes"
            >
              <q-tooltip>Add New Payroll Group</q-tooltip>
            </GButton>
          </div>
        </div>
      </div>
    </div>

    <!-- Address Information Section -->
    <div class="md3-surface">
      <h3 class="md3-title-medium">
        <q-icon name="location_on" class="q-mr-xs" color="primary" size="20px" />
        Address Information
      </h3>
      <div class="md3-body-small text-grey-7 q-mb-sm">
        Employee's residential address information.
      </div>

      <div class="row q-col-gutter-sm">
        <div class="col-12 col-sm-6">
          <label class="md3-field-label">Street</label>
          <q-input
            v-model="accountDetails.street"
            outlined
            dense
            class="md3-input"
            placeholder="Street address"
          />
        </div>
        <div class="col-12 col-sm-6">
          <label class="md3-field-label">City / Town</label>
          <q-input
            v-model="accountDetails.city"
            outlined
            dense
            class="md3-input"
            placeholder="City or town"
          />
        </div>
        <div class="col-12 col-sm-6 col-md-4">
          <label class="md3-field-label">State / Province</label>
          <q-input
            v-model="accountDetails.stateProvince"
            outlined
            dense
            class="md3-input"
            placeholder="State or province"
          />
        </div>
        <div class="col-12 col-sm-6 col-md-4">
          <label class="md3-field-label">Postal Code</label>
          <q-input
            v-model="accountDetails.postalCode"
            outlined
            dense
            class="md3-input"
            placeholder="Postal code"
          />
        </div>
        <div class="col-12 col-sm-6 col-md-4">
          <label class="md3-field-label">ZIP Code</label>
          <q-input
            v-model="accountDetails.zipCode"
            outlined
            dense
            class="md3-input"
            placeholder="ZIP code"
          />
        </div>
        <div class="col-12">
          <label class="md3-field-label">Country</label>
          <q-input
            v-model="accountDetails.country"
            outlined
            dense
            class="md3-input"
            placeholder="Country"
          >
            <template v-slot:prepend>
              <q-icon name="public" color="primary" />
            </template>
          </q-input>
        </div>
      </div>
    </div>

    <!-- Dialogs -->
    <AddEditScheduleDialog
      v-model="openScheduleDialog"
      @close="openScheduleDialog = false"
      @saveDone="onScheduleSaved"
    />
    <AddEditPayrollGroupDialog
      v-model="openAddPayrollGroupDialog"
      @close="openAddPayrollGroupDialog = false"
      @saveDone="onPayrolGrouSaved"
    />
  </div>
</template>

<style scoped lang="scss" src="../EditCreateEmployee.scss"></style>

<script>
import AddEditPayrollGroupDialog from '../../../../dialogs/configuration/ManpowerAddEditPayrollGroupDialog.vue';
import AddEditScheduleDialog from '../../../../dialogs/configuration/ManpowerAddEditScheduleDialog.vue';
import { api } from 'src/boot/axios';
import { useSupabaseSchedules } from 'src/composables/supabase/useSupabaseSchedules';
import { useSupabasePayrollGroups } from 'src/composables/supabase/useSupabasePayrollGroups';
import { useAuthStore } from 'src/stores/auth';
import GButton from 'src/components/shared/buttons/GButton.vue';

export default {
  name: 'EmployeeDetailsTab',
  setup() {
    // Initialize Supabase composables
    const schedulesComposable = useSupabaseSchedules();
    const payrollGroupsComposable = useSupabasePayrollGroups();
    const authStore = useAuthStore();
    
    return {
      schedulesComposable,
      payrollGroupsComposable,
      authStore
    };
  },
  components: {
    AddEditScheduleDialog,
    AddEditPayrollGroupDialog,
    GButton,
  },
  props: {
    employeeData: {
      type: Object,
      default: () => ({}),
    },
  },
  emits: ['cancel', 'update'],
  data: () => ({
    openScheduleDialog: false,
    openAddPayrollGroupDialog: false,
    isInitialLoading: false,
    isScheduleLoading: false,
    isPayrollLoading: false,
    scheduleOption: [],
    payrolGroupCode: [],
    employeeCodes: '',
    accountDetails: {
      firstName: '',
      middleName: '',
      lastName: '',
      contactNumber: '',
      email: '',
      username: '',
      password: '',
      roleID: '',
      dateOfBirth: null,
      gender: '',
      civilStatus: '',
      street: '',
      city: '',
      stateProvince: '',
      postalCode: '',
      zipCode: '',
      country: '',
    },
    civilStatusOptions: [
      { label: 'Single', value: 'Single' },
      { label: 'Married', value: 'Married' },
      { label: 'Separated', value: 'Separated' },
      { label: 'Widowed', value: 'Widowed' },
      { label: 'Divorced', value: 'Divorced' },
    ],
    sexOptions: [
      { label: 'Male', value: 'Male' },
      { label: 'Female', value: 'Female' },
    ],
    payrollGroupId: '',
    scheduleId: '',
  }),
  async mounted() {
    this.isInitialLoading = true;
    try {
      await Promise.all([
        this.fetchScheduleCode(),
        this.fetchPayrolGroupCode()
      ]);
      this.populateFormData();
    } catch (error) {
      console.error('Error during initial data loading:', error);
    } finally {
      this.isInitialLoading = false;
    }
  },
  watch: {
    employeeData: {
      handler(newVal) {
        if (newVal) {
          this.populateFormData();
        }
      },
      deep: true,
      immediate: true,
    },
  },
  methods: {
    formatDateForInput(dateValue) {
      if (!dateValue) return null;
      try {
        // If it's already in YYYY-MM-DD format, return as is
        if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
          return dateValue;
        }
        // Convert ISO date string to YYYY-MM-DD format
        const date = new Date(dateValue);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      } catch (error) {
        console.error('Error formatting date:', error);
        return null;
      }
    },
    populateFormData() {
      if (this.employeeData && this.employeeData.data) {
        const { accountDetails } = this.employeeData.data;

        this.employeeCodes = this.employeeData.data.employeeCode;
        this.accountDetails = {
          firstName: accountDetails.firstName,
          lastName: accountDetails.lastName,
          middleName: accountDetails.middleName,
          contactNumber: accountDetails.contactNumber,
          email: accountDetails.email,
          username: accountDetails.username,
          password: '',
          roleID: accountDetails.roleId || accountDetails.roleID || '',
          parentAccountId: accountDetails.parentAccountId || '',
          dateOfBirth: this.formatDateForInput(accountDetails.dateOfBirth),
          gender: accountDetails.gender || '',
          civilStatus: accountDetails.civilStatus || '',
          street: accountDetails.street || '',
          city: accountDetails.city || '',
          stateProvince: accountDetails.stateProvince || '',
          postalCode: accountDetails.postalCode || '',
          zipCode: accountDetails.zipCode || '',
          country: accountDetails.country || '',
        };

        this.payrollGroupId = this.employeeData.data.payrollGroup.id;
        this.scheduleId = this.employeeData.data.schedule.id;
      }
    },
    async updateEmployeeDetails() {
      this.$q.loading.show({
        message: 'Updating employee details...',
        spinnerColor: 'primary'
      });

      // Build accountDetails conditionally
      const accountDetailsToSend = {
        firstName: this.accountDetails.firstName,
        lastName: this.accountDetails.lastName,
        middleName: this.accountDetails.middleName,
        contactNumber: this.accountDetails.contactNumber,
        email: this.accountDetails.email,
        username: this.accountDetails.username,
        roleID: this.accountDetails.roleID,
        dateOfBirth: this.accountDetails.dateOfBirth,
        gender: this.accountDetails.gender,
        civilStatus: this.accountDetails.civilStatus,
        street: this.accountDetails.street,
        city: this.accountDetails.city,
        stateProvince: this.accountDetails.stateProvince,
        postalCode: this.accountDetails.postalCode,
        zipCode: this.accountDetails.zipCode,
        country: this.accountDetails.country,
      };

      // Check if the user has a Level 0 role
      const userRole = this.employeeData?.data?.accountDetails?.role;
      const isLevel0Role = userRole && userRole.level === 0;

      // Only include parentAccountId if:
      // 1. It has a real value (not empty string)
      // 2. The user does NOT have a Level 0 role
      if (this.accountDetails.parentAccountId &&
          this.accountDetails.parentAccountId.trim() !== '' &&
          !isLevel0Role) {
        accountDetailsToSend.parentAccountId = this.accountDetails.parentAccountId;
      }

      const params = {
        accountId: `${this.employeeData.data.accountDetails.id}`,
        employeeCode: this.employeeCodes,
        accountDetails: accountDetailsToSend,
        payrollGroupId: this.payrollGroupId,
        scheduleId: this.scheduleId,
        branchId: this.employeeData.data.branch.id,
      };

      return api
        .patch('/hris/employee/update', params)
        .then(() => {
          console.log('[DEBUG] EmployeeDetailsTab: Emitting update event after successful API call');
          this.$emit('update');
          this.$q.loading.hide();
        })
        .catch((error) => {
          console.error('Error updating employee details:', error);
          this.$q.loading.hide();
          this.$q.notify({
            type: 'negative',
            message: error.response?.data?.message || 'Failed to update employee details',
          });
          throw error; // Re-throw to allow parent to catch
        });
    },
    onScheduleSaved() {
      this.scheduleOption = [];
      this.fetchScheduleCode();
      this.openScheduleDialog = false;
    },
    onPayrolGrouSaved() {
      this.payrolGroupCode = [];
      this.fetchPayrolGroupCode();
      this.openAddPayrollGroupDialog = false;
    },
    openNewScheduleCode() {
      this.openScheduleDialog = true;
    },
    openPayrollGroupCodes() {
      this.openAddPayrollGroupDialog = true;
    },
    async fetchScheduleCode() {
      this.isScheduleLoading = true;
      try {
        const companyId = this.authStore.getAccountInformation?.companyId || this.authStore.getAccountInformation?.company?.id;
        if (companyId) {
          await this.schedulesComposable.fetchSchedulesByCompany(companyId);
        } else {
          await this.schedulesComposable.fetchSchedules();
        }
        this.scheduleOption = this.schedulesComposable.scheduleOptions.value;
      } catch (error) {
        console.error('Error fetching schedule codes:', error);
      } finally {
        this.isScheduleLoading = false;
      }
    },
    async fetchPayrolGroupCode() {
      this.isPayrollLoading = true;
      try {
        const companyId = this.authStore.getAccountInformation?.companyId || this.authStore.getAccountInformation?.company?.id;
        if (companyId) {
          await this.payrollGroupsComposable.fetchPayrollGroupsByCompany(companyId);
        } else {
          await this.payrollGroupsComposable.fetchPayrollGroups();
        }
        this.payrolGroupCode = this.payrollGroupsComposable.payrollGroupOptions.value;
      } catch (error) {
        console.error('Error fetching payroll groups:', error);
      } finally {
        this.isPayrollLoading = false;
      }
    },
  },
};
</script>
