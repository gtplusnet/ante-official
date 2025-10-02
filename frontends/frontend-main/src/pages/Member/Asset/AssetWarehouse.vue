<template>
  <asset-navigation>
    <q-page class="assets">
      <div class="page-head">
        <div class="title text-headline-small">Warehouse Management</div>
      </div>
      <div class="page-content">
      <div class="page-content-actions row justify-between">
        <div class="left">
          <div class="item-tab text-label-medium">
            <div v-for="tab in tabList" :key="tab.column" class="tab text-label-medium" :class="tab.key == activeTab ? 'active' : ''"
              @click="changeTab(tab.key)">
              <q-icon class="icon" :name="tab.icon"></q-icon>
              {{ tab.name }}
            </div>
          </div>
        </div>
        <div class="right">
          <!-- add company warehouse -->
          <q-btn v-if="activeTab == 'COMPANY_WAREHOUSE'" @click="openAddWarehouseDialog()" no-caps color="primary"
            class="text-label-large"
          rounded unelevated>
            <q-icon size="16px" name="add"></q-icon>
            Add Company Warehouse
          </q-btn>

          <!-- add project warehouse -->
          <q-btn v-if="activeTab == 'PROJECT_WAREHOUSE'" @click="openAddWarehouseDialog()" no-caps color="primary"
          class="text-label-large"
          rounded unelevated>
            <q-icon size="16px" name="add"></q-icon>
            Add Project Warehouse
          </q-btn>

          <!-- add in transit warehouse -->
          <q-btn v-if="activeTab == 'IN_TRANSIT_WAREHOUSE'" @click="openAddWarehouseDialog()" no-caps color="primary"
          class="text-label-large"
          rounded unelevated>
            <q-icon size="16px" name="add"></q-icon>
            Add In Transit Warehouse
          </q-btn>


        </div>
      </div>
      <!-- company warehouse -->
      <g-card class="q-pa-md q-mt-sm text-body-small">
        <g-table v-if="activeTab == 'COMPANY_WAREHOUSE'" ref="gTable" :isRowActionEnabled="true" tableKey="warehouse"
          apiUrl="/warehouse" :apiFilters="[{ deleted: false, warehouseType: 'COMPANY_WAREHOUSE' }]">

          <!-- slot name -->
          <template v-slot:name="props">
            <span @click="openWarehouseinformationDialog(props.data)" class="clickable-code">{{ props.data.name
              }}</span>
          </template>

          <!-- slot isMainWarehouse -->
          <template v-slot:isMainWarehouse="props">
            <q-chip v-if="props.data.isMainWarehouse" color="primary" text-color="white" dense>
              <q-icon name="star" size="16px" class="q-mr-xs" />
              Main
            </q-chip>
            <span v-else>-</span>
          </template>

          <!-- slot actions -->
          <template v-slot:row-actions="props">
            <q-btn v-if="!props.data.isMainWarehouse" rounded class="q-mr-sm text-label-medium" 
              @click="setAsMainWarehouse(props.data)" no-caps color="primary" outline>
              <q-icon class="q-mr-sm" size="20px" name="star"></q-icon> Set as Main
            </q-btn>
            <q-btn rounded class="q-mr-sm text-label-medium" @click="viewWarehouseInventoryDialog(props.data)" no-caps color="primary"
              outline>
              <q-icon class="q-mr-sm" size="20px" name="visibility"></q-icon> Inventory
            </q-btn>
            <q-btn rounded class="q-mr-sm text-label-medium" @click="viewWarehouseTransactionsDialog(props.data)" no-caps color="primary"
              outline>
              <q-icon class="q-mr-sm" size="20px" name="list"></q-icon> Transactions
            </q-btn> </template>
        </g-table>

        <!-- project warehouse -->
        <g-table class="text-body-small" v-if="activeTab == 'PROJECT_WAREHOUSE'" ref="gTable" :isRowActionEnabled="true"
          tableKey="warehouseProject" apiUrl="/warehouse"
          :apiFilters="[{ deleted: false, warehouseType: 'PROJECT_WAREHOUSE' }]">

          <!-- slot name -->
          <template v-slot:name="props">
            <span @click="openWarehouseinformationDialog(props.data)" class="clickable-code">{{ props.data.name
              }}</span>
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

        <!-- in transit warehouse -->
        <g-table v-if="activeTab == 'IN_TRANSIT_WAREHOUSE'" ref="gTable" :isRowActionEnabled="true"
          tableKey="warehouseInTransit" apiUrl="/warehouse"
          :apiFilters="[{ deleted: false, warehouseType: 'IN_TRANSIT_WAREHOUSE' }]">

          <!-- slot name -->
          <template v-slot:name="props">
            <span @click="openWarehouseinformationDialog(props.data)" class="clickable-code">{{ props.data.name
              }}</span>
          </template>

          <!-- slot actions -->
          <template v-slot:row-actions="props" >
            <q-btn rounded class="q-mr-sm text-label-medium" @click="viewWarehouseInventoryDialog(props.data)" no-caps color="primary"
              outline >
              <q-icon class="q-mr-sm" size="20px" name="list"></q-icon> Inventory
            </q-btn>
            <q-btn rounded class="q-mr-sm text-label-medium" @click="viewWarehouseTransactionsDialog(props.data)" no-caps color="primary"
              outline>
              <q-icon class="q-mr-sm" size="20px" name="visibility"></q-icon> Transactions
            </q-btn>
          </template>
        </g-table>

        <!-- temporary warehouse -->
        <g-table v-if="activeTab == 'TEMPORARY_WAREHOUSE'" ref="gTable" :isRowActionEnabled="true"
          tableKey="warehouseInTransit" apiUrl="/warehouse"
          :apiFilters="[{ deleted: false, warehouseType: 'TEMPORARY_WAREHOUSE' }]">
          <!-- slot name -->
          <template v-slot:name="props">
            <span @click="openWarehouseinformationDialog(props.data)" class="clickable-code">{{ props.data.name
              }}</span>
          </template>

          <!-- slot actions -->
          <template v-slot:row-actions="props">
            <q-btn rounded class="q-mr-sm text-label-medium" @click="viewWarehouseInventoryDialog(props.data)" no-caps color="primary"
              outline>
              <q-icon class="q-mr-sm" size="20px" name="list"></q-icon> Inventory
            </q-btn>
            <q-btn rounded class="q-mr-sm text-label-medium" @click="viewWarehouseTransactionsDialog(props.data)" no-caps color="primary"
              outline>
              <q-icon class="q-mr-sm" size="20px" name="visibility"></q-icon> Transactions
            </q-btn>
          </template>
        </g-table>
      </g-card>


    </div>
    <!-- Warehouse Add / Edit Dialog -->
    <add-edit-warehouse-dialog :warehouseType="this.activeTab" @close="this.$refs.gTable.refetch()"
      v-model="isAddEditWarehouseDialogOpen"></add-edit-warehouse-dialog>

    <!-- Warehouse Information Dialog -->
    <warehouse-information-dialog :initialActiveTab="warehouseActiveTab" v-if="wareHouseId" :warehouseId="wareHouseId"
      v-model="isWarehouseInformationDialogOpen" @refetch="refetch"></warehouse-information-dialog>
    </q-page>
  </asset-navigation>
