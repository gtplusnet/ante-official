<template>
  <q-dialog class="dialog" @before-show="loadInitialData">
    <q-card class="full-width dialog-card">
      <q-bar class="bg-primary text-white cursor-default" dark>
        <q-icon name="person" />
        <div class="text-title-medium">View Summary</div>

        <q-space />

        <q-btn dense flat icon="close" v-close-popup>
          <q-tooltip class="text-label-small">Close</q-tooltip>
        </q-btn>
      </q-bar>
      <q-card-section v-if="this.summaryData">
        <pre>
        </pre>
        <table class="custom-table">
          <thead>
            <tr class="text-title-small">
              <th class="text-left"></th>
              <th>Previous</th>
              <th>To Date</th>
              <th>This Period</th>
            </tr>
          </thead>
          <tbody class="text-center text-body-small" v-if="this.summaryData">
            <tr>
              <td class="text-left text-label-medium">Percentage</td>
              <td>{{ this.summaryData.previous.percentage }} %</td>
              <td>{{ this.summaryData.toDate.percentage }} %</td>
              <td>{{ this.summaryData.thisPeriod.percentage }} %</td>
            </tr>
            <tr>
              <td class="text-left text-label-medium">Amount</td>
              <td>{{ this.summaryData.previous.amount.formatCurrency }}</td>
              <td>{{ this.summaryData.toDate.amount.formatCurrency }}</td>
              <td>{{ this.summaryData.thisPeriod.amount.formatCurrency }}</td>
            </tr>
            <tr>
              <td class="text-left" colspan=4>Deductions</td>

            </tr>
            <tr>
              <td class="text-left">
                &nbsp; &nbsp; &nbsp; Downpayment ({{ this.summaryData.projectDownpaymentPercentage }}%)
              </td>
              <td>
                ({{ this.summaryData.previous.downpaymentDeduction.formatCurrency }})
              </td>
              <td>
                ({{ this.summaryData.toDate.downpaymentDeduction.formatCurrency }})
              </td>
              <td>
                ({{ this.summaryData.thisPeriod.downpaymentDeduction.formatCurrency}})
              </td>

            </tr>
            <tr>
              <td class="text-left text-label-medium">
                &nbsp; &nbsp; &nbsp; Retention ({{
                  this.summaryData.projectRetentionFeePercentage
                }}%)
              </td>
              <td>
                ({{ this.summaryData.previous.retentionDeduction.formatCurrency }})
              </td>
              <td>
                ({{ this.summaryData.toDate.retentionDeduction.formatCurrency }})
              </td>
              <td>
                ({{ this.summaryData.thisPeriod.retentionDeduction.formatCurrency }})
              </td>
            </tr>
            <tr>
              <td></td>
              <td class="text-grey">{{ this.summaryData.previous.subtotal.formatCurrency }}</td>
              <td class="text-grey">{{ this.summaryData.toDate.subtotal.formatCurrency }}</td>
            </tr>
            <tr>
              <td class="text-left text-label-medium">Billable Amount</td>
              <td></td>
              <td></td>
              <td>{{ this.summaryData.billableAmount.formatCurrency }}</td>
            </tr>
            <tr>
              <td class="text-left text-label-medium">Collected Amount</td>
              <td></td>
              <td></td>
              <td>{{ this.summaryData.collectedAmount.formatCurrency }}</td>
            </tr>
            <tr>
              <td class="text-left text-label-medium">Outstanding Balance</td>
              <td></td>
              <td></td>
              <td class="text-red">
                {{ this.summaryData.outstandingBalance.formatCurrency }}
              </td>
            </tr>
          </tbody>
        </table>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<style scoped>
.dialog {
  max-width: 800px;
}
.custom-table {
  width: 100%;
  border-collapse: collapse;
}
.custom-table th,
.custom-table td {
  border: 1px solid #ddd;
  padding: 8px;
  background-color: #fff;
}
.custom-table th {
  background-color: #fff;
}
.text-red {
  color: red;
  font-weight: 600;
}
.text-left {
  text-align: left;
}
</style>

<script>
import { api } from 'src/boot/axios';

export default {
  name: 'TemplateComponent',
  props: {
    collectionData: {
      type: Object,
      required: true,
    },
  },
  data: () => ({
    summaryData: null,
  }),
  watch: {},
  methods: {
    loadInitialData() {
      api
        .get('collection/accomplishment-summary?id=' + this.collectionData.id)
        .then((response) => {
          this.summaryData = response.data.data;
        })
        .catch((error) => {
          console.log(error);
        });
    },
  },
};
</script>
