<template>
  <expanded-nav-page-container>
    <div class="page-head">
      <div class="title text-headline-small">Parts Maintenance</div>
    </div>
    <div class="bread-crumbs text-body-small">
      <q-breadcrumbs>
        <q-breadcrumbs-el label="Dashboard" :to="{ name: 'member_dashboard' }" />
        <q-breadcrumbs-el label="Asset Management" />
        <q-breadcrumbs-el label="Equipment" />
        <q-breadcrumbs-el label="Parts Maintenance" />
      </q-breadcrumbs>
    </div>
    <div class="page-content">
      <div class="page-content-actions row justify-between">
        <div class="left"></div>
        <div class="right"></div>
      </div>
      <g-card class="q-pa-md q-mt-sm">
        <equipment-parts-table ref="equipmentPartsTable" />
      </g-card>
    </div>
  </expanded-nav-page-container>
</template>

<script>
import ExpandedNavPageContainer from '../../../../components/shared/ExpandedNavPageContainer.vue';
import EquipmentPartsTable from "../components/tables/AssetEquipmentPartsTable.vue";
import GCard from "../../../../components/shared/display/GCard.vue";

export default {
  name: 'MemberAssetEquipmentParts',
  components: {
    ExpandedNavPageContainer,
    GCard,
    EquipmentPartsTable,
  },
};
</script>