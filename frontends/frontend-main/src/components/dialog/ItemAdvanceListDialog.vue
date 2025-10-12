<template>
  <q-dialog @before-show="fetchData">
    <TemplateDialog size="md" :scrollable="true" :icon="'o_task'" :iconColor="'primary'">
      <!-- Dialog Title -->
      <template #DialogTitle>
        Item Advance List
      </template>

      <!-- Dialog Content -->
      <template #DialogContent>
        <!-- advance view -->
        <section class="q-pa-md">
          <g-table tableKey="itemAdvance" apiUrl="/items/advanceView" :apiFilters="[{ parent: parentId }]" ref="table">
            <!-- slot sku -->
            <template v-slot:sku="props">
              <span @click="viewItemInformation(props.data)" class="clickable-code">{{ props.data.sku }}</span>
            </template>
          </g-table>
        </section>
      </template>
    </TemplateDialog>

    <item-information-dialog v-model="isItemInformationDialogOpen" :itemId="itemId"
      @close="isItemInformationDialogOpen = false" @itemInformationUpdated="this.$refs.table.refetch()">
    </item-information-dialog>
  </q-dialog>
</template>

<style scoped lang="scss">
.clickable-code {
  color: var(--q-primary);
  cursor: pointer;
  text-decoration: underline;

  &:hover {
    opacity: 0.8;
  }
}
</style>

<script>
import { defineAsyncComponent } from 'vue';
import GTable from "../shared/display/GTable.vue";
import TemplateDialog from './TemplateDialog.vue';

// Lazy-loaded dialogs (ALL dialogs must be lazy loaded - CLAUDE.md)
const ItemInformationDialog = defineAsyncComponent(() =>
  import('./ItemInformationDialog/ItemInformationDialog.vue')
);

export default {
  name: 'ItemAdvanceListDialog',
  components: {
    GTable,
    TemplateDialog,
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
    fetchData() { },
  },
};
</script>