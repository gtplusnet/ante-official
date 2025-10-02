<template>
  <asset-navigation>
    <q-page class="assets">
      <div class="page-head">
        <div class="title text-headline-small">Equipment Management</div>
      </div>
      <div class="page-content">
      <div class="page-content-actions row justify-between">
        <div class="left">
          <div class="item-tab">
            <div
              v-for="tab in tabList"
              :key="tab.column"
              class="tab text-label-medium"
              :class="tab.key == activeTab ? 'active' : ''"
              @click="changeTab(tab.key)"
            >
              <q-icon class="icon" :name="tab.icon"></q-icon>
              {{ tab.name }}
            </div>
          </div>
        </div>
        <div class="right">
          <!-- Add Equipment Button -->
          <q-btn
            @click="$refs.equipmentTable.addDialog()"
            no-caps
            color="primary"
            rounded
            unelevated
          >
            <q-icon size="16px" name="add"></q-icon>
            Add Equipment
          </q-btn>
        </div>
      </div>
      <g-card class="q-pa-md q-mt-sm">
        <!-- Equipment Table -->
        <equipment-table
          ref="equipmentTable"
          v-if="activeTab == 'equipment_list'"
        />

        <!-- Equipment Parts Table -->
        <equipment-parts-table
          ref="equipmentPartsTable"
          v-if="activeTab == 'parts_maintenance'"
        />

        <!-- Equipment Job Order Table -->
        <equipment-job-order-table
          ref="equipmentJobOrderTable"
          v-if="activeTab == 'job_orders'"
        />
      </g-card>
    </div>
    </q-page>
  </asset-navigation>
</template>

<style scoped src="./AssetItem.scss"></style>

<script>
import AssetNavigation from './AssetNavigation.vue';
import EquipmentTable from "../../../pages/Member/Asset/components/tables/AssetEquipmentTable.vue";
import EquipmentPartsTable from "../../../pages/Member/Asset/components/tables/AssetEquipmentPartsTable.vue";
import EquipmentJobOrderTable from "../../../pages/Member/Asset/components/tables/AssetEquipmentJobOrderTable.vue";
import GCard from "../../../components/shared/display/GCard.vue";
import { api } from 'src/boot/axios';

export default {
  name: 'MemberAssetEquipment',
  components: {
    AssetNavigation,
    GCard,
    EquipmentTable,
    EquipmentPartsTable,
    EquipmentJobOrderTable,
  },
  props: {},
  data: () => ({
    form: {},
    tabList: [
      { key: 'equipment_list', name: 'Equipment List', icon: 'forklift' },
      { key: 'parts_maintenance', name: 'Parts Maintenance', icon: 'build' },
      { key: 'job_orders', name: 'Job Orders', icon: 'construction' },
    ],
    isItemReceiptDialogOpen: false,
    itemReceiptId: null,
    isItemCreateEditDialogOpen: false,
    isTruckLoadDialogOpen: false,
    deliveryId: null,
    isReceiveItemDialogOpen: false,
    warehouseId: null,
  }),
  computed: {
    activeTab() {
      return this.$route.query.tab || 'equipment_list';
    }
  },
  watch: {
    '$route.query.tab'() {
      // Handle tab change if needed
      if (this.$refs.equipmentTable) {
        this.$refs.equipmentTable.refetch();
      }
      if (this.$refs.equipmentPartsTable) {
        this.$refs.equipmentPartsTable.refetch();
      }
      if (this.$refs.equipmentJobOrderTable) {
        this.$refs.equipmentJobOrderTable.refetch();
      }
    }
  },
  mounted() {},
  methods: {
    changeTab(tab) {
      this.$router.push({ 
        name: this.$route.name,
        query: { ...this.$route.query, tab }
      });
    },
    async receiveItem(data) {
      this.warehouseId = data.toWarehouse.id;
      this.itemReceiptId = data.inTransitDeliveryReceipt.id;
      this.deliveryId = data.id;
      this.isReceiveItemDialogOpen = true;
    },
    async confirmNextStage(data) {
      if (data.truckLoadStage.nextStage == 'FOR_DELIVERY') {
        this.deliveryId = Number(data.id);
        this.isTruckLoadDialogOpen = true;
      } else {
        this.$q
          .dialog({
            title: 'Confirm',
            message: `Are you sure you want to set delivery of <b>${data.sourceDeliveryReceipt.code}</b> to ${data.truckLoadStage.nextStageLabel}?`,
            ok: 'Yes',
            cancel: 'No',
            html: true,
          })
          .onOk(() => {
            this.setNextStage(data);
          });
      }
    },
    async setNextStage(data) {
      this.$q.loading.show();
      try {
        await api.post('/delivery/set-stage', {
          deliveryId: data.id,
          newStage: data.truckLoadStage.nextStage,
        });

        this.$refs.table.refetch();
      } catch (error) {
        this.handleAxiosError(error);
      } finally {
        this.$q.loading.hide();
      }
    },
    onOpenItemReceiptDialog(itemReceiptId) {
      this.itemReceiptId = itemReceiptId;
      this.isItemReceiptDialogOpen = true;
    },
    onOpenItemCreateEditDialog() {
      this.isItemCreateEditDialogOpen = true;
    },
    onCloseItemCreateEditDialog() {
      this.isItemCreateEditDialogOpen = false;
      this.$refs.table.refetch();
    },
    cancelDelivery(data) {
      console.log(data);
    },
  },
  computed: {},
};
</script>
