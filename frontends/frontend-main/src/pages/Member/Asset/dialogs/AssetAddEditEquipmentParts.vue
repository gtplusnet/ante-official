<template>
  <div class="equipment q-pt-md  q-ma-sm">
    <div class="title text-title-small q-pb-xs">Equipment Parts</div>

    <table class="global-table text-title-small">
      <thead>
        <tr>
          <th>Part Name</th>
          <th>Schedule</th>
          <th>Next Maintenance</th>
          <th>Repair Items</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody class="text-body-medium">
        <tr v-if="parts.length === 0">
          <td colspan="5">No Parts Yet</td>
        </tr>
        <tr v-for="(part, index) in parts" :key="index" class="text-center">
          <td class="text-left">{{ part.partName }}</td>
          <td>{{ part.scheduleDay }}</td>
          <td>{{ part.nextMaintenanceDate.date }}</td>
          <td @click="addItem(part)" class="hyperlink">
            {{ part.itemsCount }} Item(s)
          </td>
          <td>
            <q-btn
              rounded
              dense
              no-caps
              flat
              icon="delete"
              color="red"
              @click="deletePart(index)"
            />
          </td>
        </tr>
      </tbody>
    </table>

    <div class="add-parts-new text-right">
      <q-btn
        no-caps
        unelevated
        flat
        label="+ Add Part"
        color="primary"
        @click="addNewPart"
      />
    </div>
  </div>

  <add-edit-equipment-parts-dialog
    :equipmentId="equipmentId"
    v-model="isAddPartDialogOpen"
    @saveDone="fetchData"
  />

  <add-edit-equipment-items-dialog
    :part="part"
    :equipmentId="equipmentId"
    v-model="isAddItemDialogOpen"
    @saveDone="fetchData"
  />
</template>



<script>
import { defineAsyncComponent } from 'vue';
import { api } from 'src/boot/axios';

// Lazy-loaded dialogs (ALL dialogs must be lazy loaded - CLAUDE.md)
const AddEditEquipmentPartsDialog = defineAsyncComponent(() =>
  import('./AssetAddEditEquipmentPartsDialog.vue')
);
const AddEditEquipmentItemsDialog = defineAsyncComponent(() =>
  import('./AssetAddEditEquipmentItemsDialog.vue')
);

export default {
  name: 'AddEditEquipmentParts',
  props: {
    equipmentId: {
      type: Number,
      required: true,
    },
  },

  components: {
    AddEditEquipmentPartsDialog,
    AddEditEquipmentItemsDialog,
  },
  data: () => ({
    isAddPartDialogOpen: false,
    isAddItemDialogOpen: false,
    parts: [],
    part: null,
  }),
  mounted() {
    this.fetchData();
  },
  methods: {
    addItem(part) {
      this.part = part;
      this.isAddItemDialogOpen = true;
    },
    addNewPart() {
      this.isAddPartDialogOpen = true;
    },
    deletePart(index) {
      const part = this.parts[index];

      this.$q
        .dialog({
          title: 'Delete Part',
          message: `Are you sure you want to delete ${part.partName}?`,
          ok: true,
          cancel: true,
        })
        .onOk(() => {
          this.deletePartRequest(part);
        });
    },
    deletePartRequest(part) {
      api.delete(`equipment/parts?id=${part.id}`).then(() => {
        this.fetchData();
      });

      this.$q.notify({
        message: 'Part deleted',
        color: 'positive',
      });
    },
    fetchData() {
      api.get(`equipment/parts?id=${this.equipmentId}`).then((response) => {
        this.parts = response.data;
      });
    },
  },
};
</script>
