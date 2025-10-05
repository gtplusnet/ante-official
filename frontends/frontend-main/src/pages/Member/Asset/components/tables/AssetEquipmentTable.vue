<template>
  <g-table
    :isRowActionEnabled="true"
    tableKey="equipment"
    apiUrl="/equipment"
    :apiFilters="[{ deliveryStatus: ['PENDING', 'INCOMPLETE'] }]"
    ref="table"
    class="text-label-medium"
  >
    <template v-slot:row-actions="props">
      <q-btn
        @click="editDialog(props.data)"
        rounded
        class="q-mr-sm text-label-medium"
        no-caps
        color="primary"
        unelevated
      >
        <q-icon class="q-mr-sm" size="20px" name="edit"></q-icon> Edit
      </q-btn>
    </template>
  </g-table>

  <!-- Add/Edit Equipment Dialog -->
  <add-edit-equipment-dialog
    v-model="isAddEditDialogOpen"
    :id="id"
    ref="addEditEquipmentDialog"
    @saveDone="onSaveDone"
  ></add-edit-equipment-dialog>
</template>

<script>
import { defineAsyncComponent } from 'vue';
import GTable from "../../../../../components/shared/display/GTable.vue";

// Lazy-loaded dialogs (ALL dialogs must be lazy loaded - CLAUDE.md)
const AddEditEquipmentDialog = defineAsyncComponent(() =>
  import('../../dialogs/AssetAddEditEquipmentDialog.vue')
);

export default {
  name: 'EquipmentTable',
  components: {
    GTable,
    AddEditEquipmentDialog,
  },
  props: {},
  data: () => ({
    isAddEditDialogOpen: false,
    id: null,
  }),
  methods: {
    onSaveDone() {
      this.$refs.table.refetch();
    },
    addDialog() {
      this.id = null;
      this.isAddEditDialogOpen = true;
    },
    editDialog(data) {
      this.id = data.id;
      this.isAddEditDialogOpen = true;
    },
  },
};
</script>
