<template>
  <g-table
    ref="table"
    :isRowActionEnabled="true"
    tableKey="pettyCashHolder"
    apiUrl="/petty-cash/holder/table"
  >
    <!-- Employee name column -->
    <template v-slot:account-name="props">
      <div>
        <div class="text-weight-medium">{{ props.data.account.name }}</div>
        <div class="text-caption text-grey">{{ props.data.account.email }}</div>
      </div>
    </template>

    <!-- Fund Account column -->
    <template v-slot:fund-account="props">
      <div v-if="props.data.fundAccount">
        <div class="text-weight-medium">{{ props.data.fundAccount.name }}</div>
        <div class="text-caption text-grey">{{ props.data.fundAccount.accountNumber }}</div>
      </div>
      <div v-else class="text-grey">N/A</div>
    </template>

    <!-- Balance column -->
    <template v-slot:balance="props">
      <div>
        <div class="text-weight-medium">
          ₱{{ formatCurrency(props.data.currentBalance) }}
        </div>
        <div class="text-caption text-grey">
          of ₱{{ formatCurrency(props.data.initialAmount) }}
        </div>
        <q-linear-progress
          :value="props.data.currentBalance / props.data.initialAmount"
          color="primary"
          track-color="grey-3"
          style="height: 4px"
          class="q-mt-xs"
        />
      </div>
    </template>

    <!-- Reason column -->
    <template v-slot:reason="props">
      <q-tooltip v-if="props.data.reason.length > 50">
        {{ props.data.reason }}
      </q-tooltip>
      {{ truncateText(props.data.reason, 50) }}
    </template>

    <!-- Created date column -->
    <template v-slot:created-at="props">
      {{ formatDate(props.data.createdAt) }}
    </template>

    <!-- Status column -->
    <template v-slot:status="props">
      <q-chip
        dense
        size="sm"
        :color="props.data.isActive ? 'green' : 'grey'"
        text-color="white"
        :label="props.data.isActive ? 'Active' : 'Inactive'"
      />
    </template>

    <!-- Row actions -->
    <template v-slot:row-actions="props">
      <g-button color="grey" variant="text" icon="more_horiz" round>
        <q-menu auto-close>
          <div class="q-pa-sm">
            <div clickable @click="openRefillDialog(props.data)" class="row q-pa-xs cursor-pointer items-center">
              <q-icon name="account_balance_wallet" color="gray" size="20px" class="q-py-xs"/>
              <span class="text-primary q-pl-xs text-label-medium">Refill/Deduct</span>
            </div>
            <div 
              v-if="props.data.isActive && props.data.currentBalance > 0"
              clickable 
              @click="openReturnDialog(props.data)" 
              class="row q-pa-xs cursor-pointer items-center"
            >
              <q-icon name="undo" color="gray" size="20px" class="q-py-xs"/>
              <span class="text-primary q-pl-xs text-label-medium">Return</span>
            </div>
            <div 
              v-if="props.data.isActive && props.data.currentBalance > 0"
              clickable 
              @click="openTransferDialog(props.data)" 
              class="row q-pa-xs cursor-pointer items-center"
            >
              <q-icon name="swap_horiz" color="gray" size="20px" class="q-py-xs"/>
              <span class="text-primary q-pl-xs text-label-medium">Transfer</span>
            </div>
            <div clickable @click="openHistoryDialog(props.data)" class="row q-pa-xs cursor-pointer items-center">
              <q-icon name="history" color="gray" size="20px" class="q-py-xs"/>
              <span class="text-primary q-pl-xs text-label-medium">View History</span>
            </div>
            <div 
              v-if="props.data.isActive"
              clickable 
              @click="deactivateHolder(props.data)" 
              class="row q-pa-xs cursor-pointer items-center"
            >
              <q-icon name="block" color="negative" size="20px" class="q-py-xs"/>
              <span class="text-negative q-pl-xs text-label-medium">Deactivate</span>
            </div>
          </div>
        </q-menu>
      </g-button>
    </template>
  </g-table>

  <!-- Refill/Deduct Dialog -->
  <petty-cash-refill-dialog
    v-model="isRefillDialogOpen"
    :holderData="selectedHolder"
    @saveDone="$refs.table.refetch()"
  />

  <!-- History Dialog -->
  <ViewPettyCashWidgetDialog
    v-model="isHistoryDialogOpen"
    :holderData="selectedHolder"
  />

  <!-- Return Dialog -->
  <petty-cash-return-dialog
    v-model="isReturnDialogOpen"
    :holderData="selectedHolder"
    @saveDone="$refs.table.refetch()"
  />

  <!-- Transfer Dialog -->
  <petty-cash-transfer-dialog
    v-model="isTransferDialogOpen"
    :holderData="selectedHolder"
    @saveDone="$refs.table.refetch()"
  />
</template>

<script>
import GTable from '../../../../../components/shared/display/GTable.vue';
import GButton from '../../../../../components/shared/buttons/GButton.vue';
import PettyCashRefillDialog from '../../dialogs/PettyCashRefillDialog.vue';
import ViewPettyCashWidgetDialog from 'src/pages/Member/Dashboard/PettyCashWidget/dialog/ViewPettyCashWidgetDialog.vue';
import PettyCashReturnDialog from '../../dialogs/PettyCashReturnDialog.vue';
import PettyCashTransferDialog from '../../dialogs/PettyCashTransferDialog.vue';
import { date } from 'quasar';

export default {
  name: 'TreasuryPettyCashHoldersTable',
  components: {
    GTable,
    GButton,
    PettyCashRefillDialog,
    ViewPettyCashWidgetDialog,
    PettyCashReturnDialog,
    PettyCashTransferDialog
  },
  data() {
    return {
      isRefillDialogOpen: false,
      isHistoryDialogOpen: false,
      isReturnDialogOpen: false,
      isTransferDialogOpen: false,
      selectedHolder: null
    };
  },
  methods: {
    formatCurrency(value) {
      return new Intl.NumberFormat('en-PH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(value || 0);
    },
    formatDate(dateString) {
      return date.formatDate(dateString, 'MMM DD, YYYY');
    },
    truncateText(text, maxLength) {
      if (text.length <= maxLength) return text;
      return text.substring(0, maxLength) + '...';
    },
    openRefillDialog(holder) {
      this.selectedHolder = holder;
      this.isRefillDialogOpen = true;
    },
    openHistoryDialog(holder) {
      this.selectedHolder = holder;
      this.isHistoryDialogOpen = true;
    },
    openReturnDialog(holder) {
      this.selectedHolder = holder;
      this.isReturnDialogOpen = true;
    },
    openTransferDialog(holder) {
      this.selectedHolder = holder;
      this.isTransferDialogOpen = true;
    },
    async deactivateHolder(holder) {
      this.$q.dialog({
        title: 'Confirm Deactivation',
        message: `Are you sure you want to deactivate petty cash for <strong>${holder.account.name}</strong>?`,
        html: true,
        cancel: true,
        persistent: true
      }).onOk(async () => {
        try {
          await this.$api.patch(`/petty-cash/holder/${holder.id}/deactivate`);
          this.$q.notify({
            type: 'positive',
            message: 'Petty cash holder deactivated successfully'
          });
          this.$refs.table.refetch();
        } catch (error) {
          this.handleAxiosError(error);
        }
      });
    }
  }
};
</script>