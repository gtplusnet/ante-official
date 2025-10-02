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
          @click="openPurchaseOrderDialog()"
        >
          <q-icon size="16px" name="add"></q-icon>
          Create Purchase Order
        </q-btn>
      </div>
      <g-card class="q-pa-md q-mt-sm">
        <PurchaseOrderTable ref="purchaseOrderTable" />
      </g-card>
    </div>
  </expanded-nav-page-container>
</template>

<script>
import TreasuryHeader from './TreasuryHeader.vue';
import GCard from "../../../components/shared/display/GCard.vue";
import ExpandedNavPageContainer from '../../../components/shared/ExpandedNavPageContainer.vue';
import PurchaseOrderTable from "../../../components/tables/PurchaseOrderTable.vue";

export default {
  name: 'TreasuryPayablesPurchaseOrder',
  components: {
    ExpandedNavPageContainer,
    TreasuryHeader,
    GCard,
    PurchaseOrderTable,
  },
  methods: {
    openPurchaseOrderDialog() {
      this.$refs.purchaseOrderTable.openPurchaseOrderDialog();
    },
  },
};
</script>