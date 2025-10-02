<template>
  <expanded-nav-page-container>
    <div class="page-head">
      <div class="title text-headline-small">Canceled Deliveries</div>
    </div>
    <div class="bread-crumbs text-body-small">
      <q-breadcrumbs>
        <q-breadcrumbs-el label="Dashboard" :to="{ name: 'member_dashboard' }" />
        <q-breadcrumbs-el label="Asset Management" />
        <q-breadcrumbs-el label="Deliveries" />
        <q-breadcrumbs-el label="Canceled" />
      </q-breadcrumbs>
    </div>
    <div class="page-content">
      <g-card class="q-pa-md q-mt-sm">
        <!-- Canceled Deliveries Table -->
        <g-table tableKey="delivery" apiUrl="/delivery"
          :apiFilters="[{ deliveryStatus: ['CANCELED'] }]" ref="table">
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
        </g-table>
      </g-card>
    </div>

    <!-- Item receipt dialog -->
    <ItemReceipt v-if="isItemReceiptDialogOpen" v-model="isItemReceiptDialogOpen" :itemReceiptId="itemReceiptId" :warehouseId="warehouseId" />
  </expanded-nav-page-container>
</template>

<style scoped src="../AssetDeliveries.scss"></style>

<script>
import ExpandedNavPageContainer from '../../../../components/shared/ExpandedNavPageContainer.vue';
import GTable from '../../../../components/shared/display/GTable.vue';
import GCard from '../../../../components/shared/display/GCard.vue';
import ItemReceipt from '../../../../components/dialog/ItemReceipt/ItemReceipt.vue';

export default {
  components: {
    ExpandedNavPageContainer,
    GTable,
    GCard,
    ItemReceipt,
  },
  data: () => ({
    isItemReceiptDialogOpen: false,
    itemReceiptId: 0,
    warehouseId: '',
  }),
  methods: {
    onOpenItemReceiptDialog(itemReceiptId) {
      this.itemReceiptId = itemReceiptId;
      this.isItemReceiptDialogOpen = true;
    },
  },
};
</script>