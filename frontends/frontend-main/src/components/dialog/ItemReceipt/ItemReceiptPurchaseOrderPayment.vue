<template>
  <tfoot v-if="itemReceiptInfo.purchaseOrder.balance.raw > 0">
    <tr>
      <td colspan="3" class="text-right"></td>
      <td colspan="2" class="text-right text-title-small q-pt-md q-pb-sm">
        PAYMENT HISTORY
      </td>
    </tr>
    <tr v-for="history of paymentHistory" :key="history.id">
      <td class="text-right text-body-small" colspan="4">
        {{ history.fundAccount.name }} ~ {{ history.createdAt.date }}
      </td>
      <td class="text-right text-body-small text-red">
        {{ history.amount.formatCurrency }}
      </td>
    </tr>
    <tr>
      <td colspan="4" class="text-right text-body-small">Balance Due</td>
      <td class="text-right text-body-small">
        {{ itemReceiptInfo.purchaseOrder.balance.formatCurrency }}
      </td>
    </tr>
  </tfoot>
</template>

<script>
import { api } from 'src/boot/axios';

export default {
  name: 'ItemReceiptPurchaseOrderPayment',
  props: {
    itemReceiptInfo: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      paymentHistory: [],
    };
  },
  mounted() {
    this.loadPaymentHistory();
  },
  methods: {
    loadPaymentHistory() {
      api
        .get(`/purchase-order/payment-history?purchaseOrderId=${this.itemReceiptInfo.purchaseOrder.id}`)
        .then((response) => {
          this.paymentHistory = response.data;
        });
    },
  },
};
</script>
