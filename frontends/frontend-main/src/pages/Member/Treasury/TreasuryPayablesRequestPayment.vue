<template>
  <expanded-nav-page-container>
    <treasury-header></treasury-header>
    <div class="page-content">
      <div class="page-content-actions row justify-end">
        <q-btn
          no-caps
          color="primary"
          rounded
          unelevated
          class="text-label-large"
          @click="openCreateRequestPaymentDialog()"
        >
          <q-icon size="16px" name="add"></q-icon>
          Request Payment
        </q-btn>
      </div>
      <g-card class="q-pa-md q-mt-sm">
        <RequestPaymentTable ref="requestPaymentTable" />
      </g-card>
    </div>
  </expanded-nav-page-container>
</template>

<script>
import TreasuryHeader from './TreasuryHeader.vue';
import GCard from "../../../components/shared/display/GCard.vue";
import ExpandedNavPageContainer from '../../../components/shared/ExpandedNavPageContainer.vue';
import RequestPaymentTable from "../../../pages/Member/Treasury/components/tables/TreasuryRequestPaymentTable.vue";

export default {
  name: 'TreasuryPayablesRequestPayment',
  components: {
    ExpandedNavPageContainer,
    TreasuryHeader,
    GCard,
    RequestPaymentTable,
  },
  methods: {
    openCreateRequestPaymentDialog() {
      this.$refs.requestPaymentTable.openCreateRequestPaymentDialog();
    },
  },
};
</script>