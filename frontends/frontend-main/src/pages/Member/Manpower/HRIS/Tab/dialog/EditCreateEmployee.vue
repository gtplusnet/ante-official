<template>
  <q-dialog ref="dialog" persistent @hide="onDialogHide" @before-show="onBeforeShow" data-testid="edit-employee-dialog">
    <TemplateDialog minWidth="1000px" scrollable="false" no-padding="true">
      <template #DialogTitle>
        Edit Employee
      </template>
      <template #DialogContent>
        <!-- Loading state -->
        <div v-if="isLoadingEmployee" class="q-pa-xl text-center">
          <q-spinner size="50px" color="primary" />
          <div class="q-mt-md">Loading employee data...</div>
        </div>
        
        <!-- Main content -->
        <div v-else class="dialog-layout">
          <!-- Tab Navigation -->
          <div class="tab-header">
            <div class="page-tabs justify-center">
              <div v-for="tab in tabList" :class="tab.key === activeTab ? 'active' : ''" :key="tab.key" @click="activeTab = tab.key" class="tab" :data-testid="`tab-${tab.key}`">
                {{ tab.name }}
              </div>
            </div>
          </div>

          <!-- Tab Content Container -->
          <div class="tab-content-container">
            <!-- Employee Details Tab -->
            <employee-details-tab ref="employeeDetailsTab" v-show="activeTab === 'employee_Details'" :employee-data="localEmployeeData" @cancel="hideDialog" @update="onUpdate" />

            <!-- Contract Details Tab -->
            <contract-details-tab v-show="activeTab === 'contract_Datails'" :employee-data="localEmployeeData" @cancel="hideDialog" @update="onUpdate" />

            <!-- Job Details Tab -->
            <job-details-tab ref="jobDetailsTab" v-show="activeTab === 'job_Details'" :employee-data="localEmployeeData" @cancel="hideDialog" @update="onUpdate" @update-complete="isUpdating = false" />

            <!-- Government Tab -->
            <government-tab ref="governmentTab" v-show="activeTab === 'goverment'" :employee-data="localEmployeeData" @cancel="hideDialog" @update="onUpdate" />

            <!-- Shift Tab -->
            <shift-tab v-show="activeTab === 'shift'" :employee-data="localEmployeeData" @cancel="hideDialog" @update="onUpdate" />

            <!-- Service Incentive Leave Tab -->
            <service-incentive-leave-tab v-show="activeTab === 'service'" :employee-data="localEmployeeData" @cancel="hideDialog" @update="onUpdate" />

            <!-- Allowance Tab -->
            <allowance-tab v-show="activeTab === 'allowance'" :employee-data="localEmployeeData" @cancel="hideDialog" @update="onUpdate" />

            <!-- Deduction Tab -->
            <deduction-tab v-show="activeTab === 'deduction'" :employee-data="localEmployeeData" @cancel="hideDialog" @update="onUpdate" />

            <!-- Documentation Tab -->
            <documentation-tab v-show="activeTab === 'documentations'" :employee-data="localEmployeeData" />
          </div>
          <!-- Expanding div -->
          <div></div>
        </div>


      </template>
      <template #DialogSubmitActions>
        <GButton
          variant="text"
          label="Cancel"
          @click="hideDialog"
          data-testid="dialog-cancel-button"
        />
        <GButton
          v-if="hasUpdateAction"
          :label="getUpdateButtonLabel"
          @click="handleUpdateAction"
          :loading="isUpdating"
          data-testid="dialog-update-button"
        />
      </template>
    </TemplateDialog>
  </q-dialog>

  <AddEditScheduleDialog @close="openScheduleDialog = false" @saveDone="onScheduleSaved" v-model="openScheduleDialog" />

  <AddEditPayrollGroupDialog @close="openAddPayrollGroupDialog = false" @saveDone="onPayrolGrouSaved" v-model="openAddPayrollGroupDialog" />

  <NewContract v-model="openNewContract" />
  <EditContract v-model="openEditContract" />
</template>

