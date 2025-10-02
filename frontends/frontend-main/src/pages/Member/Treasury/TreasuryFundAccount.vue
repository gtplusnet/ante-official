<template>
  <expanded-nav-page-container>
    <treasury-header></treasury-header>
    <div class="page-content">
      <div class="text-right">
        <q-btn
          @click="addFundAccount"
          no-caps
          color="primary"
          rounded
          unelevated
          class="text-label-large"
        >
          <q-icon name="add"></q-icon>
          Add Fund Account
        </q-btn>
      </div>
      <g-card class="q-pa-md q-mt-sm">
        <g-table
          ref="table"
          :isRowActionEnabled="true"
          tableKey="fundAccount"
          apiUrl="/fund-account"
          :apiFilters="[{ deleted: false }]"
        >
          <template v-slot:row-actions="props">
            <q-btn
              rounded
              class="q-mr-sm text-label-medium"
              @click="viewTransactions(props.data)"
              no-caps
              color="primary"
              outline
            >
              <q-icon class="q-mr-sm" size="20px" name="money"></q-icon>
              View Transactions
            </q-btn>
            <q-btn
              rounded
              class="q-mr-sm text-label-medium"
              @click="editFundAccount(props.data)"
              no-caps
              color="primary"
              outline
            >
              <q-icon class="q-mr-sm" size="20px" name="edit"></q-icon> Edit
            </q-btn>
          </template>
        </g-table>
      </g-card>
    </div>
  </expanded-nav-page-container>

  <!-- add/edit fund account -->
  <add-edit-fund-account-dialog
    :fundAccountInformation="fundAccountInformation"
    v-model="isFundAccountDialogOpen"
    @close="isFundAccountDialogOpen = false"
    @saveDone="this.$refs.table.refetch()"
  >
  </add-edit-fund-account-dialog>

  <!-- fund account transactions -->
  <fund-account-transactions-dialog
    v-if="fundAccountId"
    :fundAccountId="fundAccountId"
    v-model="isFundAccountTransactionsDialogOpen"
    @saveDone="this.$refs.table.refetch()"
    @close="isFundAccountTransactionsDialogOpen = false"
  >
  </fund-account-transactions-dialog>
</template>

<script>
import TreasuryHeader from './TreasuryHeader.vue';
import AddEditFundAccountDialog from './dialogs/TreasuryAddEditFundAccountDialog.vue';
import GTable from "../../../components/shared/display/GTable.vue";
import GCard from "../../../components/shared/display/GCard.vue";
import FundAccountTransactionsDialog from './dialogs/TreasuryFundAccountTransactionsDialog.vue';
import ExpandedNavPageContainer from '../../../components/shared/ExpandedNavPageContainer.vue';

export default {
  name: 'MemberTreasuryFundAccount',
  components: {
    ExpandedNavPageContainer,
    TreasuryHeader,
    GTable,
    GCard,
    AddEditFundAccountDialog,
    FundAccountTransactionsDialog,
  },
  props: {},
  data: () => ({
    form: {},
    fundAccountInformation: null,
    isFundAccountDialogOpen: false,
    fundAccountId: null,
    isFundAccountTransactionsDialogOpen: false,
  }),
  mounted() {},
  methods: {
    addFundAccount() {
      this.fundAccountInformation = null;
      this.isFundAccountDialogOpen = true;
    },
    editFundAccount(data) {
      this.fundAccountInformation = data;
      this.isFundAccountDialogOpen = true;
    },
    viewTransactions(data) {
      this.fundAccountId = data.id;
      this.isFundAccountTransactionsDialogOpen = true;
    },
  },
  computed: {},
};
</script>
