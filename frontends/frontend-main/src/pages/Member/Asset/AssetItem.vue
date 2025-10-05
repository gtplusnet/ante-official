<template>
  <expanded-nav-page-container>
    <div class="page-head">
      <div class="title text-headline-small">Item Management</div>
    </div>
    <div class="bread-crumbs text-body-small">
      <q-breadcrumbs>
        <q-breadcrumbs-el label="Dashboard" :to="{ name: 'member_dashboard' }" />
        <q-breadcrumbs-el label="Asset Management" />
        <q-breadcrumbs-el label="Item" />
      </q-breadcrumbs>
    </div>
    <div class="page-content">
      <div class="page-content-actions row justify-between">
        <div class="left">
          <div class="item-tab text-label-medium">
            <div v-for="tab in tabList" :key="tab.column" class="tab text-label-medium" :class="tab.key == activeTab ? 'active' : ''"
              @click="changeTab(tab.key)">
              <q-icon class="icon" :name="tab.icon"></q-icon>
              {{ tab.name }}
            </div>
          </div>
        </div>
        <div class="right">
          <q-btn no-caps color="primary" class="text-label-large" rounded unelevated @click="onOpenItemCreateEditDialog">
            <q-icon size="16px" name="add"></q-icon>
            Add Item
          </q-btn>
        </div>
      </div>
      <g-card class="q-pa-md q-mt-sm text-body-small">
        <!-- simple view -->
        <SimpleItemTable ref="table" :tab="activeTab" v-if="activeTab == 'simple'"></SimpleItemTable>

        <!-- advance view -->
        <AdvanceItemTable ref="table" v-if="activeTab == 'advance'"></AdvanceItemTable>

        <!-- deleted view -->
        <SimpleItemTable :tab="activeTab" v-if="activeTab == 'deleted'"></SimpleItemTable>
      </g-card>

      <!-- item information dialog -->
      <ItemInformationDialog v-if="itemId" :itemId="itemId" v-model="isItemInformationDialogOpen" />

      <!-- item create edit dialog -->
      <ItemCreateEditDialog  v-model="isItemCreateEditDialogOpen" :itemInformation="itemInformation"
        @close="onCloseItemCreateEditDialog" />

      <!-- item advance list dialog -->
      <ItemAdvanceListDialog v-if="isItemAdvanceListDialogOpen" v-model="isItemAdvanceListDialogOpen"
        :parentId="parentId">
      </ItemAdvanceListDialog>
    </div>
  </expanded-nav-page-container>
</template>

<style scoped src="./AssetItem.scss"></style>

<script>
import { defineAsyncComponent } from 'vue';
import ExpandedNavPageContainer from '../../../components/shared/ExpandedNavPageContainer.vue';
import GCard from "../../../components/shared/display/GCard.vue";
import SimpleItemTable from "../../../components/tables/SimpleItemTable.vue";
import AdvanceItemTable from "../../../components/tables/AdvanceItemTable.vue";

// Lazy-loaded dialogs (ALL dialogs must be lazy loaded - CLAUDE.md)
const ItemCreateEditDialog = defineAsyncComponent(() =>
  import("../../../components/dialog/ItemCreateEditDialog/ItemCreateEditDialog.vue")
);
const ItemInformationDialog = defineAsyncComponent(() =>
  import("../../../components/dialog/ItemInformationDialog/ItemInformationDialog.vue")
);
const ItemAdvanceListDialog = defineAsyncComponent(() =>
  import("../../../components/dialog/ItemAdvanceListDialog.vue")
);

export default {
  name: 'MemberAssetWarehouse',
  components: {
    ExpandedNavPageContainer,
    GCard,
    ItemCreateEditDialog,
    ItemInformationDialog,
    ItemAdvanceListDialog,
    SimpleItemTable,
    AdvanceItemTable,
  },
  props: {},
  data: () => ({
    form: {},
    parentId: null,
    activeTab: 'simple',
    tabList: [
      { key: 'simple', name: 'Simple View', icon: 'view_column' },
      { key: 'advance', name: 'Advance View', icon: 'view_module' },
      { key: 'deleted', name: 'Deleted List', icon: 'delete' },
    ],
    isItemCreateEditDialogOpen: false,
    isItemInformationDialogOpen: false,
    itemId: null,
    itemInformation: null,
    isItemAdvanceListDialogOpen: false,
  }),
  mounted() { },
  methods: {
    changeTab(tab) {
      this.activeTab = tab;
      if (this.$refs.table) {
        this.$refs.table.refetch();
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
  },
  computed: {},
};
</script>
