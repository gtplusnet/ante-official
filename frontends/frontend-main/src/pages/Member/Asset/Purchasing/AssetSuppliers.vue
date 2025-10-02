<template>
  <expanded-nav-page-container>
    <div class="page-head">
      <div class="title text-headline-small">Suppliers</div>
    </div>
    <div class="bread-crumbs text-body-small">
      <q-breadcrumbs>
        <q-breadcrumbs-el label="Dashboard" :to="{ name: 'member_dashboard' }" />
        <q-breadcrumbs-el label="Asset Management" />
        <q-breadcrumbs-el label="Purchasing" />
        <q-breadcrumbs-el label="Suppliers" />
      </q-breadcrumbs>
    </div>
    <div class="page-content">
      <div class="page-content-actions row justify-between">
        <div class="left"></div>
        <div class="right">
          <q-btn
            no-caps
            color="primary"
            rounded
            unelevated
            class="text-label-large"
            @click="$refs.supplierTable.editSupplier()"
          >
            <q-icon size="16px" name="add"></q-icon>
            Add Supplier
          </q-btn>
        </div>
      </div>
      <g-card class="q-pa-md q-mt-sm">
        <!-- suppliers table -->
        <supplier-table
          ref="supplierTable"
        />
      </g-card>
    </div>
  </expanded-nav-page-container>
</template>

<script>
import ExpandedNavPageContainer from '../../../../components/shared/ExpandedNavPageContainer.vue';
import GCard from "../../../../components/shared/display/GCard.vue";
import SupplierTable from "../../../../components/tables/SupplierTable.vue";

export default {
  name: 'MemberAssetSuppliers',
  components: {
    ExpandedNavPageContainer,
    SupplierTable,
    GCard,
  },
};
</script>