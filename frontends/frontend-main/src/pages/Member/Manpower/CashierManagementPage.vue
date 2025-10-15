<template>
  <expanded-nav-page-container>
    <div class="page-head">
      <div class="text-title-large">Cashier Management</div>

      <div class="q-gutter-sm">
        <g-button
          @click="openDialog()"
          label="Create Cashier"
          icon="add"
          color="primary"
          size="md"
          data-testid="create-cashier-button"
        />
      </div>
    </div>

    <div class="bread-crumbs">
      <q-breadcrumbs class="text-body-small">
        <q-breadcrumbs-el label="Manpower" :to="{ name: 'member_manpower' }" />
        <q-breadcrumbs-el label="Cashier Management" />
      </q-breadcrumbs>
    </div>

    <div class="q-mt-md">
      <!-- Use API-based table -->
      <g-table
        :isRowActionEnabled="true"
        tableKey="cashierListTable"
        apiUrl="/cashier/table"
        ref="table">

        <!-- Account name slot -->
        <template v-slot:account="props">
          <div
            class="clickable-code text-body-small"
            style="display: flex; gap: 4px"
            @click="editCashier(props)"
            data-testid="cashier-name-link">
            <span>{{ props.data.account?.firstName || '' }}</span>
            <span>{{ props.data.account?.lastName || '' }}</span>
          </div>
        </template>

        <!-- Cashier code slot -->
        <template v-slot:cashierCode="props">
          <div class="text-body-small">
            {{ props.data.cashierCode }}
          </div>
        </template>

        <!-- Status slot -->
        <template v-slot:isActive="props">
          <q-badge
            :color="props.data.isActive ? 'positive' : 'grey'"
            :label="props.data.isActive ? 'Active' : 'Inactive'"
          />
        </template>

        <!-- Row actions -->
        <template v-slot:row-actions="props">
          <g-button
            icon="more_horiz"
            variant="text"
            round
            color="grey"
            icon-size="md"
            data-testid="cashier-actions-menu">
            <q-menu auto-close>
              <div class="q-pa-sm">
                <div
                  clickable
                  @click="editCashier(props)"
                  class="row q-pa-xs cursor-pointer"
                  data-testid="cashier-edit-button">
                  <div class="text-blue q-pa-xs text-label-medium">Edit</div>
                </div>
                <div
                  clickable
                  @click="deleteCashier(props)"
                  class="row q-pa-xs cursor-pointer">
                  <div class="text-blue q-pa-xs text-label-medium">Delete</div>
                </div>
              </div>
            </q-menu>
          </g-button>
        </template>
      </g-table>
    </div>

    <AddEditCashierDialog
      ref="dialogCreate"
      @cashier-saved="handleCashierSaved"
    />
  </expanded-nav-page-container>
</template>

<script>
import { defineAsyncComponent } from 'vue';
import GTable from '../../../components/shared/display/GTable.vue';
import ExpandedNavPageContainer from '../../../components/shared/ExpandedNavPageContainer.vue';
import { api } from 'src/boot/axios';
import { handleAxiosError } from 'src/utility/axios.error.handler';
import GButton from 'src/components/shared/buttons/GButton.vue';

// Lazy-loaded dialog (TASK-008: Bundle optimization)
const AddEditCashierDialog = defineAsyncComponent(() =>
  import('./dialogs/cashier/ManpowerAddEditCashierDialog.vue')
);

export default {
  name: 'CashierManagementPage',
  components: {
    GTable,
    AddEditCashierDialog,
    ExpandedNavPageContainer,
    GButton,
  },
  data: () => ({
    selectedCashierAccountId: null,
  }),
  methods: {
    async deleteCashier(props) {
      const accountId = props.data.accountId;
      this.$q
        .dialog({
          title: 'Confirm',
          message: 'Are you sure you want to delete (set inactive) this cashier?',
          cancel: true,
          persistent: true,
        })
        .onOk(async () => {
          try {
            await api.delete(`/cashier/${accountId}`);
            this.$q.notify({
              type: 'positive',
              message: 'Cashier set as inactive.'
            });
            this.refreshTable();
          } catch (e) {
            handleAxiosError(this.$q, e);
          }
        });
    },
    openDialog() {
      if (this.$refs.dialogCreate) {
        this.$refs.dialogCreate.show();
      }
    },
    editCashier(data) {
      this.selectedCashierAccountId = data?.data?.accountId || null;
      if (this.$refs.dialogCreate) {
        this.$refs.dialogCreate.show(this.selectedCashierAccountId);
      }
    },
    refreshTable() {
      if (this.$refs.table) {
        this.$refs.table.refetch();
      }
    },
    handleCashierSaved() {
      this.refreshTable();
    },
  },
};
</script>
