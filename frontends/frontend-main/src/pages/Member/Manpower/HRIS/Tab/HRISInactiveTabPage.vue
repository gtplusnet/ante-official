<template>
  <div>
    <!-- Use Supabase-enabled table for direct database access -->
    <supabase-g-table 
    :isRowActionEnabled="true" 
    tableKey="employeeListTable" 
    supabaseTab="inactive"
    ref="table">
    <template v-slot:accountDetails="props">
      <div class="clickable-code text-body-small" style="display: flex; gap: 2px" @click="viewHRISInfo(props)">
        <span>{{ props.data.accountDetails.firstName.charAt(0).toUpperCase() + props.data.accountDetails.firstName.slice(1) }}</span>

        <span>{{ props.data.accountDetails.middleName.charAt(0).toUpperCase() + props.data.accountDetails.middleName.slice(1) }}</span>

        <span>{{ props.data.accountDetails.lastName.charAt(0).toUpperCase() + props.data.accountDetails.lastName.slice(1) }}</span>
      </div>
    </template>

    <!-- slot - actions -->
    <template v-slot:row-actions="props">
      <g-button color="gray" variant="text" icon="more_horiz" icon-size="md" round>
        <q-menu auto-close>
          <div class="q-pa-sm">
            <div clickable @click="editEmployee(props)" class="row q-pa-xs cursor-pointer">
              <div class="text-blue q-pa-xs text-label-medium">Edit</div>
            </div>
            <div clickable @click="restoreEmployee(props)" class="row q-pa-xs cursor-pointer">
              <div class="text-blue q-pa-xs text-label-medium">Restore</div>
            </div>
          </div>
        </q-menu>
      </g-button>
    </template>
    <!------------------------------------------->
    </supabase-g-table>

    <EditCreateEmployee @saveDone="handleSaveDone" @close="openEditEmployeeGroupDialog = false" :employeeId="selectedEmployeeId" v-model="openEditEmployeeGroupDialog" />

    <ViewCreateEmployee @saveDone="handleSaveDone" @close="openViewEmployeeGroupDialog = false" @edit="openEditPayrollGroup" :createEditEmployee="EmployeeGroupData" v-model="openViewEmployeeGroupDialog" />
  </div>
</template>

<script>
import SupabaseGTable from "../../../../../components/shared/display/SupabaseGTable.vue";
import GButton from "src/components/shared/buttons/GButton.vue";
import EditCreateEmployee from './dialog/EditCreateEmployee.vue';
import ViewCreateEmployee from './dialog/ViewCreateEmployee.vue';
import { api } from 'src/boot/axios';

export default {
  name: 'HRISInactiveTabPage',
  components: {
    SupabaseGTable,
    GButton,
    EditCreateEmployee,
    ViewCreateEmployee,
  },
  props: {},
  data: () => ({
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
      this.selectedEmployeeId = data?.data?.accountDetails?.id || data?.data?.accountId || null;
      this.openEditEmployeeGroupDialog = true;
    },
    viewHRISInfo(data) {
      this.EmployeeGroupData = data;
      this.openViewEmployeeGroupDialog = true;
    },
    async restoreEmployee(props) {
      const accountId = props.data.accountDetails.id || props.data.accountId;
      this.$q
        .dialog({
          title: 'Confirm',
          message: 'Are you sure you want to restore this employee?',
          cancel: true,
          persistent: true,
        })
        .onOk(async () => {
          try {
            await api.patch('/hris/employee/restore', { accountId });
            this.$q.notify({ type: 'positive', message: 'Employee restored.' });
            this.refreshTable();
          } catch (e) {
            this.$q.notify({ type: 'negative', message: e.response?.data?.message || 'Failed to restore employee.' });
          }
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
