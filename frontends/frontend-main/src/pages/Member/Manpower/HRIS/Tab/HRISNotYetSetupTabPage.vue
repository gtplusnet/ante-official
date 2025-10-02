<template>
  <div>
    <!-- Use Supabase-enabled table for direct database access -->
    <supabase-g-table 
    :isRowActionEnabled="true" 
    tableKey="notYetSetTabHRIS" 
    supabaseTab="not_yet"
    ref="table">
    <template v-slot:fullName="props">
      <div
        class="clickable-code text-body-small"
        style="display: flex; gap: 3px"
        @click="viewHRISInfo(props)"
      >
        <span>{{
          props.data.firstName.charAt(0).toUpperCase() +
          props.data.firstName.slice(1)
        }}</span>

        <span v-if="props.data.middleName">{{
          props.data.middleName.charAt(0).toUpperCase() +
          props.data.middleName.slice(1)
        }}</span>

        <span>{{
          props.data.lastName.charAt(0).toUpperCase() +
          props.data.lastName.slice(1)
        }}</span>
      </div>
    </template>
    <!-- slot - actions -->
    <template v-slot:row-actions="props">
      <g-button color="gray" variant="text" icon="more_horiz" icon-size="md" round>
        <q-menu auto-close>
          <div class="q-pa-sm">
            <div
              clickable
              @click="activateEmployee(props)"
              class="row q-pa-xs cursor-pointer"
            >
              <div class="text-blue q-pa-xs text-label-medium">Activate Employee</div>
            </div>
            <div
              clickable
              @click="editEmployee(props)"
              class="row q-pa-xs cursor-pointer"
            >
              <div class="text-blue q-pa-xs text-label-medium">Edit</div>
            </div>
            <div
              clickable
              @click="deleteEmployeelGroup()"
              class="row q-pa-xs cursor-pointer"
            >
              <div class="text-blue q-pa-xs text-label-medium">Delete</div>
            </div>
            <div clickable class="row q-pa-xs cursor-pointer">
              <div class="text-blue q-pa-xs text-label-medium">Seperate</div>
            </div>
          </div>
        </q-menu>
      </g-button>
    </template>
    <!------------------------------------------->
    </supabase-g-table>

    <!-- Activation Dialog (Create Employee) -->
  <ManpowerAddEditHRISEmployeeDialog
    ref="activationDialog"
    :isActivation="true"
    @employee-saved="onEmployeeActivated"
  />

  <EditCreateEmployee
    @saveDone="handleSaveDone"
    @close="openEditEmployeeGroupDialog = false"
    :employeeId="selectedEmployeeId"
    v-model="openEditEmployeeGroupDialog"
  />

    <ViewCreateEmployee
      @saveDone="handleSaveDone"
      @edit="openEditPayrollGroup"
      @close="openViewEmployeeGroupDialog = false"
      :createEditEmployee="EmployeeGroupData"
      v-model="openViewEmployeeGroupDialog"
    />
  </div>
</template>

<script>
import SupabaseGTable from "../../../../../components/shared/display/SupabaseGTable.vue";
import GButton from "src/components/shared/buttons/GButton.vue";
import EditCreateEmployee from './dialog/EditCreateEmployee.vue';
import ViewCreateEmployee from './dialog/ViewCreateEmployee.vue';
import ManpowerAddEditHRISEmployeeDialog from '../../dialogs/hris/ManpowerAddEditHRISEmployeeDialog.vue';

export default {
  name: 'HRISNotYetSetTabPage',
  components: {
    SupabaseGTable,
    GButton,
    EditCreateEmployee,
    ViewCreateEmployee,
    ManpowerAddEditHRISEmployeeDialog,
  },
  props: {},
  data: () => ({
    openAddEmployeeGroupDialog: false,
    openEditEmployeeGroupDialog: false,
    openViewEmployeeGroupDialog: false,
    EmployeeGroupData: null,
    selectedEmployeeId: null,
  }),
  watch: {},
  methods: {
    deleteEmployeelGroup() {},
    openEditPayrollGroup() {
      this.openEditEmployeeGroupDialog = true;
      this.openViewEmployeeGroupDialog = false;
    },
    editEmployee(data) {
      this.EmployeeGroupData = data;
      // Extract the employee ID from the data structure
      // NotYetSetup tab has a different data structure
      this.selectedEmployeeId = data?.data?.id || data?.data?.accountId || null;
      this.openEditEmployeeGroupDialog = true;
    },
    viewHRISInfo(data) {
      this.EmployeeGroupData = data;
      this.openViewEmployeeGroupDialog = true;
    },
    activateEmployee(props) {
      // Show the dialog first
      this.$refs.activationDialog.show();

      // Wait for the dialog to be ready and then set the account data
      this.$nextTick(() => {
        // Use the new setAccountData method to properly populate the form
        const dialog = this.$refs.activationDialog;
        if (dialog && dialog.setAccountData) {
          dialog.setAccountData(props.data);
        }
      });
    },
    onEmployeeActivated() {
      // Refresh the table after successful activation
      this.refreshTable();
      this.$q.notify({
        type: 'positive',
        message: 'Employee activated successfully!',
      });
    },
    refreshTable() {
      if (this.$refs.table) {
        this.$refs.table.refetch();
      }
    },

    handleSaveDone() {
      // Refresh local table
      if (this.$refs.table) {
        this.$refs.table.refetch();
      }
      // Emit event to parent
      this.$emit('employee-updated');
    },
  },
};
</script>
