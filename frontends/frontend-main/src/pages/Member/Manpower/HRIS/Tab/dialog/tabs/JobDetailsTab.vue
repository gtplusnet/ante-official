<template>
  <div>
    <div>
      <!-- Banking Information Section -->

      <div class="md3-surface">
        <div class="section-header q-mb-md">
          <h6 class="q-mt-none q-mb-sm text-weight-medium">Banking Information</h6>
        </div>

        <div class="row q-col-gutter-x-sm">
          <div class="col-12 col-sm-6">
            <g-input type="select" apiUrl="select-box/bank-list" v-model="jobDetails.bankName" label="Bank Name" />
          </div>
          <div class="col-12 col-sm-6">
            <g-input label="Bank Account Number" v-model="jobDetails.bankAccountNumber" />
          </div>
        </div>
      </div>

      <div class="md3-surface">
        <!-- Work Information Section -->
        <div class="section-header q-mb-md">
          <h6 class="q-mt-none q-mb-sm text-weight-medium">Work Information</h6>
        </div>

        <div class="row q-col-gutter-x-sm">
          <div class="col-12 col-sm-6 col-md-4">
            <g-input label="Biometrics Number" v-model="jobDetails.biometricsNumber" />
          </div>
          <div class="col-12 col-sm-6 col-md-4">
            <div class="q-mb-xs">Branch</div>
            <q-select
              :options="branchOptions"
              v-model="jobDetails.branchId"
              dense
              outlined
              options-dense
              emit-value
              map-options
              option-value="value"
              option-label="label"
              placeholder="Select Branch"
              class="full-width"
            />
          </div>
          <div class="col-12 col-sm-6 col-md-4">
            <g-input
              type="select"
              apiUrl="select-box/departmentList"
              v-model="departmentId"
              label="Department"
              @input="onDepartmentChange"
            />
          </div>
          <div class="col-12 col-sm-6 col-md-4">
            <g-input
              type="select"
              :apiUrl="`select-box/role-list?roleGroupId=${departmentId || ''}`"
              v-model="roleId"
              label="Role / Position"
              @input="onRoleChange"
            />
          </div>
          <div class="col-12 col-sm-6 col-md-8">
            <g-input
              type="select"
              :apiUrl="roleId ? `select-box/parent-user-list?id=${roleId}` : null"
              v-model="parentAccountId"
              label="Reports to (Immediate Supervisor)"
              :disabled="isLevel0Role"
              :hint="isLevel0Role ? 'Level 0 roles cannot have a parent user' : ''"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss" src="../EditCreateEmployee.scss"></style>

<script>
import GInput from "../../../../../../../components/shared/form/GInput.vue";
import { api } from "src/boot/axios";
import { useSupabaseBranches } from "src/composables/supabase/useSupabaseBranches";
import { useAuthStore } from "src/stores/auth";

