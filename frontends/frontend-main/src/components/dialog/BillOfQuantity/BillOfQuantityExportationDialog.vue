<template>
  <q-dialog>
    <q-card class="full-width dialog-card">
      <q-bar class="bg-primary text-white cursor-default" dark>
        <q-icon name="o_task" />
        <div>Bill of Quantity (Excel Exportation)</div>

        <q-space />

        <q-btn dense flat icon="close" v-close-popup>
          <q-tooltip>Close</q-tooltip>
        </q-btn>
      </q-bar>

      <q-card-section>
        <div class="boq-header">
          <div class="col-12 text-right">
            <q-btn no-caps c outline type="button" color="primary" @click="exportToExcel">
              <q-icon class="q-mr-xs" size="14px" name="file_download"></q-icon>
              Download Excel
            </q-btn>
          </div>
        </div>
        <div class="boq-content">
          <table ref="boqTable" class="non-selectable">
            <thead>
              <tr>
                <th style="width: 400px;" rowspan="2">Particulars</th>
                <th rowspan="2" width="50px">Qty</th>
                <th rowspan="2" width="60px">Unit</th>
                <th colspan="2">Material Cost (VAT-EX)</th>
                <th colspan="2">Labor/Equip-Rental Cost (VAT-EX)</th>
                <th rowspan="2">Gross Total</th>
              </tr>
              <tr>
                <th>Unit Cost</th>
                <th>Total</th>
                <th>Unit Cost</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              <BillOfQuantityDialogExportationItems :boqInformation="boqInformation" :items="boqItems">
              </BillOfQuantityDialogExportationItems>
              <tr>
                <td colspan="6"></td>
                <td class="text-right">Grand Total</td>
                <td class="text-right text-weight-medium">{{ numberFormat(boqTotalWithProfit, 2) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<style scoped lang="scss">
.dialog-card {
  max-width: 95%;
  min-height: 600px;
}
</style>
<style scoped src="./BillOfQuantityExportationDialog.scss"></style>
<script>
import { defineAsyncComponent } from 'vue';

// Lazy-loaded dialogs (ALL dialogs must be lazy loaded - CLAUDE.md)
const BillOfQuantityDialogExportationItems = defineAsyncComponent(() =>
  import('./BillOfQuantityExportationItemsDialog.vue')
);

export default {
  name: 'TemplateDialog',
  components: {
    BillOfQuantityDialogExportationItems,
  },
  props: {
    projectInformation: {
      type: Object,
      required: true,
    },
    boqItems: {
      type: Array,
      required: true,
    },
    boqTotal: {
      type: Number,
      required: true,
    },
    boqTotalWithProfit: {
      type: Number,
      required: true,
    },
  },
  data: () => ({
  }),
  watch: {
  },
  methods: {
    exportToExcel() {
      // Excel export functionality is under development
      // Will be migrated to backend for better performance and security
      this.$q.notify({
        type: 'info',
        message: 'Excel export is under development. This feature will be available soon.',
        position: 'top',
        timeout: 3000
      });
    },
  },
};
</script>
