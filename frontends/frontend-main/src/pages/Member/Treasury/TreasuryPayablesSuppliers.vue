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
          @click="editSupplier(null)"
        >
          <q-icon size="16px" name="add"></q-icon>
          Add Supplier
        </q-btn>
      </div>
      <g-card class="q-pa-md q-mt-sm">
        <SupplierTable ref="supplierTable" />
      </g-card>
    </div>
  </expanded-nav-page-container>
</template>

<script>
import TreasuryHeader from './TreasuryHeader.vue';
import GCard from "../../../components/shared/display/GCard.vue";
import ExpandedNavPageContainer from '../../../components/shared/ExpandedNavPageContainer.vue';
import SupplierTable from "../../../components/tables/SupplierTable.vue";

export default {
  name: 'TreasuryPayablesSuppliers',
  components: {
    ExpandedNavPageContainer,
    TreasuryHeader,
    GCard,
    SupplierTable,
  },
  methods: {
    editSupplier(supplier) {
      this.$refs.supplierTable.editSupplier(supplier);
    },
  },
};
</script>