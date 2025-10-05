<template>
  <q-dialog ref="dialog" @hide="resetForm" persistent>
    <TemplateDialog scrollable="false" no-padding>
      <template #DialogIcon>
        <q-icon name="person_add" size="24px" />
      </template>
      <template #DialogTitle>
        {{ isActivation ? "Activate Employee" : "Create Employee" }}
      </template>
      <template #DialogContent>
        <q-form ref="employeeForm" @submit.prevent="createEmployees">
          <div class="column">
            <div class="tab-content">
              <div class="row">
                <div class="text-title-medium col-12 q-mb-md">Personal Information</div>
                <div class="col-12 col-sm-6 col-md-4 q-pr-sm">
                  <g-input
                    label="Employee ID"
                    class="text-white"
                    v-model="employeeId"
                    :required="true"
                  />
                </div>
                <div class="col-12 col-sm-6 col-md-4 q-pr-sm">
                  <g-input
                    label="Last Name"
                    class="full-width"
                    v-model="accountDetails.lastName"
                    :readonly="isActivation"
                    :required="true"
                  />
                </div>
                <div class="col-12 col-sm-6 col-md-4">
                  <g-input
                    label="First Name"
                    class="full-width"
                    v-model="accountDetails.firstName"
                    :readonly="isActivation"
                    :required="true"
                  />
                </div>
                <div class="col-12 col-sm-6 col-md-4 q-pr-sm">
                  <g-input
                    label="Middle Name (Optional)"
                    class="full-width"
                    v-model="accountDetails.middleName"
                    :readonly="isActivation"
                  />
                </div>
                <div class="col-12 col-sm-6 col-md-4 q-pr-sm">
                  <g-input
                    label="Username"
                    class="full-width"
                    v-model="accountDetails.username"
                    :readonly="isActivation"
                    :required="true"
                  />
                </div>
                <div class="col-12 col-sm-6 col-md-4">
                  <div class="label">Email Address</div>
                  <q-input
                    class="full-width"
                    type="email"
                    dense
                    outlined
                    v-model="accountDetails.email"
                    :readonly="isActivation"
                    :rules="[(val) => !!val || 'Email is required']"
                  />
                </div>
                <div class="col-12 col-sm-6 col-md-4 q-pr-sm">
                  <g-input
                    label="Contact Number"
                    class="full-width"
                    v-model="accountDetails.contactNumber"
                    :readonly="isActivation"
                    :required="true"
                  />
                </div>
                <div class="col-12 col-sm-6 col-md-4 q-pr-sm" v-if="!isActivation">
                  <g-input
                    label="Password"
                    class="full-width"
                    type="password"
                    v-model="accountDetails.password"
                    :required="true"
                  />
                </div>
                <div class="col-12 col-sm-6 col-md-4">
                  <g-input
                    type="select"
                    apiUrl="select-box/role-list"
                    v-model="accountDetails.roleID"
                    label="Role / Position"
                    :readonly="isActivation"
                    :required="true"
                  />
                </div>
                <div class="col-12">
                  <g-input
                    type="select"
                    :apiUrl="`select-box/parent-user-list?id=${accountDetails.roleID}`"
                    v-model="accountDetails.parentAccountId"
                    label="Reports to"
                    :readonly="isActivation"
                    :required="true"
                  />
                </div>
              </div>
              <div class="row">
                <p class="text-title-medium q-mt-md col-12">
                  Contract Information
                </p>
                <!-- Left Column -->
                <div class="col-12 col-sm-6">
                  <div class="row">
                    <div class="col-12 col-md-6 q-pr-sm">
                      <g-input
                        label="Monthly Rate"
                        class="full-width"
                        v-model="contractDetails.monthlyRate"
                        :required="true"
                      />
                    </div>
                    <div class="col-12 col-md-6 q-pr-sm">
                      <g-input
                        v-model="contractDetails.employmentStatus"
                        label="Employment Status"
                        type="select"
                        apiUrl="hris/employee/contract/employment-status"
                        class="full-width"
                        :required="true"
                      />
                    </div>
                  </div>
                </div>

                <!-- Right Column -->
                <div class="col-12 col-sm-6">
                  <div class="row">
                    <div
                      class="col-12"
                      :class="{
                        'col-md-6':
                          contractDetails.employmentStatus !== 'REGULAR',
                      }"
                    >
                      <g-input
                        label="Start Date"
                        type="date"
                        class="full-width q-pr-sm"
                        v-model="contractDetails.startDate"
                        :required="true"
                      />
                    </div>
                    <div
                      v-if="contractDetails.employmentStatus !== 'REGULAR'"
                      class="col-12 col-md-6"
                    >
                      <g-input
                        label="End Date"
                        type="date"
                        class="full-width"
                        v-model="contractDetails.endDate"
                        :required="true"
                      />
                    </div>
                  </div>
                </div>

                <div class="col-12">
                  <g-input
                    label="Contract"
                    type="file"
                    class="full-width"
                    accept=".xlsx,.xls,.csv,.jpg,.jpeg,.png,.doc,.docx,.pdf"
                    v-model="contractDetails.contractFileId"
                  />
                </div>

                <div class="col-12">
                  <div class="text-label-large">Branch</div>
                  <q-select
                    :options="branchIds"
                    v-model="branchId"
                    dense
                    outlined
                    options-dense
                    emit-value
                    map-options
                    class="full-width"
                    :rules="[(val) => !!val || 'Branch is required']"
                  />
                </div>
              </div>
              <div class="row">
                <p class="text-title-medium col-12">Other Details</p>
                <div class="col-12 col-sm-6 q-pr-sm">
                  <div class="q-mb-xs">Schedule Code</div>
                  <div class="select-container">
                    <div class="select-field">
                      <q-select
                        v-model="scheduleId"
                        :options="scheduleOption"
                        dense
                        outlined
                        options-dense
                        emit-value
                        map-options
                        class="full-width"
                      />
                    </div>
                    <div class="add-button">
                      <q-btn
                        dense
                        icon="add"
                        unelevated
                        class="bordered-btn"
                        @click.prevent="openNewScheduleCode"
                      />
                    </div>
                  </div>
                </div>
                <div class="col-12 col-sm-6">
                  <div class="q-mb-xs">Payroll Group Code</div>
                  <div class="select-container">
                    <div class="select-field">
                      <q-select
                        dense
                        :options="payrolGroupCode"
                        v-model="payrollGroupId"
                        outlined
                        options-dense
                        emit-value
                        map-options
                        class="full-width"
                      />
                    </div>
                    <div class="add-button">
                      <q-btn
                        unelevated
                        dense
                        class="bordered-btn"
                        icon="add"
                        @click="openPayrollGroupCodes"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </q-form>
      </template>
      <template #DialogSubmitActions>
        <GButton variant="outline" label="Cancel" type="button" v-close-popup />
        <GButton
          type="button"
          :label="isActivation ? 'Activate Employee' : 'Save'"
          @click="createEmployees"
        />
      </template>
    </TemplateDialog>
  </q-dialog>

  <AddEditScheduleDialog
    @close="openScheduleDialog = false"
    @saveDone="onScheduleSaved"
    v-model="openScheduleDialog"
  />

  <AddEditPayrollGroupDialog
    @close="openAddPayrollGroupDialog = false"
    @saveDone="onPayrolGrouSaved"
    v-model="openAddPayrollGroupDialog"
  />
