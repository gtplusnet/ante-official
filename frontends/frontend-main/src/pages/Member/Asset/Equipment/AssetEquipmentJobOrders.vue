<template>
  <expanded-nav-page-container>
    <div class="page-head">
      <div class="title text-headline-small">Job Orders</div>
    </div>
    <div class="bread-crumbs text-body-small">
      <q-breadcrumbs>
        <q-breadcrumbs-el label="Dashboard" :to="{ name: 'member_dashboard' }" />
        <q-breadcrumbs-el label="Asset Management" />
        <q-breadcrumbs-el label="Equipment" />
        <q-breadcrumbs-el label="Job Orders" />
      </q-breadcrumbs>
    </div>
    <div class="page-content">
      <div class="page-content-actions row justify-between">
        <div class="left"></div>
        <div class="right"></div>
      </div>
      <g-card class="q-pa-md q-mt-sm">
        <equipment-job-order-table ref="equipmentJobOrderTable" />
      </g-card>
    </div>
  </expanded-nav-page-container>
</template>

<script>
import ExpandedNavPageContainer from '../../../../components/shared/ExpandedNavPageContainer.vue';
import EquipmentJobOrderTable from "../components/tables/AssetEquipmentJobOrderTable.vue";
import GCard from "../../../../components/shared/display/GCard.vue";

export default {
  name: 'MemberAssetEquipmentJobOrders',
  components: {
    ExpandedNavPageContainer,
    GCard,
    EquipmentJobOrderTable,
  },
};
</script>