<template>
  <g-table :isRowActionEnabled="true" tableKey="item" apiUrl="/items/simpleView"
    :apiFilters="[{ deleted: this.tab === 'deleted' }]" ref="table">
    <!-- slot actions -->
    <template v-slot:row-actions="props">
      <q-btn rounded class="q-mr-sm text-label-medium" @click="editItem(props.data)" no-caps color="primary" unelevated>
        <q-icon class="q-mr-sm" size="20px" name="edit"></q-icon> Edit
      </q-btn>

      <q-btn v-if="this.tab == 'select'" rounded class="q-mr-sm text-label-medium" @click="selectItem(props.data)" no-caps color="primary"
        unelevated>
        <q-icon class="q-mr-sm" size="20px" name="check"></q-icon> Select
      </q-btn>

      <q-btn v-if="this.tab == 'simple'" rounded class="text-label-medium" @click="deleteItem(props.data)" no-caps color="red" outline>
        <q-icon class="q-mr-sm" size="20px" name="delete"></q-icon> Delete
      </q-btn>

      <q-btn v-if="this.tab == 'deleted'" rounded class="text-label-medium" @click="restoreItem(props.data)" no-caps color="red" outline>
        <q-icon class="q-mr-sm" size="20px" name="unarchive"></q-icon>
        Restore
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
  emits: ['select'],
  props: {
    tab: {
      type: String,
      default: 'simple',
      validator: (value) => ['select', 'simple', 'deleted'].includes(value),
    },
    emitKey: {
      type: String,
      default: '',
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
    addItem() {
      this.itemInformation = null;
      this.isItemCreateEditDialogOpen = true;
    },
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
    async selectItem(data) {
      data.emitKey = this.emitKey;
      this.$emit('select', data);
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
