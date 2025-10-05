<template>
  <g-table
    :isRowActionEnabled="true"
    tableKey="equipmentPartsMaintenanceHistory"
    apiUrl="/equipment/maintenance-history-table"
    :apiFilters="[{ isWorking: false }]"
    ref="table"
  >
    <template v-slot:items-count="props">
      {{ props.data.itemsCount || '0' }} Item(s)
    </template>

    <!-- buttons -->
    <template v-slot:row-actions="props">
      <q-btn
        @click="startNexStage(props.data)"
        rounded
        class="q-mr-sm text-label-medium"
        no-caps
        color="primary"
        unelevated
        v-if="props.data.repairStage.nextStage"
      >
        <q-icon class="q-mr-sm" size="20px" name="check"></q-icon>
        {{ props.data.repairStage.nextStageButton }}
      </q-btn>
    </template>

    <!-- slot: image -->
    <template v-slot:image="props">
      <a :href="props.data.maintenanceProof.url" target="_blank">
        <q-btn color="primary" rounded flat dense no-caps class="text-label-medium">View Proof</q-btn>
      </a>
    </template>

    <!-- slot: purchase request -->
    <template v-slot:purchase-request="props">
      <span
        @click="
          showItemReceiptDialog(
            props.data.repairItemPurchaseRequest.itemReceipt.id
          )
        "
        class="clickable-code text-label-medium"
        v-if="props.data.repairItemPurchaseRequest"
      >
        {{
          props.data.repairItemPurchaseRequest.itemReceipt.code
            ? props.data.repairItemPurchaseRequest.itemReceipt.code
            : 'N/A'
        }}
      </span>
      <span class="text-label-medium" v-else>N/A</span>
    </template>
  </g-table>

  <!-- Equipment Parts Maintenance Dialog -->
  <equipment-parts-maintenance-dialog
    v-if="isEquipmentPartsMaintenanceDialogOpen"
    v-model="isEquipmentPartsMaintenanceDialogOpen"
    :isWorking="isWorking"
    :partId="id"
    @close="isEquipmentPartsMaintenanceDialogOpen = false"
    @save-done="onSaveDone"
    :id="id"
  />

  <!-- Item Receipt Dialog -->
  <item-receipt-dialog
    v-if="isItemReceiptDialogOpen"
    v-model="isItemReceiptDialogOpen"
    :itemReceiptId="itemReceiptId"
    @close="isItemReceiptDialogOpen = false"
  />
</template>

<script>
import { defineAsyncComponent } from 'vue';
import GTable from "../../../../../components/shared/display/GTable.vue";
import { api } from 'src/boot/axios';

// Lazy-loaded dialogs (ALL dialogs must be lazy loaded - CLAUDE.md)
const EquipmentPartsMaintenanceDialog = defineAsyncComponent(() =>
  import("../../../../../pages/Member/Asset/dialogs/AssetEquipmentPartsMaintenanceDialog.vue")
);
const ItemReceiptDialog = defineAsyncComponent(() =>
  import("../../../../../components/dialog/ItemReceipt/ItemReceipt.vue")
);

export default {
  name: 'EquipmentJobOrderTable',
  components: {
    GTable,
    EquipmentPartsMaintenanceDialog,
    ItemReceiptDialog,
  },
  props: {},
  data: () => ({
    isEquipmentPartsMaintenanceDialogOpen: false,
    id: null,
    isWorking: false,
    isItemReceiptDialogOpen: false,
    itemReceiptId: null,
  }),
  methods: {
    startNexStage(data) {
      this.$q
        .dialog({
          title: 'Start Next Stage',
          message: 'Are you sure you want to start the next stage?',
          ok: true,
          cancel: true,
        })
        .onOk(() => {
          this.startNextStageRequest(data);
        });
    },
    startNextStageRequest(data) {
      this.$q.loading.show();

      api
        .post('/equipment/maintenance-history/next-stage', {
          id: data.id,
        })
        .then(() => {
          this.$refs.table.refetch();
        })
        .catch((error) => {
          this.handleAxiosError(error);
        })
        .finally(() => {
          this.$q.loading.hide();
        });
    },
    showItemReceiptDialog(itemReceiptId) {
      this.itemReceiptId = itemReceiptId;
      this.isItemReceiptDialogOpen = true;
    },
    maintenanceDialog(data, isWorking) {
      this.id = data.id;
      this.isWorking = isWorking;
      this.isEquipmentPartsMaintenanceDialogOpen = true;
    },
    onSaveDone() {
      this.$refs.table.refetch();
    },
  },
};
</script>
