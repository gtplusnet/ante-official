<template>
  <expanded-nav-page-container>
    <div class="page-head q-pb-md">
      <div class="row items-center justify-between full-width">
        <div>
          <div class="text-title-large">Payroll Group</div>
          <div>
            <q-breadcrumbs class="text-body-small">
              <q-breadcrumbs-el label="Manpower" :to="{ name: 'member_manpower' }" />
              <q-breadcrumbs-el label="Configuration" />
              <q-breadcrumbs-el label="Payroll Group" />
            </q-breadcrumbs>
          </div>
        </div>
        <div class="text-right">
          <g-button @click="openAddPayrollDialog()" color="primary" icon="add" icon-size="md" label="Add Payroll Group" class="text-label-large" />
        </div>
      </div>
    </div>

    <g-card class="q-pa-md">
      <g-table :isRowActionEnabled="true" tableKey="payrollGroupTable" apiUrl="hr-configuration/payroll-group/table" ref="table">
        <!-- slot - actions -->
        <template v-slot:period="props">
          <span v-if="props.data.cutoff.cutoffType == 'SEMIMONTHLY'"> SEMI-MONTHLY </span>
          <span v-else>{{ props.data.cutoff.cutoffType }}</span>
        </template>

        <template v-slot:row-actions="props">
          <g-button color="grey" variant="text" icon="more_horiz" icon-size="md" round>
            <q-menu auto-close>
              <div class="q-pa-sm">
                <div clickable @click="viewPayrollGroup(props)" class="row q-pa-xs cursor-pointer items-center">
                  <q-icon name="visibility" color="gray" size="20px" class="q-py-xs"/>
                  <span class="text-primary q-pl-xs text-label-medium">View</span>
                </div>
                <div clickable @click="editPayrollGroup(props)" class="row q-pa-xs cursor-pointer items-center">
                  <q-icon name="edit" color="gray" size="20px" class="q-py-xs"/>
                  <span class="text-primary q-pl-xs text-label-medium">Edit</span>
                </div>
                <div clickable @click="deletePayrollGroup(props.data)" class="row q-pa-xs cursor-pointer items-center">
                  <q-icon name="delete" color="negative" size="20px" class="q-py-xs"/>
                  <span class="text-negative q-pl-xs text-label-medium">Delete</span>
                </div>
              </div>
            </q-menu>
          </g-button>
        </template>
      </g-table>
    </g-card>

    <ViewPayrollGroupDialog @close="openAddPayrollGroupDialog = false" @edit="openEditPayrollGroup" :payrollGroupData="payrollGroupData" v-model="openViewPayrollGroupDialog" />

    <AddEditPayrollGroupDialog @saveDone="this.$refs.table.refetch()" @close="openAddPayrollGroupDialog = false" :payrollGroupData="payrollGroupData" v-model="openAddPayrollGroupDialog" />
  </expanded-nav-page-container>
</template>

<script>
import { defineAsyncComponent } from 'vue';
import GTable from "src/components/shared/display/GTable.vue";
import GCard from "src/components/shared/display/GCard.vue";
import GButton from "src/components/shared/buttons/GButton.vue";
import { api } from 'src/boot/axios';
import ExpandedNavPageContainer from 'src/components/shared/ExpandedNavPageContainer.vue';

// Lazy-loaded dialogs (ALL dialogs must be lazy loaded - CLAUDE.md)
const AddEditPayrollGroupDialog = defineAsyncComponent(() =>
  import('../dialogs/configuration/ManpowerAddEditPayrollGroupDialog.vue')
);
const ViewPayrollGroupDialog = defineAsyncComponent(() =>
  import('../dialogs/configuration/ManpowerViewPayrollGroupDialog.vue')
);

export default {
  name: 'PayrollGroupPage',
  components: {
    AddEditPayrollGroupDialog,
    ViewPayrollGroupDialog,
    GTable,
    GCard,
    GButton,
    ExpandedNavPageContainer,
  },
  data: () => ({
    openAddPayrollGroupDialog: false,
    openViewPayrollGroupDialog: false,
    payrollGroupData: null,
  }),
  mounted() {},
  methods: {
    deletePayrollGroup(data) {
      this.$q
        .dialog({
          title: 'Delete Payroll Group',
          message: 'Are you sure you want to delete this payroll group?',
          cancel: true,
          persistent: true,
        })
        .onOk(() => {
          this.callDeleteAPI(data);
        });
    },
    callDeleteAPI(data) {
      this.$q.loading.show({
        message: 'Deleting payroll group...',
      });

      api
        .delete(`hr-configuration/payroll-group/delete?id=${data.id}`)
        .then(() => {
          this.$q.notify({
            type: 'positive',
            message: 'Payroll group deleted successfully',
          });
          this.$refs.table.refetch();
        })
        .catch((error) => {
          this.$q.notify({
            type: 'negative',
            message: error.response.data.message,
          });
        })
        .finally(() => {
          this.$q.loading.hide();
        });
    },
    openEditPayrollGroup(data) {
      this.payrollGroupData = data;
      this.openAddPayrollGroupDialog = true;
    },
    openAddPayrollDialog() {
      this.payrollGroupData = null;
      this.openAddPayrollGroupDialog = true;
    },
    viewPayrollGroup(data) {
      this.payrollGroupData = data;
      this.openViewPayrollGroupDialog = true;
    },
    editPayrollGroup(data) {
      this.payrollGroupData = data;
      this.openAddPayrollGroupDialog = true;
    },
  },
};
</script>
