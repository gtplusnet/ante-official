<template>
  <g-table :isRowActionEnabled="true" tableKey="itemAdvance" apiUrl="/items/advanceView" :apiFilters="[{ deleted: false }]" ref="table">
    <!-- slot actions -->
    <template v-slot:row-actions="props">
      <q-btn rounded class="q-mr-sm text-label-medium" @click="editItem(props.data)" no-caps color="primary" unelevated>
        <q-icon class="q-mr-sm" size="20px" name="edit"></q-icon> Edit
      </q-btn>
    </template>

    <!-- slot sku -->
    <template v-slot:sku="props">
      <span @click="viewItemInformation(props.data)" class="clickable-code">{{ props.data.sku }}</span>
    </template>
  </g-table>

  <!-- item information dialog -->
  <ItemInformationDialog v-if="itemId" :itemId="itemId" v-model="isItemInformationDialogOpen" />

  <!-- item create edit dialog -->
  <ItemCreateEditDialog v-model="isItemCreateEditDialogOpen" :itemInformation="itemInformation"
    @close="onCloseItemCreateEditDialog" />

  <!-- item advance list dialog -->
  <ItemAdvanceListDialog v-if="isItemAdvanceListDialogOpen" v-model="isItemAdvanceListDialogOpen" :parentId="parentId">
  </ItemAdvanceListDialog>
</template>

<script>
import GTable from "../../components/shared/display/GTable.vue";
import { api } from 'src/boot/axios';
import ItemCreateEditDialog from "../../components/dialog/ItemCreateEditDialog/ItemCreateEditDialog.vue";
import ItemInformationDialog from "../../components/dialog/ItemInformationDialog/ItemInformationDialog.vue";
import ItemAdvanceListDialog from "../../components/dialog/ItemAdvanceListDialog.vue";

export default {
  name: 'SimpleItemTable',
  components: {
    GTable,
    ItemCreateEditDialog,
    ItemInformationDialog,
    ItemAdvanceListDialog,
  },
  props: {
    variant: {
      type: String,
      default: 'create',
      validator: (value) => ['create', 'edit'].includes(value),
    },
  },
  computed: {},
  data: () => ({
    isItemCreateEditDialogOpen: false,
    isItemInformationDialogOpen: false,
    itemId: null,
    itemInformation: null,
    isItemAdvanceListDialogOpen: false,
  }),
  methods: {
    editItem(data) {
      this.itemInformation = data;
      this.isItemCreateEditDialogOpen = true;
    },
    restoreItem(data) {
      this.$q
        .dialog({
          title: 'Restore Item',
          message: 'Are you sure you want to restore this item?',
          ok: true,
          cancel: true,
        })
        .onOk(() => {
          this.restoreItemRequest(data);
        });
    },
    async restoreItemRequest(data) {
      try {
        this.$q.loading.show();
        await api.put(`/items/restore/${data.id}`);
        this.$refs.table.refetch();
        this.$q.loading.hide();
      } catch (error) {
        this.handleAxiosError(error);
        this.$q.loading.hide();
      }
    },
    deleteItem(data) {
      this.$q
        .dialog({
          title: 'Delete Item',
          message: 'Are you sure you want to delete this item?',
          ok: true,
          cancel: true,
        })
        .onOk(() => {
          this.deleteItemRequest(data);
        });
    },
    async deleteItemRequest(data) {
      try {
        this.$q.loading.show();
        await api.delete(`/items/${data.id}`);
        this.$refs.table.refetch();
        this.$q.loading.hide();
      } catch (error) {
        this.handleAxiosError(error);
        this.$q.loading.hide();
      }
    },
    viewItemInformation(data) {
      if (data.hasOwnProperty('variationCount') && data.variationCount > 0) {
        this.isItemAdvanceListDialogOpen = true;
        this.parentId = data.id;
      } else {
        this.itemId = data.id;
        this.isItemInformationDialogOpen = true;
      }
    },

    onOpenItemCreateEditDialog() {
      this.itemInformation = null;
      this.isItemCreateEditDialogOpen = true;
    },
    onCloseItemCreateEditDialog() {
      this.isItemCreateEditDialogOpen = false;
      this.$refs.table.refetch();
    },
    refetch() {
      this.$refs.table.refetch();
    },
  },
};
</script>