export default {
  name: "JobDetailsTab",
  setup() {
    // Initialize Supabase composables
    const branchesComposable = useSupabaseBranches();
    const authStore = useAuthStore();

    return {
      branchesComposable,
      authStore,
    };
  },
  components: {
    GInput,
  },
  props: {
    employeeData: {
      type: Object,
      default: () => ({}),
    },
  },
  emits: ["cancel", "update", "update-complete"],
  computed: {
    isLevel0Role() {
      return this.currentRoleLevel === 0;
    },
  },
  data: () => ({
    isLoading: false,
    branchOptions: [],
    jobDetails: {
      bankName: "",
      bankAccountNumber: "",
      biometricsNumber: "",
      branchId: null,
    },
    departmentId: "",
    roleId: "",
    parentAccountId: "",
    currentRoleLevel: null,
  }),
  mounted() {
    this.fetchBranches();
    this.populateFormData();
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
    populateFormData() {
      if (this.employeeData && this.employeeData.data) {
        const { accountDetails, jobDetails, branch } = this.employeeData.data;

        // Populate job details if they exist
        if (jobDetails) {
          this.jobDetails = {
            bankName: jobDetails.bankName || "",
            bankAccountNumber: jobDetails.bankAccountNumber || "",
            biometricsNumber: jobDetails.biometricsNumber || "",
            branchId: branch?.id ? Number(branch.id) : null,
          };
        } else {
          // If no job details yet, at least set branch
          this.jobDetails.branchId = branch?.id ? Number(branch.id) : null;
        }

        // Set role and parent account
        this.roleId = accountDetails.roleId || accountDetails.roleID || "";

        // Set role level if available
        if (accountDetails.role && accountDetails.role.level !== undefined) {
          this.currentRoleLevel = accountDetails.role.level;
        }

        // Only set parentAccountId if not a Level 0 role
        if (this.currentRoleLevel !== 0) {
          this.parentAccountId = accountDetails.parentAccountId || "";
        } else {
          this.parentAccountId = "";
        }

        // Set department from role's roleGroupId if available
        if (accountDetails.role && accountDetails.role.roleGroupId) {
          this.departmentId = accountDetails.role.roleGroupId;
        }
      }
    },

    async fetchBranches() {
      try {
        const companyId =
          this.authStore.getAccountInformation?.companyId || this.authStore.getAccountInformation?.company?.id;
        if (companyId) {
          await this.branchesComposable.fetchBranchesByCompany(companyId);
        } else {
          await this.branchesComposable.fetchBranches();
        }
        this.branchOptions = this.branchesComposable.branchOptions.value;
      } catch (error) {
        console.error("Error fetching branches:", error);
        this.$q.notify({
          type: "negative",
          message: "Failed to load branches",
        });
      } finally {
        this.isLoading = false;
      }
    },

    onDepartmentChange() {
      // Clear role selection when department changes
      this.roleId = "";
      this.parentAccountId = "";
    },

    async onRoleChange() {
      // Clear parent account when role changes
      this.parentAccountId = "";

      // Check if the selected role is Level 0
      if (this.roleId) {
        try {
          const response = await api.get(`/role/${this.roleId}`);
          if (response.data && response.data.level !== undefined) {
            this.currentRoleLevel = response.data.level;

            // If Level 0 role, ensure parentAccountId is cleared
            if (response.data.level === 0) {
              this.parentAccountId = "";
            }
          }
        } catch (error) {
          console.error("Error fetching role details:", error);
          // If we can't fetch role details, check from employeeData
          if (this.employeeData?.data?.accountDetails?.role?.level !== undefined) {
            this.currentRoleLevel = this.employeeData.data.accountDetails.role.level;
          }
        }
      } else {
        this.currentRoleLevel = null;
      }
    },

    updateJobDetails() {
      this.$q.loading.show();

      const params = {
        accountId: this.employeeData.data.accountDetails.id,
        jobDetails: {
          bankName: this.jobDetails.bankName || null,
          bankAccountNumber: this.jobDetails.bankAccountNumber || null,
          biometricsNumber: this.jobDetails.biometricsNumber || null,
        },
        branchId: this.jobDetails.branchId ? Number(this.jobDetails.branchId) : null,
        roleId: this.roleId || undefined,
        parentAccountId: this.isLevel0Role ? undefined : this.parentAccountId || undefined,
      };

      api
        .patch("/hris/employee/update-job-details", params)
        .then(() => {
          this.$emit("update");
          this.$q.notify({
            type: "positive",
            message: "Job details updated successfully",
          });
        })
        .catch((error) => {
          console.error("Error updating job details:", error);
          this.$q.notify({
            type: "negative",
            message: "Failed to update job details",
          });
        })
        .finally(() => {
          this.$q.loading.hide();
          // Emit a completion event to reset parent's loading state
          this.$emit("update-complete");
        });
    },
  },
};
</script>

<style scoped lang="scss">
.section-header {
}
</style>
