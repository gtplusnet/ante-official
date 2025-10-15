<template>
  <q-dialog ref="dialog">
    <q-card class="full-width dialog-card">
      <q-bar class="bg-primary text-white cursor-default" dark>
        <div>View Employee</div>
        <q-space />
        <GButton dense icon="close" v-close-popup>
          <q-tooltip>Close</q-tooltip>
        </GButton>
      </q-bar>

      <q-card-section>
        <q-form class="q-gutter-md">
          <div class="column">
            <!------------Tabs E2 ahhh---------------------------->
            <div>
              <div class="page-tabs q-my-md">
                <div v-for="tab in tabList" :class="tab.key === activeTab ? 'active' : ''" :key="tab.key" @click="activeTab = tab.key" class="tab">
                  {{ tab.name }}
                </div>
              </div>
            </div>

            <div class="tab-content">
              <!------------------------------------------>
              <div class="q-pa-md bgColor q-mb-md rounded-borders" v-show="activeTab === 'employee_Details'">
                <p class="text-bold text-subtitle1">Personal Information</p>
                <div class="row q-col-gutter-md">
                  <div class="col-12 col-sm-6 col-md-4">
                    <g-input label="Last Name" class="full-width" v-model="accountDetails.lastName" type="readonly" />
                  </div>
                  <div class="col-12 col-sm-6 col-md-4">
                    <g-input label="First Name" class="full-width" v-model="accountDetails.firstName" type="readonly" />
                  </div>
                  <div class="col-12 col-sm-6 col-md-4">
                    <g-input label="Middle Name (Optional)" class="full-width" v-model="accountDetails.middleName" type="readonly" />
                  </div>
                  <div class="col-12 col-sm-6 col-md-4">
                    <g-input label="Username" class="full-width" v-model="accountDetails.username" type="readonly" />
                  </div>
                  <div class="col-12 col-sm-6 col-md-4">
                    <g-input label="Email Address" class="full-width" v-model="accountDetails.email" type="readonly" />
                  </div>
                  <div class="col-12 col-sm-6 col-md-4">
                    <g-input label="Contact Number" class="full-width" v-model="accountDetails.contactNumber" type="readonly" />
                  </div>

                  <div class="col-12 col-sm-6 col-md-4">
                    <g-input type="readonly" apiUrl="select-box/role-list" v-model="accountDetails.roleID" label="Role / Position" />
                  </div>
                </div>

                <div class="row q-col-gutter-md q-mt-md Mani">
                  <div class="col-12 col-sm-6">
                    <div class="row items-center">
                      <div class="col">
                        <div class="q-mb-xs">Schedule Code</div>
                        <g-input v-model="scheduleId" dense outlined options-dense emit-value map-options class="full-width" type="readonly" />
                      </div>
                    </div>
                  </div>
                  <div class="col-12 col-sm-6">
                    <div class="row items-center">
                      <div class="col">
                        <div class="q-mb-xs">Payroll Group Code</div>
                        <g-input dense v-model="payrollGroupId" outlined options-dense emit-value map-options class="full-width" type="readonly" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="q-pa-md bgColor rounded-borders" v-show="activeTab === 'contract_Datails'">
                <div class="row q-col-gutter-md">
                  <table>
                    <thead>
                      <tr>
                        <th>Employment Status</th>
                        <th>Start Date</th>
                        <th>End Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(row, index) in tableContract" :key="index">
                        <td>
                          {{ row.employementStatus }}
                        </td>
                        <td>{{ row.startDate }}</td>
                        <td>{{ row.endDate }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div class="row justify-end q-mt-md">
              <GButton variant="outline" class="q-mr-sm" label="Cancel" type="button" color="primary" @click="hideDialog" />

              <GButton variant="filled" class="q-mr-sm" color="primary" @click="this.$emit('edit')">
                <template #prepend>
                  <q-icon class="q-mr-sm" size="18px" name="edit" />
                </template>
                <span>Update Employee Details</span>
              </GButton>
            </div>
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script>
import GInput from "../../../../../../components/shared/form/GInput.vue";
import GButton from 'src/components/shared/buttons/GButton.vue';
// TODO: Migrate to backend API
//  import { useSupabaseEmployees } from 'src/composables/supabase/useSupabaseEmployees';
import { useAuthStore } from 'src/stores/auth';

export default {
  name: 'ViewCreateEmployee',
  setup() {
    // TODO: Migrate to backend API - employees composable deleted
    // const employeesComposable = useSupabaseEmployees();
    const employeesComposable = { employees: { value: [] }, fetchEmployeesByCompany: async () => {}, fetchEmployeesMinimal: async () => {} };
    const authStore = useAuthStore();

    return {
      employeesComposable,
      authStore
    };
  },
  components: {
    GButton,
    GInput,
  },
  props: {
    createEditEmployee: {
      type: Object || null,
      default: null,
    },
    modelValue: {
      type: Boolean,
      default: false,
    },
  },
  data: () => ({
    tableContract: [],
    findContract: [],
    employeeCodes: '',
    activeTab: 'employee_Details',
    tabList: [
      { key: 'employee_Details', name: 'Employee Details' },
      { key: 'contract_Datails', name: 'Contract Details' },
      { key: 'job_Details', name: 'Job Details' },
      { key: 'goverment', name: 'Goverment' },
      { key: 'shift', name: 'Shift' },
      { key: 'service', name: 'Service Incentive Leaves' },
      { key: 'documentations', name: 'Documentations' },
    ],
    openEditDialog: false,
    isLoading: false,
    openScheduleDialog: false,
    employeeID: '',
    empoy: '',
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
      monthlyRate: 0,
      employmentStatus: '',
      startDate: '',
      endDate: '',
      contractFileId: '',
    },
    payrollGroupId: '',
    scheduleId: '',
    branchId: '',
  }),

  watch: {
    createEditEmployee: {
      handler(newVal) {
        if (newVal?.data) {
          this.empoy = newVal.data.employeeCode;
          this.employeeCodes = newVal.data.employeeCode;
          this.employeeID = newVal.data.accountDetails.id;
          this.branchId = newVal.data.branch.code;
          this.contractDetails.contractFileId = newVal.data.contractDetails.contractFile.url;

          this.tableContract = [
            {
              employeeCode: newVal.data.employeeCode,
              employementStatus: newVal.data.contractDetails.employmentStatus,
              startDate: newVal.data.contractDetails.startDate.date,
              endDate: newVal.data.contractDetails.endDate.date,
            },
          ];

          this.populateFormData();
        }
      },
      deep: true,
      immediate: true,
    },
    modelValue(val) {
      if (val) {
        this.show();
      } else {
        this.hide();
      }
    },
  },
  mounted() {
    this.fetchContract();
  },
  methods: {
    show() {
      this.populateFormData();
      this.populateContractData();
      this.$refs.dialog.show();
    },
    hide() {
      this.$refs.dialog.hide();
    },

    populateFormData() {
      if (this.createEditEmployee && this.createEditEmployee.data) {
        const { accountDetails, contractDetails } = this.createEditEmployee.data;
        this.accountDetails = {
          firstName: accountDetails.firstName || '',
          lastName: accountDetails.lastName || '',
          middleName: accountDetails.middleName || '',
          contactNumber: accountDetails.contactNumber || '',
          email: accountDetails.email || '',
          username: accountDetails.username || '',
          password: '',
          roleID: accountDetails.role.name || '',
          parentAccountId: accountDetails.parentAccountId || '',
        };

        this.contractDetails = {
          monthlyRate: contractDetails.monthlyRate || 0,
          employmentStatus: contractDetails.employmentStatus || 'REGULAR',
          startDate: this.getDateString(contractDetails.startDate),
          endDate: this.getDateString(contractDetails.endDate),
          contractFileId: contractDetails.contractFileId || '',
        };

        this.payrollGroupId = this.createEditEmployee.data.payrollGroup.payrollGroupCode;

        this.scheduleId = this.createEditEmployee.data.schedule.scheduleCode;

        this.branchId = this.createEditEmployee.data.branch.code;

        this.contractDetails.contractFileId = this.createEditEmployee.data.contractDetails.contractFile.originalName;
      }
    },
    populateContractData() {
      if (this.createEditEmployee?.data) {
        this.tableContract = [
          {
            employeeCode: this.createEditEmployee.data.employeeCode,
            employementStatus: this.createEditEmployee.data.contractDetails.employmentStatus,
            startDate: this.createEditEmployee.data.contractDetails.startDate.date,
            endDate: this.createEditEmployee.data.contractDetails.endDate.date,
          },
        ];
      }
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
    async fetchContract() {
      this.isLoading = true;
      try {
        // Fetch employees using Supabase composable
        const companyId = this.authStore.getAccountInformation?.companyId || this.authStore.getAccountInformation?.company?.id;
        if (companyId) {
          await this.employeesComposable.fetchEmployeesByCompany(companyId);
        } else {
          await this.employeesComposable.fetchEmployeesMinimal();
        }
        // Map the employees to match the expected format
        this.findContract = this.employeesComposable.employees.value.map(emp => ({
          employeeCode: emp.employeeCode,
          accountId: emp.accountId,
          ...emp
        }));
      } catch (error) {
        console.error('Error fetching employees:', error);
      } finally {
        this.isLoading = false;
      }
    },
    hideDialog() {
      this.$emit('update:modelValue', false);
      this.$emit('close');
      this.hide();
    },
  },
};
</script>

<style scoped lang="scss" src="../../../dialogs/hris/ManpowerAddEditHRISEmployeeDialog.scss"></style>
