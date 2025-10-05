<template>
  <expanded-nav-page-container>
    <div class="page-head">
      <div class="title text-headline-small">Simple View</div>
    </div>
    <div class="bread-crumbs text-body-small">
      <q-breadcrumbs>
        <q-breadcrumbs-el label="Dashboard" :to="{ name: 'member_dashboard' }" />
        <q-breadcrumbs-el label="Asset Management" />
        <q-breadcrumbs-el label="Item" />
        <q-breadcrumbs-el label="Simple View" />
      </q-breadcrumbs>
    </div>
    <div class="page-content">
      <div class="page-content-actions row justify-between">
        <div class="left"></div>
        <div class="right">
          <q-btn no-caps color="primary" class="text-label-large" rounded unelevated @click="onOpenItemCreateEditDialog">
            <q-icon size="16px" name="add"></q-icon>
            Add Item
          </q-btn>
        </div>
      </div>
      <g-card class="q-pa-md q-mt-sm text-body-small">
        <SimpleItemTable ref="table" :tab="'simple'"></SimpleItemTable>
      </g-card>

      <!-- item information dialog -->
      <ItemInformationDialog v-if="itemId" :itemId="itemId" v-model="isItemInformationDialogOpen" />

      <!-- item create edit dialog -->
      <ItemCreateEditDialog v-model="isItemCreateEditDialogOpen" :itemInformation="itemInformation"
        @close="onCloseItemCreateEditDialog" />

      <!-- item advance list dialog -->
      <ItemAdvanceListDialog v-if="isItemAdvanceListDialogOpen" v-model="isItemAdvanceListDialogOpen"
        :parentId="parentId">
      </ItemAdvanceListDialog>
    </div>
  </expanded-nav-page-container>
</template>

<script>
import { defineAsyncComponent } from 'vue';
import ExpandedNavPageContainer from '../../../../components/shared/ExpandedNavPageContainer.vue';
import GCard from "../../../../components/shared/display/GCard.vue";
import SimpleItemTable from "../../../../components/tables/SimpleItemTable.vue";

// Lazy-loaded dialogs (ALL dialogs must be lazy loaded - CLAUDE.md)
const ItemCreateEditDialog = defineAsyncComponent(() =>
  import("../../../../components/dialog/ItemCreateEditDialog/ItemCreateEditDialog.vue")
);
const ItemInformationDialog = defineAsyncComponent(() =>
  import("../../../../components/dialog/ItemInformationDialog/ItemInformationDialog.vue")
);
const ItemAdvanceListDialog = defineAsyncComponent(() =>
  import("../../../../components/dialog/ItemAdvanceListDialog.vue")
);

export default {
  name: 'MemberAssetItemSimple',
  components: {
    ExpandedNavPageContainer,
    GCard,
    ItemCreateEditDialog,
    ItemInformationDialog,
    ItemAdvanceListDialog,
    SimpleItemTable,
  },
  data: () => ({
    parentId: null,
    isItemCreateEditDialogOpen: false,
    isItemInformationDialogOpen: false,
    itemId: null,
    itemInformation: null,
    isItemAdvanceListDialogOpen: false,
  }),
  methods: {
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
  },
};
</script>