</template>

<script>
import GButton from "src/components/shared/buttons/GButton.vue";
import GInput from "../../../../../components/shared/form/GInput.vue";
import { api } from "src/boot/axios";
import { handleAxiosError } from "src/utility/axios.error.handler";
import { useSupabaseSchedules } from "src/composables/supabase/useSupabaseSchedules";
import { useSupabasePayrollGroups } from "src/composables/supabase/useSupabasePayrollGroups";
import { useSupabaseBranches } from "src/composables/supabase/useSupabaseBranches";
import { useAuthStore } from "src/stores/auth";

// Lazy-loaded dialogs (ALL dialogs must be lazy loaded - CLAUDE.md)
const AddEditPayrollGroupDialog = defineAsyncComponent(() =>
  import('../configuration/ManpowerAddEditPayrollGroupDialog.vue')
);
const AddEditScheduleDialog = defineAsyncComponent(() =>
  import('../configuration/ManpowerAddEditScheduleDialog.vue')
);
const TemplateDialog = defineAsyncComponent(() =>
  import('src/components/dialog/TemplateDialog.vue')
);

export default {
  name: "AddEditHRISEmployeeDialog",
  components: {
    GInput,
    AddEditScheduleDialog,
    AddEditPayrollGroupDialog,
    TemplateDialog,
    GButton,
  },
  props: {
    isActivation: {
      type: Boolean,
      default: false,
    },
  },
  setup() {
    // Initialize Supabase composables
    const schedulesComposable = useSupabaseSchedules();
    const payrollGroupsComposable = useSupabasePayrollGroups();
    const branchesComposable = useSupabaseBranches();
    const authStore = useAuthStore();
    
    return {
      schedulesComposable,
      payrollGroupsComposable,
      branchesComposable,
      authStore
    };
  },
  data: () => ({
    isLoading: false,
    scheduleOption: [],
    payrolGroupCode: [],
    branchIds: [],
    employeeStatus: [
      { label: "REGULAR", value: "REGULAR" },
      { label: "CONTRACTTUAL", value: "CONTRACTTUAL" },
      { label: "PROBATIONARY", value: "PROBATIONARY" },
      { label: "TRAINEE", value: "TRAINEE" },
    ],
    openScheduleDialog: false,
    openAddPayrollGroupDialog: false,
    employeeId: "",
    existingAccountId: null,
    accountDetails: {
      firstName: "",
      middleName: "",
      lastName: "",
      contactNumber: "",
      email: "",
      username: "",
      password: "",
      roleID: "",
      parentAccountId: "",
    },
    contractDetails: {
      monthlyRate: "",
      employmentStatus: "",
      startDate: "",
      endDate: "",
      contractFileId: null,
    },
    payrollGroupId: "",
    scheduleId: "",
    branchId: "",
  }),
  mounted() {
    this.fetchScheduleCode();
    this.fetchPayrolGroupCode();
    this.fetchBranchId();
  },
  emits: ["employee-saved"],
  methods: {
    async autoFillEmployeeInformation() {
      this.$q.loading.show();
      const randomUser = await api.get("https://randomuser.me/api/");
      const randomDetails = randomUser.data.results[0];

      console.log(randomDetails);

      this.employeeId = Math.floor(
        Math.random() * 9000000000 + 1000000000
      ).toString();
      this.accountDetails.firstName = randomDetails.name.first;
      this.accountDetails.middleName = randomDetails.name.middle;
      this.accountDetails.lastName = randomDetails.name.last;
      this.accountDetails.email = randomDetails.email;
      this.accountDetails.contactNumber =
        "09" + Math.floor(Math.random() * 9000000000 + 1000000000).toString();
      this.accountDetails.username = randomDetails.login.username;
      this.contractDetails.monthlyRate = Math.floor(
        Math.random() * 10000 + 1000
      );
      this.contractDetails.employmentStatus = "REGULAR";
      this.contractDetails.startDate = new Date().toISOString().split("T")[0];
      this.branchId =
        this.branchIds[Math.floor(Math.random() * this.branchIds.length)].value;
      this.payrollGroupId =
        this.payrolGroupCode[
          Math.floor(Math.random() * this.payrolGroupCode.length)
        ].value;
      this.scheduleId =
        this.scheduleOption[
          Math.floor(Math.random() * this.scheduleOption.length)
        ].value;
      this.$q.loading.hide();
    },
    randomEmail() {
      return `test.${this.generateRandomString(10).toLowerCase()}@example.com`;
    },
    generateRandomString(length) {
      return Math.random()
        .toString(36)
        .substring(2, 2 + length)
        .toUpperCase();
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
    async createEmployees() {
      // Validate form using Quasar's built-in validation
      const isValid = await this.$refs.employeeForm.validate();
      if (!isValid) {
        this.$q.notify({
          type: "negative",
          message: "Please fill in all required fields correctly",
        });
        return;
      }

      this.isLoading = true;

      // Validate required fields
      const requiredFields = [
        { value: this.employeeId, name: "Employee ID" },
        { value: this.accountDetails.firstName, name: "First Name" },
        { value: this.accountDetails.lastName, name: "Last Name" },
        { value: this.accountDetails.username, name: "Username" },
        { value: this.accountDetails.email, name: "Email" },
        { value: this.accountDetails.contactNumber, name: "Contact Number" },
        { value: this.accountDetails.roleID, name: "Role / Position" },
        { value: this.accountDetails.parentAccountId, name: "Reports to" },
        { value: this.contractDetails.monthlyRate, name: "Monthly Rate" },
        {
          value: this.contractDetails.employmentStatus,
          name: "Employment Status",
        },
        { value: this.contractDetails.startDate, name: "Start Date" },
        { value: this.branchId, name: "Branch" },
      ];

      // Add password validation only for new employees (not activation)
      if (!this.isActivation) {
        requiredFields.push({
          value: this.accountDetails.password,
          name: "Password",
        });
      }

      // Add end date validation for non-regular employees
      if (
        this.contractDetails.employmentStatus &&
        this.contractDetails.employmentStatus !== "REGULAR"
      ) {
        requiredFields.push({
          value: this.contractDetails.endDate,
          name: "End Date",
        });
      }

      // Check for empty required fields
      const emptyFields = requiredFields.filter(
        (field) => !field.value || field.value === ""
      );
      if (emptyFields.length > 0) {
        this.$q.notify({
          type: "negative",
          message: `Please fill in the following required fields: ${emptyFields
            .map((f) => f.name)
            .join(", ")}`,
          timeout: 5000,
        });
        this.isLoading = false;
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(this.accountDetails.email)) {
        this.$q.notify({
          type: "negative",
          message: "Please enter a valid email address",
        });
        this.isLoading = false;
        return;
      }

      if (parseFloat(this.contractDetails.monthlyRate) < 0) {
        this.$q.notify({
          type: "error",
          message: "Monthly Rate cannot be less than 0",
        });
        this.isLoading = false;
        return;
      }

      // Validate contract file - debug logging
      console.log(
        "Contract File ID before processing:",
        this.contractDetails.contractFileId
      );

      // Clean contract file ID if it's not a valid object
      if (
        this.contractDetails.contractFileId &&
        typeof this.contractDetails.contractFileId !== "object"
      ) {
        console.log("Invalid contract file ID detected, setting to null");
        this.contractDetails.contractFileId = null;
      }

      const allParams = {
        employeeCode: this.employeeId,
        ...(this.isActivation && this.existingAccountId
          ? { existingAccountId: this.existingAccountId }
          : { accountDetails: this.accountDetails }),
        contractDetails: {
          monthlyRate: parseFloat(this.contractDetails.monthlyRate),
          employmentStatus: this.contractDetails.employmentStatus,
          startDate: this.contractDetails.startDate
            ? new Date(this.contractDetails.startDate)
                .toISOString()
                .split("T")[0]
            : null,
          endDate: this.contractDetails.endDate
            ? new Date(this.contractDetails.endDate).toISOString().split("T")[0]
            : null,
          contractFileId:
            this.contractDetails.contractFileId &&
            typeof this.contractDetails.contractFileId === "object" &&
            this.contractDetails.contractFileId.id &&
            this.contractDetails.contractFileId.id !== "" &&
            this.contractDetails.contractFileId.id !== null &&
            this.contractDetails.contractFileId.id !== undefined
              ? parseInt(this.contractDetails.contractFileId.id)
              : null,
        },
        payrollGroupId: parseInt(this.payrollGroupId),
        scheduleId: parseInt(this.scheduleId),
        branchId: parseInt(this.branchId),
      };

      console.log(
        "Final API payload being sent:",
        JSON.stringify(allParams, null, 2)
      );

      this.$q.loading.show();

      api
        .post("/hris/employee/add", allParams)
        .then((response) => {
          console.log("API response:", response.data);
          this.$q.notify({
            type: "positive",
            message: this.isActivation
              ? "Employee activated successfully"
              : "Employee Added successfully",
          });
          this.$emit("employee-saved");
          this.$refs.dialog.hide();
        })
        .catch((error) => {
          handleAxiosError(this.$q, error);
        })
        .finally(() => {
          this.isLoading = false;
          this.$q.loading.hide();
        });
    },
    openDialog() {
      if (this.$refs.dialogCreate) {
        this.$refs.dialogCreate.show();
      }
    },
    show() {
      // Ensure clean state when dialog opens
      this.resetForm();
      this.$refs.dialog.show();
    },
    resetForm() {
      this.employeeId = "";
      this.existingAccountId = null;
      this.accountDetails = {
        firstName: "",
        middleName: "",
        lastName: "",
        contactNumber: "",
        email: "",
        username: "",
        password: "",
        roleID: "",
        parentAccountId: "",
      };

      this.contractDetails = {
        monthlyRate: "",
        employmentStatus: "",
        startDate: "",
        endDate: "",
        contractFileId: null,
      };

      this.branchId = "";
    },
    openNewScheduleCode() {
      this.openScheduleDialog = true;
    },
    openPayrollGroupCodes() {
      this.openAddPayrollGroupDialog = true;
    },
    async fetchScheduleCode() {
      this.isLoading = true;
      this.scheduleOption = [];

      try {
        // Fetch schedules using Supabase composable
        const companyId = this.authStore.getAccountInformation?.companyId || this.authStore.getAccountInformation?.company?.id;
        if (companyId) {
          await this.schedulesComposable.fetchSchedulesByCompany(companyId);
        } else {
          await this.schedulesComposable.fetchSchedules();
        }
        
        // Update local options from composable (scheduleOptions is a computed ref)
        this.scheduleOption = this.schedulesComposable.scheduleOptions.value;
        
        // Set default value if none selected
        if (this.scheduleOption.length > 0 && !this.scheduleId) {
          this.scheduleId = this.scheduleOption[0].value;
        }
      } catch (error) {
        console.error("Error fetching schedule codes from Supabase:", error);
        this.$q.notify({
          type: "negative",
          message: "Failed to load schedules",
        });
      } finally {
        this.isLoading = false;
      }
    },
    async fetchPayrolGroupCode() {
      this.isLoading = true;
      this.payrolGroupCode = [];

      try {
        // Fetch payroll groups using Supabase composable
        const companyId = this.authStore.getAccountInformation?.companyId || this.authStore.getAccountInformation?.company?.id;
        if (companyId) {
          await this.payrollGroupsComposable.fetchPayrollGroupsByCompany(companyId);
        } else {
          await this.payrollGroupsComposable.fetchPayrollGroups();
        }
        
        // Update local options from composable (payrollGroupOptions is a computed ref)
        this.payrolGroupCode = this.payrollGroupsComposable.payrollGroupOptions.value;
        
        // Set default value if none selected
        if (this.payrolGroupCode.length > 0 && !this.payrollGroupId) {
          this.payrollGroupId = this.payrolGroupCode[0].value;
        }
      } catch (error) {
        console.error("Error fetching payroll groups from Supabase:", error);
        this.$q.notify({
          type: "negative",
          message: "Failed to load payroll groups",
        });
      } finally {
        this.isLoading = false;
      }
    },

    async fetchBranchId() {
      this.isLoading = true;
      this.branchIds = [];
      
      try {
        // Fetch branches using Supabase composable
        const companyId = this.authStore.getAccountInformation?.companyId || this.authStore.getAccountInformation?.company?.id;
        if (companyId) {
          await this.branchesComposable.fetchBranchesByCompany(companyId);
        } else {
          await this.branchesComposable.fetchBranches();
        }
        
        // Update local options from composable (branchOptions is a computed ref)
        this.branchIds = this.branchesComposable.branchOptions.value;
        
        // Set default value if none selected and there are branches
        if (this.branchIds.length > 0 && !this.branchId) {
          this.branchId = this.branchIds[0].value;
        }
      } catch (error) {
        console.error("Error fetching branches from Supabase:", error);
        this.$q.notify({
          type: "negative",
          message: "Failed to load branches",
        });
      } finally {
        this.isLoading = false;
      }
    },
    async setAccountData(accountData) {
      // Show loading while fetching complete account information
      this.$q.loading.show();

      try {
        // Store the account ID for activation
        this.existingAccountId = accountData.id;

        // Fetch complete account information from API
        const response = await api.get(`/account?id=${accountData.id}`);
        const fullAccountData = response.data;

        // Generate employee code
        const firstName = fullAccountData.firstName || "";
        const lastName = fullAccountData.lastName || "";
        const timestamp = Date.now().toString().slice(-4);
        this.employeeId = `${firstName.charAt(0)}${lastName.charAt(
          0
        )}${timestamp}`.toUpperCase();

        // Set account details with fetched data
        this.accountDetails = {
          firstName: fullAccountData.firstName || "",
          lastName: fullAccountData.lastName || "",
          middleName: fullAccountData.middleName || "",
          contactNumber: fullAccountData.contactNumber || "",
          email: fullAccountData.email || "",
          username: fullAccountData.username || "",
          password: "", // User will need to set password for security
          roleID: fullAccountData.role?.id || fullAccountData.roleID || "",
          parentAccountId: fullAccountData.parentAccountId || "",
        };

        // Set default contract details
        this.contractDetails = {
          monthlyRate: 0, // User should set appropriate rate
          employmentStatus: "REGULAR", // Default to regular employment
          startDate: new Date().toISOString().split("T")[0], // Today's date as default
          endDate: "", // Leave empty for regular employees
          contractFileId: "", // User can upload if needed
        };

        // Set default values for required fields if available
        if (this.scheduleOption && this.scheduleOption.length > 0) {
          this.scheduleId = this.scheduleOption[0].value;
        }
        if (this.payrolGroupCode && this.payrolGroupCode.length > 0) {
          this.payrollGroupId = this.payrolGroupCode[0].value;
        }
        if (this.branchIds && this.branchIds.length > 0) {
          this.branchId = this.branchIds[0].value;
        }
      } catch (error) {
        this.handleAxiosError(error);
        this.$refs.dialog.hide();
      } finally {
        this.$q.loading.hide();
      }
    },
  },
};
</script>

<style
  scoped
  lang="scss"
  src="./ManpowerAddEditHRISEmployeeDialog.scss"
></style>
