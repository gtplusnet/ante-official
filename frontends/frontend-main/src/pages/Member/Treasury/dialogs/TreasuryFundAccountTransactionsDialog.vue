<template>
  <q-dialog @before-show="fetchData">
    <q-card class="full-width dialog-card">
      <q-bar class="bg-primary text-white cursor-default" dark>
        <q-icon name="list" />
        <div v-if="fundAccountInformation" class="text-title-medium">Transactions ({{ fundAccountInformation.name }} - {{
          fundAccountInformation.accountNumber }})</div>
        <div v-else class="text-title-medium">Fund Account Transactions</div>

        <q-space />

        <q-btn dense flat icon="close" v-close-popup>
          <q-tooltip>Close</q-tooltip>
        </q-btn>
      </q-bar>

      <!-- actions -->
      <q-card-section>
        <div class="actions text-right">
          <q-btn @click="openTransferMoneyDialog" dense no-caps class="q-mr-sm text-label-medium" size="12px" flat rounded
            color="primary">
            <q-icon class="q-mr-xs" size="16px" name="trending_up"></q-icon> Transfer Money
          </q-btn>
          <q-btn @click="openAddDeductMoneyDialog('ADD')" dense no-caps class="q-mr-sm text-label-medium" size="12px" flat rounded
            color="primary">
            <q-icon class="q-mr-xs" size="16px" name="add_circle"></q-icon> Add Money
          </q-btn>
          <q-btn @click="openAddDeductMoneyDialog('SUBTRACT')" dense no-caps class="q-mr-sm text-label-medium " size="12px" flat rounded
            color="primary">
            <q-icon class="q-mr-xs" size="16px" name="remove_circle"></q-icon> Deduct Money
          </q-btn>

        </div>
      </q-card-section>

      <!-- table -->
      <q-card-section v-if="fundAccountInformation">
        <GTable ref="table" :isRowActionEnabled="false" tableKey="fundTransaction" apiUrl="/fund-account/transaction"
          :apiFilters="[{ fundAccountId: fundAccountInformation.id }]">
          <template v-slot:amount="props">
            <span :class="props.data.type == 'ADD' ? 'text-black' : 'text-red'">{{ props.data.amount.formatCurrency
              }}</span>
          </template>
        </GTable>
      </q-card-section>

      <!-- page loading -->
      <q-card-section v-else>
        <div class="q-mt-lg">
          <GlobalLoader />
        </div>
      </q-card-section>
    </q-card>

    <!-- Add / Deduct Money Dialog -->
    <AddDeductMoneyDialog @close="$refs.table.refetch(); $emit('saveDone')"
      @saveDone="$refs.table.refetch(); $emit('saveDone')" v-model="isAddDeductMoneyDialogVisible"
      :type="transactionType" :fundAccountId="fundAccountId" />

    <!-- Transfer Money Dialog -->
    <TransferMoneyDialog @close="$refs.table.refetch(); $emit('saveDone')"
      @saveDone="$refs.table.refetch(); $emit('saveDone')" v-model="isTransferMoneyDialogVisible"
      :fundAccountId="fundAccountId" />
  </q-dialog>
</template>

<style scoped lang="scss">
.dialog-card {
  max-width: 1100px;
  min-height: 600px;
}
</style>

<script>
import { api } from 'src/boot/axios';
import GTable from "../../../../components/shared/display/GTable.vue";
import GlobalLoader from "../../../../components/shared/common/GlobalLoader.vue";
import AddDeductMoneyDialog from "../../../../components/dialog/AddDeductMoneyDialog.vue";
import TransferMoneyDialog from "../../../../pages/Member/Asset/dialogs/AssetTransferMoneyDialog.vue";

export default {
  name: 'FundAccountTransactionsDialog',
  components: {
    GTable,
    AddDeductMoneyDialog,
    TransferMoneyDialog,
    GlobalLoader,
  },
  props: {
    fundAccountId: {
      type: Number,
      required: true,
    },
  },
  data: () => ({
    fundAccountInformation: null,
    isAddDeductMoneyDialogVisible: false,
    isTransferMoneyDialogVisible: false,
    transactionType: 'ADD',
  }),
  watch: {
  },
  methods: {
    openTransferMoneyDialog() {
      this.isTransferMoneyDialogVisible = true;
    },
    openAddDeductMoneyDialog(type) {
      this.transactionType = type;
      this.isAddDeductMoneyDialogVisible = true;
    },
    async fetchData() {
      this.fundAccountInformation = null;
      try {
        const response = await api.get('/fund-account', {
          params: {
            id: this.fundAccountId,
          },
        });

        this.fundAccountInformation = response.data;
      } catch (error) {
        console.error(error);
      }
    },
  },
};
</script>
