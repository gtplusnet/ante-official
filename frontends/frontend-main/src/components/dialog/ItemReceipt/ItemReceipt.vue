<template>
  <q-dialog @before-show="fetchData" transition-show="none">
    <q-card
      style="width: 900px; max-width: 900px"
      v-if="!isLoading"
      class="full-width"
    >
      <q-bar class="bg-primary text-white cursor-default" dark>
        <q-icon name="receipt" />
        <div class="text-title-medium">{{ receiptInformation.itemReceiptInfo.code }}</div>

        <q-space />

        <q-btn dense flat icon="close" v-close-popup>
          <q-tooltip class="text-label-small">Close</q-tooltip>
        </q-btn>
      </q-bar>

      <q-card-section>
        <!-- header 1 -->
        <div class="header-row-1 row justify-between">
          <div class="left"></div>
          <div class="right text-title-small">
            {{ receiptInformation.itemReceiptType.label }}
          </div>
        </div>

        <!-- header 2 -->
        <div class="header-row-2 row justify-between">
          <div class="left">
            <div class="row">
              <!-- address -->
              <div class="q-mr-md text-body-small">
                <div>Le Grand Tower 1</div>
                <div>1, 1800 Economia Road</div>
                <div>Quezon City, 1800 Metro Manila</div>
              </div>

              <!-- other details -->
              <div>
                <div>
                  <span class="text-body-small">Phone: </span> +63 9171587078
                </div>
                <div>
                  <span class="text-body-small">Email: </span>
                  johndoe@example.com
                </div>
                <div>
                  <span class="text-body-small">Website: </span>
                  www.example.com
                </div>
              </div>
            </div>
          </div>

          <!-- code -->
          <div class="right text-right q-mt-sm">
            <div>
              <span class="text-body-small">Reference: </span>
              {{ receiptInformation.itemReceiptInfo.code }}
            </div>
            <div>
              <span class="text-body-small">Processed by: </span>
              {{ receiptInformation.itemReceiptInfo.processedBy }}
            </div>
            <div>
              <span class="text-body-small">Date: </span>
              {{ receiptInformation.itemReceiptInfo.createdAt.dateFull }}
            </div>
          </div>
        </div>

        <!-- item table -->
        <div class="item-table q-mt-lg">
          <table>
            <thead>
              <tr class="text-title-small">
                <th>Item</th>
                <th>Description</th>
                <th class="text-center">Quantity</th>
                <th class="text-center">Rate</th>
                <th class="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="item in receiptInformation.itemReceiptItemList"
                :key="item.id"
                class="text-body-small"
              >
                <td>{{ item.itemName }} ({{ item.itemSku }})</td>
                <td>{{ item.itemDescription }}</td>
                <td class="text-center">{{ item.quantity }}</td>
                <td class="text-center">
                  {{
                    item.itemRate.formatCurrency ||
                    item.unitPrice.formatCurrency
                  }}
                </td>
                <td class="text-right">{{ item.total.formatCurrency }}</td>
              </tr>
            </tbody>

            <item-receipt-purchase-order-payment
              v-if="
                receiptInformation &&
                receiptInformation.itemReceiptInfo.type.key == 'PURCHASE_ORDER'
              "
              :itemReceiptInfo="receiptInformation.itemReceiptInfo"
            ></item-receipt-purchase-order-payment>
            <tfoot>
              <tr>
                <td colspan="4" class="text-right text-label-medium">Total</td>
                <td class="text-right">
                  {{
                    receiptInformation.itemReceiptInfo.totalPayableAmount
                      .formatCurrency
                  }}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div class="memo">
          <div class="title text-label-medium">Memo:</div>
          <div class="memo-content text-body-small">
            {{
              receiptInformation.itemReceiptInfo.memo
                ? receiptInformation.itemReceiptInfo.memo
                : 'No memo'
            }}
          </div>
        </div>
      </q-card-section>
    </q-card>

    <q-card style="padding: 30px" v-else>
      <global-loader />
    </q-card>
  </q-dialog>
</template>

<style src="./ItemReceipt.scss" scoped></style>

<script>
import { api } from 'src/boot/axios';
import GlobalLoader from "../../../components/shared/common/GlobalLoader.vue";
import ItemReceiptPurchaseOrderPayment from './ItemReceiptPurchaseOrderPayment.vue';
export default {
  name: 'ItemReceipt',
  props: {
    itemReceiptId: {
      type: Number,
      required: true,
    },
  },
  components: {
    GlobalLoader,
    ItemReceiptPurchaseOrderPayment,
  },
  data: () => ({
    isLoading: true,
    receiptInformation: null,
  }),
  watch: {},
  methods: {
    async fetchData() {
      this.isLoading = true;

      // Fetch data here
      try {
        const response = await api.get(
          '/item-receipts?id=' + this.itemReceiptId
        );
        this.receiptInformation = response.data;
      } catch (error) {
        this.handleAxiosError(error);
      }

      this.isLoading = false;
    },
  },
};
</script>