<script>
import { defineAsyncComponent } from 'vue';
import EmployeeDetailsTab from './tabs/EmployeeDetailsTab.vue';
import ContractDetailsTab from './tabs/ContractDetailsTab.vue';
import JobDetailsTab from './tabs/JobDetailsTab.vue';
import GovernmentTab from './tabs/GovernmentTab.vue';
import ShiftTab from './tabs/ShiftTab.vue';
import DocumentationTab from './tabs/DocumentationTab.vue';
import ServiceIncentiveLeaveTab from './tabs/ServiceIncentiveLeaveTab.vue';
import AllowanceTab from './tabs/AllowanceTab.vue';
import DeductionTab from './tabs/DeductionTab.vue';
import NewContract from './NewContract.vue';
import EditContract from './EditContract.vue';
import GButton from 'src/components/shared/buttons/GButton.vue';
import { useAuthStore } from 'src/stores/auth';
import { api } from 'src/boot/axios';

// Lazy-loaded dialogs (ALL dialogs must be lazy loaded - CLAUDE.md)
const AddEditPayrollGroupDialog = defineAsyncComponent(() =>
  import('../../../dialogs/configuration/ManpowerAddEditPayrollGroupDialog.vue')
);
const AddEditScheduleDialog = defineAsyncComponent(() =>
  import('../../../dialogs/configuration/ManpowerAddEditScheduleDialog.vue')
);
const TemplateDialog = defineAsyncComponent(() =>
  import('src/components/dialog/TemplateDialog.vue')
);

