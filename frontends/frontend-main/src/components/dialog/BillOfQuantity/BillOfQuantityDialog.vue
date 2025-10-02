<template>
  <q-dialog :maximized="true" persistent transition-show="slide-up" transition-hide="slide-down">
    <template v-if="!isLoading">
      <q-card class="boq">
        <q-bar class="bg-primary text-white boq-title text-title-medium">
          Bill of Quantity ({{ projectInformation?.name }} - Boq#{{ this.boqId }}) <q-space />
          <q-btn dense flat icon="close" v-close-popup>
            <q-tooltip class="bg-white text-primary text-label-small">Close</q-tooltip>
          </q-btn>
        </q-bar>
        <q-card-section class="q-pt-none q-px-none">
          <div class="full-width row justify-between q-pa-md">
            <div class="row q-gutter-x-sm">
              <q-btn unelevated no-caps color="light-grey" type="button" @click="isBillOfQuantityExportationShown = true">
                <q-icon name="outbox" class="text-dark" />
                <q-tooltip class="text-label-small">Excel Exportation</q-tooltip>
              </q-btn>
              <q-btn unelevated no-caps color="light-grey" type="button" @click="showVersionshowBillOfQuantityVersion()">
                <q-icon name="history" class="text-dark" />
                <q-tooltip class="text-label-small">Version History</q-tooltip>
              </q-btn>
              <q-btn v-if="boqInformation?.status == 'PENDING'" unelevated no-caps type="button" color="light-grey" @click="lockBoq(true)">
                <q-icon class="text-dark" name="lock_open"></q-icon>
                <q-tooltip class="text-label-small">Unlock</q-tooltip>
              </q-btn>

              <q-btn v-if="boqInformation?.status == 'LOCKED'" unelevated no-caps type="button" color="light-grey" @click="lockBoq(false)">
                <q-icon class="text-dark" name="lock"></q-icon>
                <q-tooltip class="text-label-small">Lock</q-tooltip>
              </q-btn>
            </div>

            <div class="row q-gutter-x-sm">
              <q-btn no-caps :disabled="isPurchaseRequestEnabled" type="button" color="secondary" @click="createPurchaseRequest()">
                <q-icon class="q-mr-xs" size="14px" name="add"></q-icon>
                <q-tooltip class="text-label-small">Purchase Request</q-tooltip>
              </q-btn>

              <q-btn no-caps type="button" color="secondary" @click="showVersionshowBillOfQuantityNewVersion()">
                <q-icon class="q-mr-xs" size="14px" name="add"></q-icon>
                <q-tooltip class="text-label-small">New Version</q-tooltip>
              </q-btn>

              <q-btn no-caps :disabled="isPurchaseRequestEnabled" label="Send" type="button" color="secondary" class="text-label-large"/>
            </div>
          </div>

          <q-scroll-area class="boq-content">
            <table ref="boqTable" class="non-selectable">
              <thead>
                <tr>
                  <th width="50px"></th>
                  <th width="30px"></th>
                  <th width="400px" class="text-title-small">Particulars</th>
                  <th rowspan="2" width="100px" class="text-title-small">Qty</th>
                  <th rowspan="2" width="50px" class="text-title-small">Unit</th>
                  <th colspan="2" class="text-title-small">Material Cost (VAT-EX)</th>
                  <th width="40px" class="text-title-small">%</th>
                  <th colspan="2" class="text-title-small">Labor/Equip-Rental Cost (VAT-EX)</th>
                  <th rowspan="2" class="text-title-small">Direct Cost</th>
                  <th rowspan="2" width="50px" class="text-title-small">PM</th>
                  <th rowspan="2" class="text-title-small">Profit</th>
                  <th rowspan="2" class="text-title-small">Gross Total</th>
                </tr>
                <tr>
                  <th></th>
                  <th></th>
                  <th class="particulars"></th>
                  <th class="text-title-small">Unit Cost</th>
                  <th class="text-title-small">Total</th>
                  <th></th>
                  <th class="text-title-small">Unit Cost</th>
                  <th class="text-title-small">Total</th>
                </tr>
                <q-menu touch-position context-menu>
                  <q-list dense style="min-width: 100px">
                    <q-item clickable v-close-popup>
                      <q-item-section @click="showBillOfQuantityAddDialog('last', {})" class="text-label-medium">Insert Heading Item</q-item-section>
                    </q-item>
                  </q-list>
                </q-menu>
              </thead>
              <tbody>
                <BillOfQuantityDialogItems :boqInformation="boqInformation" :boqId="boqId" v-if="boqItems" :items="boqItems" />
                <tr class="GRANDTOTAL">
                  <td></td>
                  <td></td>
                  <td class="particular text-right" colspan="8"></td>
                  <td class="text-right text-label-large">
                    {{ numberFormat(boqTotal) }}
                  </td>
                  <td></td>
                  <td class="text-right text-label-large">Grand Total</td>
                  <td class="text-right text-label-large">
                    {{ numberFormat(boqTotalWithProfit) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </q-scroll-area>
        </q-card-section>
      </q-card>
    </template>

    <BillOfQuantityDialogUpdate v-if="boqInformation" v-model="utilityStore.isBillOfQuantityEditShown" :boqId="boqId" :itemInformation="utilityStore.billOfQuantityItemClicked" :boqInformation="boqInformation" />
    <BillOfQuantityDialogInsert v-if="boqInformation" v-model="utilityStore.isBillOfQuantityAddShown" :boqId="boqId" :itemInformation="utilityStore.billOfQuantityItemClicked" :method="utilityStore.billOfQuantityAddMethod" />
    <BillOfQuantityDialogQtyTakeOff v-if="boqInformation" v-model="utilityStore.isBillOfQuantityQtyTakeOffShown" :itemInformation="utilityStore.billOfQuantityItemClicked" @close="quantityTakeOffSubmitted()" />
    <BillOfQuantityDialogVersionHistory v-if="boqInformation" v-model="isBillOfQuantityVersionShown" :boqId="boqId" :projectId="projectId" :isBillVersionOpenNew="isBillVersionOpenNew" />
    <BillOfQuantityDialogVersionHistorySubmit v-if="boqInformation" v-model="isBillOfQuantityVersionSubmitShown" @saveDone="isBillOfQuantityVersionSubmitShown = false" :projectId="projectId" />
    <PurchaseRequestDialog @saveDone="reloadFromSocket" v-if="boqInformation" :billOfQuantityId="boqInformation.id" v-model="isPurchaseRequestDialogShown" :projectId="projectId" />
    <BillOfQuantityExportation v-if="projectInformation" :projectInformation="projectInformation" :boqItems="boqItems" :boqTotal="boqTotal" :boqTotalWithProfit="boqTotalWithProfit" v-model="isBillOfQuantityExportationShown" :projectId="projectId" />
  </q-dialog>
</template>

<style scoped src="./BillOfQuantityDialog.scss"></style>

<script>
import BillOfQuantityDialogItems from './BillOfQuantityDialogItems.vue';
import BillOfQuantityDialogUpdate from './BillOfQuantityDialogUpdate.vue';
import BillOfQuantityDialogInsert from './BillOfQuantityDialogInsert.vue';
import BillOfQuantityDialogQtyTakeOff from './BillOfQuantityDialogQtyTakeOff.vue';
import BillOfQuantityDialogVersionHistory from './BillOfQuantityDialogVersionHistory.vue';
import BillOfQuantityDialogVersionHistorySubmit from './BillOfQuantityDialogVersionHistorySubmit.vue';
import BillOfQuantityExportation from './BillOfQuantityExportationDialog.vue';
import PurchaseRequestDialog from '../ItemTransactionsDialog/PurchaseRequestDialog.vue';
import { api } from 'src/boot/axios';
import { useUtilityStore } from '../../../stores/utility';

export default {
  name: 'BillOfQuantityDialog',
  components: {
    BillOfQuantityDialogItems,
    BillOfQuantityDialogUpdate,
    BillOfQuantityDialogInsert,
    BillOfQuantityDialogQtyTakeOff,
    BillOfQuantityDialogVersionHistory,
    BillOfQuantityDialogVersionHistorySubmit,
    BillOfQuantityExportation,
    PurchaseRequestDialog,
  },
  props: {
    projectId: Number,
  },
  computed: {
    isPurchaseRequestEnabled() {
      return this.utilityStore.billOfQuantityCheckedItems.length > 0 ? false : true;
    },
  },
  data() {
    return {
      utilityStore: useUtilityStore(),
      isLoading: true,
      billOfQuantity: null,
      projectInformation: null,
      boqId: null,
      isBillOfQuantityVersionShown: false,
      isBillOfQuantityVersionSubmitShown: false,
      isBillVersionOpenNew: false,
      boqInformation: null,
      boqItems: null,
      boqTotal: 0,
      boqTotalWithProfit: 0,
      isPurchaseRequestDialogShown: false,
      isBillOfQuantityExportationShown: false,
    };
  },
  mounted() {
    this.fetchDataProjectInformation();
    this.utilityStore.clearBoqCheckedItems();
  },
  methods: {
    quantityTakeOffSubmitted() {
      this.utilityStore.isBillOfQuantityQtyTakeOffShown = false;
      this.reloadFromSocket();
    },
    createPurchaseRequest() {
      this.isPurchaseRequestDialogShown = true;
    },
    lockBoq(isLock = true) {
      this.$q
        .dialog({
          title: 'Lock Bill of Quantity',
          message: 'Are you sure you want to ' + (isLock ? 'lock' : 'unlock') + ' this Bill of Quantity?',
          ok: 'Yes',
          cancel: 'No',
        })
        .onOk(() => {
          this.apiLockBoq(isLock);
        });
    },
    apiLockBoq(isLock) {
      const sendData = {
        message: 'BOQ_LOCK',
        data: {
          boqId: this.boqId,
          isLock: isLock,
        },
      };

      this.socketStore.socket.emit('BOQ_LOCK', sendData);
    },
    async showVersionshowBillOfQuantityNewVersion() {
      this.isBillOfQuantityVersionSubmitShown = true;
    },
    async showVersionshowBillOfQuantityVersion() {
      this.isBillOfQuantityVersionShown = true;
    },
    async showBillOfQuantityAddDialog(referenceMethod, item) {
      this.utilityStore.openBillOfQuantityAddDialog(referenceMethod, item);
    },
    async fetchDataProjectInformation() {
      try {
        this.isLoading = true;
        const response = await api.get('/project?id=' + this.projectId);
        this.projectInformation = response.data;
        this.boqId = response.data.latestBoq.id;
        this.joinBoqRoom();
      } catch (error) {
        this.handleAxiosError(error);
      } finally {
        this.isLoading = false;
      }
    },
    async joinBoqRoom() {
      if (this.socketStore.socket && this.socketStore.isConnected && this.boqId) {
        const sendData = { event: 'BOQ_JOIN', data: { boqId: this.boqId } };
        await this.socketStore.socket.emit('BOQ_JOIN', sendData);
        this.watchSocketEvent();
      } else {
        setTimeout(() => {
          this.joinBoqRoom();
        }, 1000);
      }
    },
    async reloadFromSocket() {
      this.$q.loading.show();
      const sendData = { event: 'BOQ_RELOAD', data: { boqId: this.boqId } };
      this.socketStore.socket.emit('BOQ_RELOAD', sendData);
    },
    async watchSocketEvent() {
      if (this.socketStore.socket) {
        this.socketStore.socket.on('BOQ_DATA', (data) => {
          this.boqInformation = data.boqInformation;
          this.boqItems = data.boqItems;
          this.boqTotal = data.boqTotal;
          this.boqTotalWithProfit = data.boqTotalWithProfit || 0;
          this.$q.loading.hide();
        });
      }
    },
  },
  beforeUnmount() {
    const sendData = { event: 'BOQ_LEAVE', data: { boqId: this.boqId } };
    this.socketStore.socket.emit('BOQ_LEAVE', sendData);
  },
};
</script>
