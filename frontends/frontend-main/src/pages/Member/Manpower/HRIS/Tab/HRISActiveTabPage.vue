<template>
  <div>
    <!-- Use Supabase-enabled table for direct database access -->
    <supabase-g-table 
    :isRowActionEnabled="true" 
    tableKey="employeeListTable" 
    supabaseTab="active"
    ref="table">
    <template v-slot:accountDetails="props">
      <div class="clickable-code text-body-small" style="display: flex; gap: 2px" @click="editEmployee(props)" data-testid="employee-name-link">
        <span>{{ props.data.accountDetails.firstName.charAt(0).toUpperCase() + props.data.accountDetails.firstName.slice(1) }}</span>
        <span>{{ props.data.accountDetails.middleName.charAt(0).toUpperCase() + props.data.accountDetails.middleName.slice(1) }}</span>
        <span>{{ props.data.accountDetails.lastName.charAt(0).toUpperCase() + props.data.accountDetails.lastName.slice(1) }}</span>
      </div>
    </template>

    <!-- slot - actions -->
    <template v-slot:row-actions="props">
      <g-button icon="more_horiz" variant="text" round color="grey" icon-size="md" data-testid="employee-actions-menu">
        <q-menu auto-close>
          <div class="q-pa-sm">
            <div clickable @click="editEmployee(props)" class="row q-pa-xs cursor-pointer" data-testid="employee-edit-button">
              <div class="text-blue q-pa-xs text-label-medium">Edit</div>
            </div>
            <div clickable @click="deleteEmployeelGroup(props)" class="row q-pa-xs cursor-pointer">
              <div class="text-blue q-pa-xs text-label-medium">Delete</div>
            </div>

            <div clickable class="row q-pa-xs cursor-pointer">
              <div class="text-blue q-pa-xs">Seperate</div>
            </div>
          </div>
        </q-menu>
      </g-button>
    </template>
    </supabase-g-table>

    <EditCreateEmployee @saveDone="handleSaveDone" @close="openEditEmployeeGroupDialog = false" :employeeId="selectedEmployeeId" v-model="openEditEmployeeGroupDialog" />
  </div>
</template>

<script>
import SupabaseGTable from "../../../../../components/shared/display/SupabaseGTable.vue";
import EditCreateEmployee from './dialog/EditCreateEmployee.vue';
import { api } from 'src/boot/axios';
import GButton from 'src/components/shared/buttons/GButton.vue';

export default {
  name: 'HRISActiveTabPage',
  components: {
    SupabaseGTable,
    EditCreateEmployee,
    GButton,
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
    async deleteEmployeelGroup(props) {
      const accountId = props.data.accountDetails.id || props.data.accountId;
      this.$q
        .dialog({
          title: 'Confirm',
          message: 'Are you sure you want to delete (set inactive) this employee?',
          cancel: true,
          persistent: true,
        })
        .onOk(async () => {
          try {
            await api.delete('/hris/employee/delete', { data: { accountId } });
            this.$q.notify({ type: 'positive', message: 'Employee set as inactive.' });
            
            // Refresh the current tab's table
            this.refreshTable();
            
            // Emit event to parent to refresh other tabs if needed
            this.$emit('employee-deleted');
            
          } catch (e) {
            this.$q.notify({ type: 'negative', message: e.response?.data?.message || 'Failed to delete employee.' });
          }
        });
    },
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

    refreshTable() {
      if (this.$refs.table) {
        this.$refs.table.refetch();
      }
    },

    closeViewDialog() {
      this.openViewEmployeeGroupDialog = false;
      this.EmployeeGroupData = null;
    },

    handleSaveDone() {
      console.log('[DEBUG] HRISActiveTabPage: handleSaveDone method called');
      
      // Refresh local table
      if (this.$refs.table) {
        console.log('[DEBUG] HRISActiveTabPage: Calling refetch on table');
        this.$refs.table.refetch();
      } else {
        console.log('[DEBUG] HRISActiveTabPage: Table ref not found!');
      }
      
      // Emit event to parent
      console.log('[DEBUG] HRISActiveTabPage: Emitting employee-updated event to parent');
      this.$emit('employee-updated');
    },
  },
};
</script>
