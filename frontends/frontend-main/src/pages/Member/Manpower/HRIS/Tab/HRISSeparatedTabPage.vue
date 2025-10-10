<template>
  <div>
    <!-- Use API-based table -->
    <!-- TODO: Backend needs to add support for filtering separated employees (contract end date not null) -->
    <g-table
    :isRowActionEnabled="true"
    tableKey="employeeListTable"
    apiUrl="/hris/employee/table-lite"
    :apiFilters="[]"
    ref="table">
    <template v-slot:accountDetails="props">
      <div
        class="clickable-code text-body-small"
        style="display: flex; gap: 3px"
        @click="viewHRISInfo(props)"
      >
        <span>{{
          props.data.accountDetails.firstName.charAt(0).toUpperCase() +
          props.data.accountDetails.firstName.slice(1)
        }}</span>

        <span>{{
          props.data.accountDetails.middleName.charAt(0).toUpperCase() +
          props.data.accountDetails.middleName.slice(1)
        }}</span>

        <span>{{
          props.data.accountDetails.lastName.charAt(0).toUpperCase() +
          props.data.accountDetails.lastName.slice(1)
        }}</span>
      </div>
    </template>
    <!-- slot - actions -->
    <template v-slot:row-actions="props">
      <g-button color="grey" variant="text" icon="more_horiz" icon-size="md" round>
        <q-menu auto-close>
          <div class="q-pa-sm">
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
              <div class="text-blue q-pa-xs text-label-medium">Seperated</div>
            </div>
          </div>
        </q-menu>
      </g-button>
    </template>
    <!------------------------------------------->
    </g-table>

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
import GTable from "../../../../../components/shared/display/GTable.vue";
import GButton from "src/components/shared/buttons/GButton.vue";
import EditCreateEmployee from './dialog/EditCreateEmployee.vue';
import ViewCreateEmployee from './dialog/ViewCreateEmployee.vue';

export default {
  name: 'HRISSeparatedTabPage',
  components: {
    GTable,
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
