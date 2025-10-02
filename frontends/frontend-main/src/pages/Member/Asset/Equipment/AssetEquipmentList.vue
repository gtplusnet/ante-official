<template>
  <expanded-nav-page-container>
    <div class="page-head">
      <div class="title text-headline-small">Equipment List</div>
    </div>
    <div class="bread-crumbs text-body-small">
      <q-breadcrumbs>
        <q-breadcrumbs-el label="Dashboard" :to="{ name: 'member_dashboard' }" />
        <q-breadcrumbs-el label="Asset Management" />
        <q-breadcrumbs-el label="Equipment" />
        <q-breadcrumbs-el label="Equipment List" />
      </q-breadcrumbs>
    </div>
    <div class="page-content">
      <div class="page-content-actions row justify-between">
        <div class="left"></div>
        <div class="right">
          <q-btn
            @click="$refs.equipmentTable.addDialog()"
            no-caps
            color="primary"
            rounded
            unelevated
            class="text-label-large"
          >
            <q-icon size="16px" name="add"></q-icon>
            Add Equipment
          </q-btn>
        </div>
      </div>
      <g-card class="q-pa-md q-mt-sm">
        <equipment-table ref="equipmentTable" />
      </g-card>
    </div>
  </expanded-nav-page-container>
</template>

<script>
import ExpandedNavPageContainer from '../../../../components/shared/ExpandedNavPageContainer.vue';
import EquipmentTable from "../components/tables/AssetEquipmentTable.vue";
import GCard from "../../../../components/shared/display/GCard.vue";

export default {
  name: 'MemberAssetEquipmentList',
  components: {
    ExpandedNavPageContainer,
    GCard,
    EquipmentTable,
  },
};
</script>