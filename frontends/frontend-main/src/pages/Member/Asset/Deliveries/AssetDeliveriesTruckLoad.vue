<template>
  <expanded-nav-page-container>
    <div class="page-head">
      <div class="title text-headline-small">For Truck Load</div>
    </div>
    <div class="bread-crumbs text-body-small">
      <q-breadcrumbs>
        <q-breadcrumbs-el label="Dashboard" :to="{ name: 'member_dashboard' }" />
        <q-breadcrumbs-el label="Asset Management" />
        <q-breadcrumbs-el label="Deliveries" />
        <q-breadcrumbs-el label="For Truck Load" />
      </q-breadcrumbs>
    </div>
    <div class="page-content">
      <g-card class="q-pa-md q-mt-sm">
        <!-- For Truck Load Table -->
        <g-table :isRowActionEnabled="true" tableKey="delivery" apiUrl="/delivery"
          :apiFilters="[{ deliveryStatus: ['TRUCK_LOAD', 'FOR_PICKUP'] }]" ref="table">
          <template v-slot:row-actions="props">
            <q-btn @click="confirmNextStage(props.data)" rounded class="q-mr-sm text-title-small" no-caps :color="props.data.truckLoadStage.nextStageColor" unelevated>
              <q-icon class="q-mr-sm" size="20px" :name="props.data.truckLoadStage.nextStageIcon"></q-icon> {{ props.data.truckLoadStage.nextStageLabel }}
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

    <!-- Item receipt dialog -->
    <ItemReceipt v-if="isItemReceiptDialogOpen" v-model="isItemReceiptDialogOpen" :itemReceiptId="itemReceiptId" :warehouseId="warehouseId" />
    <!-- For Truck Load Dialog -->
    <TruckLoadDialog v-if="isTruckLoadDialogOpen" v-model="isTruckLoadDialogOpen" :deliveryId="deliveryId" @onClose="$refs.table.refetch()" />
  </expanded-nav-page-container>
</template>

<style scoped src="../AssetDeliveries.scss"></style>

<script>
import { defineAsyncComponent } from 'vue';
import ExpandedNavPageContainer from '../../../../components/shared/ExpandedNavPageContainer.vue';
import GTable from '../../../../components/shared/display/GTable.vue';
import GCard from '../../../../components/shared/display/GCard.vue';
import { api } from 'src/boot/axios';

// Lazy-loaded dialogs (ALL dialogs must be lazy loaded - CLAUDE.md)
const ItemReceipt = defineAsyncComponent(() =>
  import('../../../../components/dialog/ItemReceipt/ItemReceipt.vue')
);
const TruckLoadDialog = defineAsyncComponent(() =>
  import('../../../../components/dialog/TruckLoadDialog.vue')
);

export default {
  components: {
    ExpandedNavPageContainer,
    GTable,
    GCard,
    ItemReceipt,
    TruckLoadDialog,
  },
  data: () => ({
    isItemReceiptDialogOpen: false,
    itemReceiptId: 0,
    isTruckLoadDialogOpen: false,
    deliveryId: 0,
    warehouseId: '',
  }),
  methods: {
    async confirmNextStage(data) {
      if (data.truckLoadStage.nextStage == 'FOR_DELIVERY') {
        this.deliveryId = Number(data.id);
        this.isTruckLoadDialogOpen = true;
      }
      else {
        this.$q.dialog({
          title: 'Confirm',
          message: `Are you sure you want to set delivery of <b>${data.sourceDeliveryReceipt.code}</b> to ${data.truckLoadStage.nextStageLabel}?`,
          ok: 'Yes',
          cancel: 'No',
          html: true,
        }).onOk(() => {
          this.setNextStage(data);
        });
      }
    },
    async setNextStage(data) {
      this.$q.loading.show();
      try {
        const response = await api.post('/delivery/set-stage', {
          deliveryId: data.id,
          newStage: data.truckLoadStage.nextStage,
        });

        console.log(response);

        this.$refs.table.refetch();
      } catch (error) {
        console.error('Error setting next stage:', error);
      } finally {
        this.$q.loading.hide();
      }
    },
    onOpenItemReceiptDialog(itemReceiptId) {
      this.itemReceiptId = itemReceiptId;
      this.isItemReceiptDialogOpen = true;
    },
    cancelDelivery(data) {
      console.log(data);
    }
  },
};
</script>