</template>

<style scoped src="./AssetItem.scss"></style>

<script>
import AssetNavigation from './AssetNavigation.vue';
import GTable from "../../../components/shared/display/GTable.vue";
import GCard from "../../../components/shared/display/GCard.vue";
import AddEditWarehouseDialog from './dialogs/AssetAddEditWarehouseDialog.vue';
import WarehouseInformationDialog from './dialogs/AssetWarehouseInformationDialog.vue';

export default {
  name: 'MemberAssetWarehouse',
  components: {
    AddEditWarehouseDialog,
    WarehouseInformationDialog,
    AssetNavigation,
    GTable,
    GCard,
  },
  props: {},
  data: () => ({
    form: {},
    wareHouseId: null,
    warehouseActiveTab: 'warehouse_information',
    tabList: [
      { key: 'COMPANY_WAREHOUSE', name: 'Company Warehouse', icon: 'business' },
      { key: 'PROJECT_WAREHOUSE', name: 'Project Warehouse', icon: 'construction' },
      { key: 'IN_TRANSIT_WAREHOUSE', name: 'In Transit Warehouse', icon: 'local_shipping' },
      { key: 'TEMPORARY_WAREHOUSE', name: 'Temporary Warehouse', icon: 'data_object' },
    ],
    isAddEditWarehouseDialogOpen: false,
    isWarehouseInventoryDialogOpen: false,
    isWarehouseTransactionsDialogOpen: false,
    isWarehouseInformationDialogOpen: false,
  }),
  computed: {
    activeTab() {
      return this.$route.query.tab || 'COMPANY_WAREHOUSE';
    }
  },
  watch: {
    '$route.query.tab'() {
      // Handle tab change if needed
      if (this.$refs.gTable) {
        this.$refs.gTable.refetch();
      }
    }
  },
  mounted() { },
  methods: {
    changeTab(tab) {
      this.$router.push({ 
        name: this.$route.name,
        query: { ...this.$route.query, tab }
      });
    },
    refetch() {
      this.$refs.gTable.refetch();
    },
    openWarehouseinformationDialog(data) {
      this.warehouseActiveTab = 'warehouse_information';
      this.wareHouseId = data.id;
      this.isWarehouseInformationDialogOpen = true;
    },
    openAddWarehouseDialog(wareseHouseId = null) {
      this.wareHouseId = wareseHouseId;
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
    },
    async setAsMainWarehouse(warehouse) {
      this.$q.dialog({
        title: 'Set as Main Warehouse',
        message: `Are you sure you want to set "${warehouse.name}" as the main warehouse? This will remove the main warehouse status from any other warehouse.`,
        cancel: true,
        persistent: true
      }).onOk(async () => {
        try {
          await this.$api.put(`/warehouse/${warehouse.id}/set-main`, {});
          
          this.$q.notify({
            type: 'positive',
            message: 'Main warehouse updated successfully',
            position: 'top'
          });
          
          this.refetch();
        } catch (error) {
          this.$q.notify({
            type: 'negative',
            message: error.response?.data?.message || 'Failed to set main warehouse',
            position: 'top'
          });
        }
      });
    }
  },
  computed: {},
};
</script>
