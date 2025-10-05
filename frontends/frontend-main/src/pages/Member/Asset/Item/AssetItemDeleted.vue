<template>
  <expanded-nav-page-container>
    <div class="page-head">
      <div class="title text-headline-small">Deleted List</div>
    </div>
    <div class="bread-crumbs text-body-small">
      <q-breadcrumbs>
        <q-breadcrumbs-el label="Dashboard" :to="{ name: 'member_dashboard' }" />
        <q-breadcrumbs-el label="Asset Management" />
        <q-breadcrumbs-el label="Item" />
        <q-breadcrumbs-el label="Deleted List" />
      </q-breadcrumbs>
    </div>
    <div class="page-content">
      <g-card class="q-pa-md q-mt-sm text-body-small">
        <SimpleItemTable ref="table" :tab="'deleted'"></SimpleItemTable>
      </g-card>

      <!-- item information dialog -->
      <ItemInformationDialog v-if="itemId" :itemId="itemId" v-model="isItemInformationDialogOpen" />

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
const ItemInformationDialog = defineAsyncComponent(() =>
  import("../../../../components/dialog/ItemInformationDialog/ItemInformationDialog.vue")
);
const ItemAdvanceListDialog = defineAsyncComponent(() =>
  import("../../../../components/dialog/ItemAdvanceListDialog.vue")
);

export default {
  name: 'MemberAssetItemDeleted',
  components: {
    ExpandedNavPageContainer,
    GCard,
    ItemInformationDialog,
    ItemAdvanceListDialog,
    SimpleItemTable,
  },
  data: () => ({
    parentId: null,
    isItemInformationDialogOpen: false,
    itemId: null,
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
  },
};
</script>