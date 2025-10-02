<template>
  <expanded-nav-page-container>
    <div class="page-head">
      <div class="title text-headline-small">In Transit Warehouse</div>
    </div>
    <div class="bread-crumbs text-body-small">
      <q-breadcrumbs>
        <q-breadcrumbs-el label="Dashboard" :to="{ name: 'member_dashboard' }" />
        <q-breadcrumbs-el label="Asset Management" />
        <q-breadcrumbs-el label="Warehouse" />
        <q-breadcrumbs-el label="In Transit Warehouse" />
      </q-breadcrumbs>
    </div>
    <div class="page-content">
      <div class="page-content-actions row justify-between">
        <div class="left"></div>
        <div class="right">
          <q-btn @click="openAddWarehouseDialog()" no-caps color="primary"
          class="text-label-large" rounded unelevated>
            <q-icon size="16px" name="add"></q-icon>
            Add In Transit Warehouse
          </q-btn>
        </div>
      </div>
      <g-card class="q-pa-md q-mt-sm text-body-small">
        <g-table ref="gTable" :isRowActionEnabled="true" tableKey="warehouseInTransit" 
          apiUrl="/warehouse" :apiFilters="[{ deleted: false, warehouseType: 'IN_TRANSIT_WAREHOUSE' }]">

          <!-- slot name -->
          <template v-slot:name="props">
            <span @click="openWarehouseinformationDialog(props.data)" class="clickable-code">{{ props.data.name }}</span>
          </template>

          <!-- slot actions -->
          <template v-slot:row-actions="props">
            <q-btn rounded class="q-mr-sm text-label-medium" @click="viewWarehouseInventoryDialog(props.data)" no-caps color="primary"
              outline>
              <q-icon class="q-mr-sm " size="20px" name="visibility"></q-icon> Inventory
            </q-btn>
            <q-btn rounded class="q-mr-sm text-label-medium" @click="viewWarehouseTransactionsDialog(props.data)" no-caps color="primary"
              outline>
              <q-icon class="q-mr-sm" size="20px" name="list"></q-icon> Transactions
            </q-btn>
          </template>
        </g-table>
      </g-card>
    </div>

    <!-- Warehouse Add / Edit Dialog -->
    <add-edit-warehouse-dialog :warehouseType="'IN_TRANSIT_WAREHOUSE'" @close="this.$refs.gTable.refetch()"
      v-model="isAddEditWarehouseDialogOpen"></add-edit-warehouse-dialog>

    <!-- Warehouse Information Dialog -->
    <warehouse-information-dialog :initialActiveTab="warehouseActiveTab" v-if="wareHouseId" :warehouseId="wareHouseId"
      v-model="isWarehouseInformationDialogOpen" @refetch="refetch"></warehouse-information-dialog>
  </expanded-nav-page-container>
</template>

<script>
import ExpandedNavPageContainer from '../../../../components/shared/ExpandedNavPageContainer.vue';
import GTable from "../../../../components/shared/display/GTable.vue";
import GCard from "../../../../components/shared/display/GCard.vue";
import AddEditWarehouseDialog from '../dialogs/AssetAddEditWarehouseDialog.vue';
import WarehouseInformationDialog from '../dialogs/AssetWarehouseInformationDialog.vue';

export default {
  name: 'MemberAssetInTransitWarehouse',
  components: {
    ExpandedNavPageContainer,
    AddEditWarehouseDialog,
    WarehouseInformationDialog,
    GTable,
    GCard,
  },
  data: () => ({
    wareHouseId: null,
    warehouseActiveTab: 'warehouse_information',
    isAddEditWarehouseDialogOpen: false,
    isWarehouseInformationDialogOpen: false,
  }),
  methods: {
    refetch() {
      this.$refs.gTable.refetch();
    },
    openWarehouseinformationDialog(data) {
      this.warehouseActiveTab = 'warehouse_information';
      this.wareHouseId = data.id;
      this.isWarehouseInformationDialogOpen = true;
    },
    openAddWarehouseDialog() {
      this.isAddEditWarehouseDialogOpen = true;
    },
    viewWarehouseTransactionsDialog(data) {
      this.warehouseActiveTab = 'transactions';
      this.wareHouseId = data.id;
      this.isWarehouseInformationDialogOpen = true;
    },
    viewWarehouseInventoryDialog(data) {
      this.warehouseActiveTab = 'inventory';
      this.wareHouseId = data.id;
      this.isWarehouseInformationDialogOpen = true;
    }
  },
};
</script>