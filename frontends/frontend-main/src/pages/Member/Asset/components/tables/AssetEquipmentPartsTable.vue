<template>
  <g-table
    :isRowActionEnabled="true"
    tableKey="equipmentParts"
    apiUrl="/equipment/parts-table"
    ref="table"
  >
    <template v-slot:items-count="props">
      {{ props.data.itemsCount || '0' }} Item(s)
    </template>
    <template v-slot:row-actions="props">
      <q-btn
        @click="maintenanceDialog(props.data, true)"
        rounded
        class="q-mr-sm text-label-medium"
        no-caps
        color="primary"
        unelevated
      >
        <q-icon class="q-mr-sm" size="20px" name="check"></q-icon>
        Passed
      </q-btn>
      <q-btn
        @click="maintenanceDialog(props.data, false)"
        rounded
        class="q-mr-sm text-label-medium"
        no-caps
        color="red"
        unelevated
      >
        <q-icon class="q-mr-sm" size="20px" name="construction"></q-icon>
        Repair
      </q-btn>
    </template>

    <!-- slot: maintenance-date -->
    <template v-slot:maintenance-date="{ data }">
      <span
        class="clickable-code"
        @click="adjustNextMaintenanceDateDialog(data)"
        >{{ data.nextMaintenanceDate.dateFull }}</span
      >
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

  <!-- Next Maintenance Date Adjustment Dialog -->
  <next-maintenance-date-adjustment-dialog
    v-if="isNextMaintenanceDateAdjustmentDialogOpen"
    v-model="isNextMaintenanceDateAdjustmentDialogOpen"
    :partId="id"
    @close="isNextMaintenanceDateAdjustmentDialogOpen = false"
    @save-done="onSaveDone"
    :partsData="partsData"
  />
</template>

<script>
import GTable from "../../../../../components/shared/display/GTable.vue";
import EquipmentPartsMaintenanceDialog from '../../dialogs/AssetEquipmentPartsMaintenanceDialog.vue';
import NextMaintenanceDateAdjustmentDialog from "../../../../../components/dialog/NextMaintenanceDateAdjustmentDialog.vue";

export default {
  name: 'EquipmentPartsTable',
  components: {
    GTable,
    EquipmentPartsMaintenanceDialog,
    NextMaintenanceDateAdjustmentDialog,
  },
  props: {},
  data: () => ({
    isEquipmentPartsMaintenanceDialogOpen: false,
    isNextMaintenanceDateAdjustmentDialogOpen: false,
    id: null,
    isWorking: false,
    partsData: null,
  }),
  methods: {
    maintenanceDialog(data, isWorking) {
      this.id = data.id;
      this.isWorking = isWorking;
      this.isEquipmentPartsMaintenanceDialogOpen = true;
    },
    onSaveDone() {
      this.$refs.table.refetch();
    },
    adjustNextMaintenanceDateDialog(data) {
      this.partsData = data;
      this.isNextMaintenanceDateAdjustmentDialogOpen = true;
    },
  },
};
</script>
