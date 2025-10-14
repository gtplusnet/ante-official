<template>
  <g-table :isRowActionEnabled="true" tableKey="item" apiUrl="/items/simpleView"
    :apiFilters="apiFilters" ref="table">
    <!-- slot actions -->
    <template v-slot:row-actions="props">
      <q-btn rounded class="q-mr-sm text-label-medium" @click="editItem(props.data)" no-caps color="primary" unelevated>
        <q-icon class="q-mr-sm" size="20px" name="edit"></q-icon> Edit
      </q-btn>

      <q-btn rounded class="text-label-medium" @click="deleteItem(props.data)" no-caps color="red" outline :disable="props.data.isPartOfGroup">
        <q-icon class="q-mr-sm" size="20px" name="delete"></q-icon> Delete
        <q-tooltip v-if="props.data.isPartOfGroup">
          Cannot delete - Part of: {{ getGroupNames(props.data) }}
        </q-tooltip>
      </q-btn>
    </template>

    <!-- slot sku -->
    <template v-slot:sku="props">
      <span @click="viewItemInformation(props.data)" class="clickable-code">{{ props.data.sku }}</span>
    </template>

    <!-- slot variation -->
    <template v-slot:variationCount="props">
      <span v-if="props.data.variationCount" @click="viewItemInformation(props.data)" class="clickable-code">{{
        props.data.variationCount }} Variation</span>
      <span v-else>-</span>
    </template>
  </g-table>

  <!-- item information dialog -->
  <ItemInformationDialog v-if="itemId" :itemId="itemId" v-model="isItemInformationDialogOpen" />

  <!-- item create edit dialog -->
  <ItemCreateEditDialog v-model="isItemCreateEditDialogOpen" :itemInformation="itemInformation"
    :forceItemGroup="true" @close="onCloseItemCreateEditDialog" />

  <!-- item advance list dialog -->
  <ItemAdvanceListDialog v-if="isItemAdvanceListDialogOpen" v-model="isItemAdvanceListDialogOpen" :parentId="parentId">
  </ItemAdvanceListDialog>
</template>

<script>
import { defineAsyncComponent } from 'vue';
import GTable from "../../components/shared/display/GTable.vue";
import { api } from 'src/boot/axios';

// Lazy-loaded dialogs (ALL dialogs must be lazy loaded - CLAUDE.md)
const ItemCreateEditDialog = defineAsyncComponent(() =>
  import("../../components/dialog/ItemCreateEditDialog/ItemCreateEditDialog.vue")
);
const ItemInformationDialog = defineAsyncComponent(() =>
  import("../../components/dialog/ItemInformationDialog/ItemInformationDialog.vue")
);
const ItemAdvanceListDialog = defineAsyncComponent(() =>
  import("../../components/dialog/ItemAdvanceListDialog.vue")
);

export default {
  name: 'GroupItemTable',
  components: {
    GTable,
    ItemCreateEditDialog,
    ItemInformationDialog,
    ItemAdvanceListDialog,
  },
  computed: {
    apiFilters() {
      // Show only items that are marked as Group (isItemGroup = false shows ONLY groups)
      return [
        { deleted: false },
        { isItemGroup: false } // Filter to show ONLY group items
      ];
    },
  },
  data: () => ({
    isItemCreateEditDialogOpen: false,
    isItemInformationDialogOpen: false,
    itemId: null,
    itemInformation: null,
    isItemAdvanceListDialogOpen: false,
    parentId: null,
  }),
  methods: {
    editItem(data) {
      this.itemInformation = data;
      this.isItemCreateEditDialogOpen = true;
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
    getGroupNames(data) {
      if (!data.belongsToGroups || data.belongsToGroups.length === 0) {
        return '';
      }
      return data.belongsToGroups.map(bg => bg.group.name).join(', ');
    },
  },
};
</script>
