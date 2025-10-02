<template>
  <expanded-nav-page-container>
    <div class="page-head">
      <div class="title text-headline-small">Pending Receive Deliveries</div>
    </div>
    <div class="bread-crumbs text-body-small">
      <q-breadcrumbs>
        <q-breadcrumbs-el label="Dashboard" :to="{ name: 'member_dashboard' }" />
        <q-breadcrumbs-el label="Asset Management" />
        <q-breadcrumbs-el label="Deliveries" />
        <q-breadcrumbs-el label="Pending Receive" />
      </q-breadcrumbs>
    </div>
    <div class="page-content">
      <div class="page-content-actions row justify-between">
        <div class="left">
        </div>
        <div class="right">
          <item-create-edit-dialog v-model="isItemCreateEditDialogOpen" />
        </div>
      </div>
      <g-card class="q-pa-md q-mt-sm">
        <!-- Pending Receive Table -->
        <g-table :isRowActionEnabled="true" tableKey="delivery" apiUrl="/delivery"
          :apiFilters="[{ deliveryStatus: ['PENDING', 'INCOMPLETE'] }]" ref="table">
          <template v-slot:row-actions="props">
            <q-btn @click="receiveItem(props.data)" rounded class="q-mr-sm text-title-small" no-caps color="primary" unelevated>
              <q-icon class="q-mr-sm" size="20px" name="edit"></q-icon> Receive Item
            </q-btn>
          </template>

          <template v-slot:status="props">
            <q-chip size="12px" :color="props.data.status.color" :text-color="props.data.status.textColor" class="text-label-medium">
              {{ props.data.status.label }}
            </q-chip>
          </template>

          <template v-slot:sourceReceipt="props">
            <span @click="onOpenItemReceiptDialog(props.data.sourceDeliveryReceipt.id)" class="clickable-code text-label-medium">
              {{props.data.sourceDeliveryReceipt.code }}
            </span>
          </template>

          <template v-slot:cancel="props">
            <q-btn @click="cancelDelivery(props.data)" color="red" round flat icon="cancel" />
          </template>
        </g-table>
      </g-card>
    </div>

    <!-- Item Create Edit dialog -->
    <ItemCreateEditDialog v-if="isItemCreateEditDialogOpen" v-model="isItemCreateEditDialogOpen" @onClose="onCloseItemCreateEditDialog()" />
    <!-- item receipt dialog -->
    <ItemReceipt v-if="isItemReceiptDialogOpen" v-model="isItemReceiptDialogOpen" :itemReceiptId="itemReceiptId" :warehouseId="warehouseId" />
    <!-- Receive Item Dialog -->
    <ReceiveItemDialog v-if="isReceiveItemDialogOpen" v-model="isReceiveItemDialogOpen" :itemReceiptId="itemReceiptId" :deliveryId="deliveryId" :warehouseId="warehouseId" @onClose="$refs.table.refetch()" />
  </expanded-nav-page-container>
</template>

<style scoped src="../AssetDeliveries.scss"></style>

<script>
import ExpandedNavPageContainer from '../../../../components/shared/ExpandedNavPageContainer.vue';
import GTable from '../../../../components/shared/display/GTable.vue';
import GCard from '../../../../components/shared/display/GCard.vue';
import ItemCreateEditDialog from '../../../../components/dialog/ItemCreateEditDialog/ItemCreateEditDialog.vue';
import ItemReceipt from '../../../../components/dialog/ItemReceipt/ItemReceipt.vue';
import ReceiveItemDialog from '../../../../components/dialog/ItemTransactionsDialog/ReceiveItemDialog.vue';

export default {
  components: {
    ExpandedNavPageContainer,
    GTable,
    GCard,
    ItemCreateEditDialog,
    ItemReceipt,
    ReceiveItemDialog,
  },
  data: () => ({
    isItemReceiptDialogOpen: false,
    itemReceiptId: 0,
    isItemCreateEditDialogOpen: false,
    deliveryId: 0,
    isReceiveItemDialogOpen: false,
    warehouseId: '',
  }),
  methods: {
    async receiveItem(data) {
      this.warehouseId = data.toWarehouse.id;
      this.itemReceiptId = data.inTransitDeliveryReceipt.id;
      this.deliveryId = data.id;
      this.isReceiveItemDialogOpen = true;
    },
    onOpenItemReceiptDialog(itemReceiptId) {
      this.itemReceiptId = itemReceiptId;
      this.isItemReceiptDialogOpen = true;
    },
    onOpenItemCreateEditDialog() {
      this.isItemCreateEditDialogOpen = true;
    },
    onCloseItemCreateEditDialog() {
      this.isItemCreateEditDialogOpen = false;
      this.$refs.table.refetch();
    },
    cancelDelivery(data) {
      console.log(data);
    }
  },
};
</script>