export default {
  name: 'AddEditHRISEmployeeDialog',
  setup() {
    const authStore = useAuthStore();

    return {
      authStore
    };
  },
  components: {
    EmployeeDetailsTab,
    ContractDetailsTab,
    JobDetailsTab,
    GovernmentTab,
    ShiftTab,
    DocumentationTab,
    ServiceIncentiveLeaveTab,
    AllowanceTab,
    DeductionTab,
    NewContract,
    EditContract,
    AddEditScheduleDialog,
    AddEditPayrollGroupDialog,
    TemplateDialog,
    GButton,
  },
  props: {
    employeeId: {
      type: String,
      default: null,
    },
    modelValue: {
      type: Boolean,
      default: false,
    },
    initialTab: {
      type: String,
      default: 'employee_Details',
    },
  },
  emits: ['update:modelValue', 'saveDone', 'close'],
  data: () => ({
    localEmployeeData: {
      key: 1,
      data: {
        accountDetails: {},
        contractDetails: {},
        jobDetails: {},
        governmentDetails: {},
        payrollGroup: {},
        branch: {},
        schedule: {}
      }
    },
    tableContract: [],
    activeDropdownIndex: null,
    findContract: [],
    contractSee: false,
    activeTab: 'employee_Details',
    openScheduleDialog: false,
    openAddPayrollGroupDialog: false,

    openNewContract: false,
    openViewContract: false,
    openEditContract: false,
    tabList: [
      { key: 'employee_Details', name: 'Employee Details' },
      { key: 'contract_Datails', name: 'Contract Details' },
      { key: 'job_Details', name: 'Job Details' },
      { key: 'goverment', name: 'Government' },
      { key: 'shift', name: 'Shift' },
      { key: 'service', name: 'Leaves' },
      { key: 'allowance', name: 'Allowance' },
      { key: 'deduction', name: 'Deduction' },
      { key: 'documentations', name: 'Documentations' },
    ],
    initializedTabs: {}, // Track which tabs have been initialized
    isLoading: false,
    isLoadingEmployee: false,
    scheduleOption: [],
    payrolGroupCode: [],
    branchIds: [],
    employeeStatus: [
      { label: 'REGULAR', value: 'REGULAR' },
      { label: 'CONTRACTTUAL', value: 'CONTRACTTUAL' },
      { label: 'PROBATIONARY', value: 'PROBATIONARY' },
      { label: 'TRAINEE', value: 'TRAINEE' },
    ],
    employeeID: '',
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
      parentAccountId: '',
    },
    contractDetails: {
      monthlyRate: '',
      employmentStatus: '',
      startDate: '',
      endDate: '',
      contractFileId: 0,
    },
    payrollGroupId: '',
    scheduleId: '',
    branchId: '',
    isUpdating: false,
  }),
  computed: {
    hasUpdateAction() {
      // Tabs that have update functionality
      const updateTabs = ['employee_Details', 'job_Details', 'goverment', 'shift'];
      return updateTabs.includes(this.activeTab);
    },
    getUpdateButtonLabel() {
      const labels = {
        employee_Details: 'Update Employee Details',
        job_Details: 'Update Job Details',
        goverment: 'Update Government Details',
        shift: 'Update Schedule'
      };
      return labels[this.activeTab] || 'Update';
    }
  },
  mounted() {
    if (this.employeeId) {
      this.fetchEmployeeData();
    }
  },
  watch: {
    employeeId: {
      handler(newVal) {
        if (newVal) {
          this.fetchEmployeeData();
        }
      },
      immediate: true,
    },
    modelValue(val) {
      if (val) {
        this.show();
      } else {
        this.hide();
      }
    },
    activeTab: {
      handler(newTab) {
        this.initializeTabData(newTab);
      },
      immediate: true, // Initialize the default tab
    },
  },
  methods: {
    async handleUpdateAction() {
      this.isUpdating = true;

      try {
        switch (this.activeTab) {
          case 'employee_Details':
            await this.updateEmployeeDetails();
            break;
          case 'job_Details':
            // Call job details update method when available
            this.updateJobDetails();
            break;
          case 'goverment':
            this.updateGovernmentDetails();
            break;
          case 'shift':
            this.updateShiftDetails();
            break;
          default:
            console.warn('No update action defined for tab:', this.activeTab);
            this.isUpdating = false;
        }
      } catch (error) {
        console.error('Update action failed:', error);
        this.isUpdating = false;
      }
    },

    updateJobDetails() {
      console.log('[DEBUG] Parent: updateJobDetails called');
      console.log('[DEBUG] Parent: $refs.jobDetailsTab:', this.$refs.jobDetailsTab);
      console.log('[DEBUG] Parent: Has updateJobDetails method?', this.$refs.jobDetailsTab?.updateJobDetails);

      // Call the job details tab's update method
      if (this.$refs.jobDetailsTab && this.$refs.jobDetailsTab.updateJobDetails) {
        console.log('[DEBUG] Parent: Calling child updateJobDetails method');
        this.$refs.jobDetailsTab.updateJobDetails();
      } else {
        console.error('[DEBUG] Parent: Job details tab ref not found or updateJobDetails method not available');
        console.error('[DEBUG] Parent: Available refs:', Object.keys(this.$refs));
        this.isUpdating = false;
      }
    },

    updateGovernmentDetails() {
      console.log('[DEBUG] Parent: updateGovernmentDetails called');
      console.log('[DEBUG] Parent: $refs.governmentTab:', this.$refs.governmentTab);
      console.log('[DEBUG] Parent: Has updateGovernmentDetails method?', this.$refs.governmentTab?.updateGovernmentDetails);

      // Call the government tab's update method
      if (this.$refs.governmentTab && this.$refs.governmentTab.updateGovernmentDetails) {
        console.log('[DEBUG] Parent: Calling child updateGovernmentDetails method');
        this.$refs.governmentTab.updateGovernmentDetails();
      } else {
        console.error('[DEBUG] Parent: Government tab ref not found or updateGovernmentDetails method not available');
        console.error('[DEBUG] Parent: Available refs:', Object.keys(this.$refs));
        this.isUpdating = false;
      }
    },

    updateShiftDetails() {
      // Placeholder - implement when shift details update is needed
      this.isUpdating = false;
      this.$q.notify({
        type: 'positive',
        message: 'Shift details updated successfully',
      });
    },

    /**
     * Initialize data for specific tab when it's activated
     * Only loads data once per tab to avoid unnecessary API calls
     */
    async initializeTabData(tabKey) {
      // Skip if tab has already been initialized
      if (this.initializedTabs[tabKey]) {
        return;
      }

      console.log(`Initializing data for tab: ${tabKey}`);
      
      try {
        switch (tabKey) {
          case 'employee_Details':
            // Employee Details tab needs branch data for dropdowns
            await this.fetchBranchIdAsync();
            break;
          
          case 'contract_Datails':
            // Contract Details tab needs employee/contract list
            await this.fetchContractAsync();
            break;
          
          case 'job_Details':
            // Job Details tab needs payroll groups and branch data
            await Promise.all([
              this.fetchPayrolGroupCodeAsync(),
              this.fetchBranchIdAsync()
            ]);
            break;
          
          case 'shift':
            // Shift tab fetches its own schedule data via composable
            // No additional data needed here
            break;
          
          case 'goverment':
          case 'service':
          case 'allowance':
          case 'deduction':
          case 'documentations':
            // These tabs don't require additional data loading currently
            // Add specific loading logic when needed
            break;
          
          default:
            console.warn(`Unknown tab key: ${tabKey}`);
        }
        
        // Mark tab as initialized
        this.initializedTabs[tabKey] = true;
        console.log(`Tab ${tabKey} initialized successfully`);
        
      } catch (error) {
        console.error(`Error initializing tab ${tabKey}:`, error);
        // Don't block tab switching on error, just log it
      }
    },

    toggleDropdown(index) {
      if (this.activeDropdownIndex === index) {
        this.closeDropdown();
      } else {
        this.activeDropdownIndex = index;
        setTimeout(() => {
          document.addEventListener('click', this.closeDropdown);
        });
      }
    },
    closeDropdown() {
      this.activeDropdownIndex = null;
      document.removeEventListener('click', this.closeDropdown);
    },
    addNewContract() {
      this.openNewContract = true;
    },
    openViewContracts() {
      this.openViewContract = true;
    },
    openEditContracts() {
      this.openEditContract = true;
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

    async updateEmployeeDetails() {
      // Call the child component's update method
      if (this.$refs.employeeDetailsTab && this.$refs.employeeDetailsTab.updateEmployeeDetails) {
        try {
          await this.$refs.employeeDetailsTab.updateEmployeeDetails();
          // The isUpdating state will be reset in onUpdate() when the update event is emitted
        } catch (error) {
          console.error('Error updating employee details:', error);
          this.isUpdating = false;
          this.$q.notify({
            type: 'negative',
            message: 'Failed to update employee details',
          });
        }
      } else {
        console.error('Employee details tab ref not found');
        this.isUpdating = false;
        this.$q.notify({
          type: 'negative',
          message: 'Unable to update employee details',
        });
      }
    },

    updateContractDetails() {
      this.$q.notify({
        type: 'positive',
        message: 'Waits',
      });
    },



    updateServiceDetails() {
      this.$q.notify({
        type: 'positive',
        message: 'Service details updated successfully',
      });
    },

    updateDocumentationDetails() {
      this.$q.notify({
        type: 'positive',
        message: 'Documentation details updated successfully',
      });
    },

    removeOnTable() {
      this.$q
        .dialog({
          title: 'Confirm',
          message: 'Are you sure want to remove',
          cancel: true,
          persistent: true,
        })
        .onOk(() => {})
        .onOk(() => {
          alert('OK');
        })
        .onCancel(() => {
          alert('Cancel');
        });
    },

    show() {
      this.populateFormData();
      this.populateContractData();
      this.activeTab = this.initialTab;
      this.$refs.dialog.show();
    },
    hide() {
      this.$refs.dialog.hide();
    },
    hideDialog() {
      this.activeTab = 'employee_Details'; // Reset to default tab
      this.$emit('update:modelValue', false);
      this.$emit('close');
      this.hide();
    },
    async onBeforeShow() {
      // Reload employee data every time dialog is about to show
      if (this.employeeId) {
        await this.fetchEmployeeData();
      }
    },
    onDialogHide() {
      this.activeTab = 'employee_Details'; // Reset to default tab
      this.$emit('update:modelValue', false);
      this.$emit('close');
    },
    populateFormData() {
      if (this.localEmployeeData && this.localEmployeeData.data) {
        const { contractDetails } = this.localEmployeeData.data;

        // Note: accountDetails population is now handled by the EmployeeDetailsTab component
        // which includes all the new fields (dateOfBirth, gender, civilStatus, address fields)

        this.contractDetails = {
          monthlyRate: contractDetails.monthlyRate || 0,
          // employmentStatus: contractDetails.employmentStatus,
          // startDate: this.getDateString(contractDetails.startDate),
          // endDate: this.getDateString(contractDetails.endDate),
          // contractFileId: contractDetails.contractFile.id,
        };

        this.payrollGroupId = this.localEmployeeData.data.payrollGroup.id;
        this.scheduleId = this.localEmployeeData.data.schedule.id;
        this.branchId = this.localEmployeeData.data.branch.id;
      }
    },
    populateContractData() {
      this.tableContract = [];
      if (this.localEmployeeData?.data?.employeeCode && this.localEmployeeData?.data?.contractDetails) {
        const usersSeeing = this.findContract.find((pro) => pro.employeeCode === this.employeeCodes);

        if (usersSeeing) {
          this.tableContract.push({
            employeeCode: this.localEmployeeData.data.employeeCode,
            employementStatus: this.localEmployeeData.data.contractDetails.employmentStatus,
            startDate: this.localEmployeeData.data.contractDetails?.startDate?.date || 'N/A',
            endDate: this.localEmployeeData.data.contractDetails?.endDate?.date || 'N/A',
          });
        }
      }
    },
    closeMOdalschild() {
      this.activeDropdownIndex = null;
    },
    getDateString(dateValue) {
      if (!dateValue) return '';
      try {
        if (typeof dateValue === 'string') {
          return dateValue.split('T')[0];
        } else if (typeof dateValue === 'object') {
          if (dateValue.raw) {
            const date = new Date(dateValue.raw);
            return date.toISOString().split('T')[0];
          } else if (dateValue instanceof Date) {
            return dateValue.toISOString().split('T')[0];
          } else if (dateValue.date) {
            const parts = dateValue.date.split('/');
            if (parts.length === 3) {
              return `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
            }
          }
        }

        return new Date(dateValue).toISOString().split('T')[0];
      } catch (error) {
        console.error('Error formatting date:', error, dateValue);
        return '';
      }
    },
    openNewScheduleCode() {
      this.openScheduleDialog = true;
    },
    openPayrollGroupCodes() {
      this.openAddPayrollGroupDialog = true;
    },
    async fetchEmployeeData() {
      if (!this.employeeId) return;

      this.isLoadingEmployee = true;
      try {
        // Fetch complete employee data using optimized API (N+1 query fix)
        const response = await api.get(`/hris/employee/info-lite?accountId=${this.employeeId}`);
        const data = response.data;

        // Transform the data to match expected format
        this.localEmployeeData = {
          key: 1,
          data: {
            accountDetails: {
              ...data.accountDetails,
              roleId: data.accountDetails?.roleID || data.accountDetails?.roleId || null
            },
            employeeCode: data.employeeCode,
            contractDetails: data.contractDetails,
            jobDetails: data.jobDetails || {
              bankName: '',
              bankAccountNumber: '',
              biometricsNumber: '',
              branchId: null
            },
            governmentDetails: data.governmentDetails || {
              sssNumber: '',
              tinNumber: '',
              phicNumber: '',
              hdmfNumber: ''
            },
            payrollGroup: data.payrollGroup || {},
            schedule: data.schedule || {},
            branch: data.branch || {}
          }
        };

        this.employeeID = data.accountDetails?.id;
        this.employeeCodes = data.employeeCode;

        // Populate contract data if exists
        if (data.contractDetails) {
          const usersSeeing = this.findContract.find((pro) => pro.employeeCode === this.employeeCodes);
          if (usersSeeing) {
            this.tableContract.push({
              employeeCode: data.employeeCode,
              employementStatus: data.contractDetails.employmentStatus?.key || data.contractDetails.employmentStatus,
              startDate: data.contractDetails.startDate?.date || data.contractDetails.startDate?.dateFull || 'N/A',
              endDate: data.contractDetails.endDate?.date || data.contractDetails.endDate?.dateFull || 'N/A',
            });
          }
        }

        this.populateFormData();

      } catch (error) {
        console.error('Error fetching employee data:', error);
        this.$q.notify({
          type: 'negative',
          message: error.response?.data?.message || 'Failed to load employee data'
        });
      } finally {
        this.isLoadingEmployee = false;
      }
    },
    
    async fetchScheduleCodeAsync() {
      try {
        const response = await api.get('/hr-configuration/schedule/list');
        this.scheduleOption = response.data || [];
      } catch (error) {
        console.error('Error fetching schedule codes:', error);
        // Don't block dialog from opening if this fails
      }
    },

    async fetchPayrolGroupCodeAsync() {
      try {
        const response = await api.get('/hr-configuration/payroll-group/list');
        this.payrolGroupCode = response.data || [];
      } catch (error) {
        console.error('Error fetching payroll groups:', error);
      }
    },

    async fetchBranchIdAsync() {
      try {
        const response = await api.get('/project/list');
        this.branchIds = response.data || [];
      } catch (error) {
        console.error('Error fetching branches:', error);
      }
    },

    async fetchContractAsync() {
      try {
        // Fetch employee table data with minimal fields
        const response = await api.put('/hris/employee/table?page=1&perPage=1000', {
          filters: [{ isActive: true }]
        });

        // Map the employees to match the expected format
        this.findContract = response.data.list.map(emp => ({
          employeeCode: emp.employeeCode,
          accountId: emp.accountDetails?.id,
          ...emp
        }));
      } catch (error) {
        console.error('Error fetching contracts:', error);
      }
    },
    
    async fetchScheduleCode() {
      this.isLoading = true;
      try {
        const response = await api.get('/hr-configuration/schedule/list');
        this.scheduleOption = response.data || [];
      } catch (error) {
        console.error('Error fetching schedule codes:', error);
      } finally {
        this.isLoading = false;
      }
    },

    async fetchPayrolGroupCode() {
      this.isLoading = true;
      try {
        const response = await api.get('/hr-configuration/payroll-group/list');
        this.payrolGroupCode = response.data || [];
      } catch (error) {
        console.error('Error fetching payroll groups:', error);
      } finally {
        this.isLoading = false;
      }
    },

    async fetchBranchId() {
      this.isLoading = true;
      try {
        const response = await api.get('/project/list');
        this.branchIds = response.data || [];
      } catch (error) {
        console.error('Error fetching branches:', error);
      } finally {
        this.isLoading = false;
      }
    },

    async fetchContract() {
      this.isLoading = true;
      try {
        // Fetch employee table data with minimal fields using API
        const response = await api.put('/hris/employee/table?page=1&perPage=1000', {
          filters: [{ isActive: true }]
        });

        // Map the employees to match the expected format
        this.findContract = response.data.list.map(emp => ({
          employeeCode: emp.employeeCode,
          accountId: emp.accountDetails?.id,
          ...emp
        }));
      } catch (error) {
        console.error('Error fetching contracts:', error);
      } finally {
        this.isLoading = false;
      }
    },
    async onUpdate() {
      console.log('[DEBUG] EditCreateEmployee: onUpdate method called');

      // Note: Child tabs already show their own success notifications
      // No need to show duplicate notification here

      // Reset the updating state
      this.isUpdating = false;

      // Emit saveDone to trigger parent table refresh
      console.log('[DEBUG] EditCreateEmployee: Emitting saveDone event after successful update');
      this.$emit('saveDone');

      // Close the dialog after successful update
      this.hideDialog();
    },
  },
};
</script>

<style lang="scss" src="./EditCreateEmployee.scss"></style>
