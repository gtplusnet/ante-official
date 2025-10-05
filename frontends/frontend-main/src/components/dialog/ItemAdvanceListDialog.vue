<template>
  <q-dialog @before-show="fetchData">
    <q-card class="full-width dialog-card">
      <q-bar class="bg-primary text-white cursor-default" dark>
        <q-icon name="o_task" />
        <div class="text-title-medium">Item Advance List</div>

        <q-space />

        <q-btn dense flat icon="close" v-close-popup>
          <q-tooltip class="text-label-small">Close</q-tooltip>
        </q-btn>
      </q-bar>
      <q-card-section>
        <!-- advance view -->
        <g-table tableKey="itemAdvance" apiUrl="/items/advanceView" :apiFilters="[{ parent: parentId }]" ref="table">
          <!-- slot sku -->
          <template v-slot:sku="props">
            <span @click="viewItemInformation(props.data)" class="clickable-code">{{ props.data.sku }}</span>
          </template>
        </g-table>
      </q-card-section>
    </q-card>

    <item-information-dialog v-model="isItemInformationDialogOpen" :itemId="itemId" @close="isItemInformationDialogOpen = false" @itemInformationUpdated="this.$refs.table.refetch()"> </item-information-dialog>
  </q-dialog>
</template>

<style scoped lang="scss">
.dialog-card {
  max-width: 800px;
  min-height: 300px;
}
</style>

<script>
import { defineAsyncComponent } from 'vue';
import GTable from "../../components/shared/display/GTable.vue";

// Lazy-loaded dialogs (ALL dialogs must be lazy loaded - CLAUDE.md)
const ItemInformationDialog = defineAsyncComponent(() =>
  import('./ItemInformationDialog/ItemInformationDialog.vue')
);

export default {
  name: 'ItemAdvanceListDialog',
  components: {
    GTable,
    ItemInformationDialog,
  },
  props: {
    parentId: {
      type: String,
      required: true,
    },
  },
  data: () => ({
    isItemInformationDialogOpen: false,
    itemId: null,
  }),
  watch: {},
  methods: {
    viewItemInformation(item) {
      this.itemId = item.id;
      this.isItemInformationDialogOpen = true;
    },
    fetchData() {},
  },
};
</script>
