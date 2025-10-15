<template>
  <div class="annualization-table">
    <div class="report-header q-pa-md">
      <div class="row items-center">
        <div class="col">
          <div class="text-title-medium text-dark">Certificate of Compensation Payment/Tax Withheld</div>
          <div class="text-body-medium text-dark q-mt-xs">Detailed Report</div>
        </div>
        <q-space />
        <GButton
          round
          icon="table_view"
          size="md"
          variant="tonal"
          icon-size="md"
          @click="exportToExcel"
        >
          <q-tooltip class="text-body-small">Export to Excel</q-tooltip>
        </GButton>
      </div>
    </div>

    <q-separator />

    <div class="report-content q-pa-lg">
      <!-- Company Information -->
      <div class="section-block q-mb-lg">
        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-8">
            <div class="text-caption text-on-surface-variant">Company Name:</div>
            <div class="text-body1 text-weight-medium">{{ data.companyName }}</div>
          </div>
          <div class="col-12 col-md-4">
            <div class="text-caption text-on-surface-variant">TIN:</div>
            <div class="text-body1 text-weight-medium">{{ data.companyTin }}</div>
          </div>
        </div>
        <div class="row q-col-gutter-md q-mt-sm">
          <div class="col-12">
            <div class="text-caption text-on-surface-variant">Year Covered:</div>
            <div class="text-body1 text-weight-medium">{{ data.yearCovered }}</div>
          </div>
        </div>
      </div>

      <q-separator class="q-my-lg" />

      <!-- Employee Information -->
      <div class="section-block q-mb-lg">
        <div class="text-subtitle1 text-weight-medium q-mb-md">Employee Information</div>
        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-6">
            <div class="text-caption text-on-surface-variant">Employee Name:</div>
            <div class="text-body1 text-weight-medium">{{ data.employeeName }}</div>
          </div>
          <div class="col-12 col-md-6">
            <div class="text-caption text-on-surface-variant">Position:</div>
            <div class="text-body1">{{ data.position }}</div>
          </div>
        </div>
        <div class="row q-col-gutter-md q-mt-sm">
          <div class="col-12 col-md-6">
            <div class="text-caption text-on-surface-variant">TIN:</div>
            <div class="text-body1">{{ data.tin }}</div>
          </div>
          <div class="col-12 col-md-6">
            <div class="text-caption text-on-surface-variant">Period Covered:</div>
            <div class="text-body1">{{ data.periodCovered }}</div>
          </div>
        </div>
      </div>

      <q-separator class="q-my-lg" />

      <!-- Income Summary -->
      <div class="section-block q-mb-lg">
        <div class="text-subtitle1 text-weight-medium q-mb-md">Income Summary</div>
        <q-markup-table flat bordered class="income-table">
          <tbody>
            <tr>
              <td class="text-body2">Particulars</td>
              <td class="text-right text-body2 text-weight-medium">Amount (₱)</td>
            </tr>
            <tr>
              <td>Basic Salary</td>
              <td class="text-right">{{ formatCurrency(data.incomeSummary.basicSalary) }}</td>
            </tr>
            <tr>
              <td>Overtime Pay</td>
              <td class="text-right">{{ formatCurrency(data.incomeSummary.overtimePay) }}</td>
            </tr>
            <tr>
              <td>Holiday Pay</td>
              <td class="text-right">{{ formatCurrency(data.incomeSummary.holidayPay) }}</td>
            </tr>
            <tr>
              <td>13th Month Pay</td>
              <td class="text-right">{{ formatCurrency(data.incomeSummary.thirteenthMonthPay) }}</td>
            </tr>
            <tr>
              <td>Other Taxable Allowances</td>
              <td class="text-right">{{ formatCurrency(data.incomeSummary.otherTaxableAllowances) }}</td>
            </tr>
            <tr class="total-row">
              <td class="text-weight-bold">Gross Compensation Income</td>
              <td class="text-right text-weight-bold">{{ formatCurrency(data.incomeSummary.grossCompensationIncome) }}</td>
            </tr>
          </tbody>
        </q-markup-table>
      </div>

      <!-- Non-Taxable/Exempt Income -->
      <div class="section-block q-mb-lg">
        <div class="text-subtitle1 text-weight-medium q-mb-md">Non-Taxable/Exempt Income</div>
        <q-markup-table flat bordered class="income-table">
          <tbody>
            <tr>
              <td class="text-body2">Particulars</td>
              <td class="text-right text-body2 text-weight-medium">Amount (₱)</td>
            </tr>
            <tr>
              <td>De Minimis Benefits</td>
              <td class="text-right">{{ formatCurrency(data.nonTaxableExemptIncome.deMinimisBenefits) }}</td>
            </tr>
            <tr>
              <td>SSS, PhilHealth, Pag-IBIG Contributions</td>
              <td class="text-right">{{ formatCurrency(data.nonTaxableExemptIncome.sssPhilhealthPagibigContributions) }}</td>
            </tr>
            <tr class="total-row">
              <td class="text-weight-bold">Total Non-Taxable/Exempt</td>
              <td class="text-right text-weight-bold">{{ formatCurrency(data.nonTaxableExemptIncome.totalNonTaxableExempt) }}</td>
            </tr>
          </tbody>
        </q-markup-table>
      </div>

      <!-- Taxable Income -->
      <div class="section-block q-mb-lg">
        <div class="text-subtitle1 text-weight-medium q-mb-md">Taxable Income</div>
        <q-markup-table flat bordered class="income-table">
          <tbody>
            <tr>
              <td class="text-body2">Particulars</td>
              <td class="text-right text-body2 text-weight-medium">Amount (₱)</td>
            </tr>
            <tr>
              <td>Gross Compensation Income</td>
              <td class="text-right">{{ formatCurrency(data.taxableIncome.grossCompensationIncome) }}</td>
            </tr>
            <tr>
              <td>Less: Non-Taxable/Exempt</td>
              <td class="text-right text-negative">{{ formatCurrency(Math.abs(data.taxableIncome.lessNonTaxableExempt)) }}</td>
            </tr>
            <tr class="total-row">
              <td class="text-weight-bold">Net Taxable Compensation</td>
              <td class="text-right text-weight-bold text-primary">{{ formatCurrency(data.taxableIncome.netTaxableCompensation) }}</td>
            </tr>
          </tbody>
        </q-markup-table>
      </div>

      <!-- Tax Due Computation -->
      <div class="section-block q-mb-lg">
        <div class="text-subtitle1 text-weight-medium q-mb-md">Tax Due Computation (TRAIN Law Table)</div>
        <div class="tax-computation-info q-pa-md q-mb-md surface-variant rounded-borders">
          <div class="text-body2">
            First ₱250,000: 0%<br>
            Excess over ₱250,000 up to ₱400,000: 15%<br>
            Tax rate: 20% of excess over ₱250,000
          </div>
          <div class="text-body1 text-weight-medium q-mt-sm">
            Tax Due: {{ formatCurrency(data.taxComputation.taxDue) }}
          </div>
        </div>
      </div>

      <!-- Tax Withheld vs. Tax Due -->
      <div class="section-block">
        <div class="text-subtitle1 text-weight-medium q-mb-md">Tax Withheld vs. Tax Due</div>
        <q-markup-table flat bordered class="income-table">
          <tbody>
            <tr>
              <td class="text-body2">Particulars</td>
              <td class="text-right text-body2 text-weight-medium">Amount (₱)</td>
            </tr>
            <tr>
              <td>Total Tax Withheld (Jan-Dec {{ data.yearCovered }})</td>
              <td class="text-right">{{ formatCurrency(data.taxComputation.taxWithheldJanDec) }}</td>
            </tr>
            <tr>
              <td>Tax Due (Annualized)</td>
              <td class="text-right">{{ formatCurrency(data.taxComputation.taxDueAnnualized) }}</td>
            </tr>
            <tr class="total-row">
              <td class="text-weight-bold">
                {{ data.taxComputation.taxPayableRefundable >= 0 ? 'Tax Payable' : 'Tax Refundable' }}
              </td>
              <td class="text-right text-weight-bold"
                  :class="data.taxComputation.taxPayableRefundable >= 0 ? 'text-negative' : 'text-positive'">
                {{ formatCurrency(Math.abs(data.taxComputation.taxPayableRefundable)) }}
              </td>
            </tr>
          </tbody>
        </q-markup-table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import GButton from 'src/components/shared/buttons/GButton.vue';
import { useQuasar } from 'quasar';
import * as XLSX from 'xlsx';
import type { AnnualizationData } from '../AnnualizationReport.vue';

interface Props {
  data: AnnualizationData;
  loading: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits(['export']);
const $q = useQuasar();

const formatCurrency = (value: number | undefined | null) => {
  if (value === undefined || value === null) return '₱ 0.00';
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

const exportToExcel = () => {
  try {
    // Helper function to format numbers with .00
    const formatNumber = (value: number) => {
      return value.toFixed(2);
    };

    const exportData = [
      ['CERTIFICATE OF COMPENSATION PAYMENT/TAX WITHHELD'],
      ['BIR Form No. 2316'],
      [],
      ['Company Information'],
      ['Company Name:', props.data.companyName],
      ['TIN:', props.data.companyTin],
      ['Year Covered:', props.data.yearCovered],
      [],
      ['Employee Information'],
      ['Employee Name:', props.data.employeeName],
      ['Position:', props.data.position],
      ['TIN:', props.data.tin],
      ['Period Covered:', props.data.periodCovered],
      [],
      ['Income Summary'],
      ['Basic Salary', formatNumber(props.data.incomeSummary.basicSalary)],
      ['Overtime Pay', formatNumber(props.data.incomeSummary.overtimePay)],
      ['Holiday Pay', formatNumber(props.data.incomeSummary.holidayPay)],
      ['13th Month Pay', formatNumber(props.data.incomeSummary.thirteenthMonthPay)],
      ['Other Taxable Allowances', formatNumber(props.data.incomeSummary.otherTaxableAllowances)],
      ['Gross Compensation Income', formatNumber(props.data.incomeSummary.grossCompensationIncome)],
      [],
      ['Non-Taxable/Exempt Income'],
      ['De Minimis Benefits', formatNumber(props.data.nonTaxableExemptIncome.deMinimisBenefits)],
      ['SSS, PhilHealth, Pag-IBIG Contributions', formatNumber(props.data.nonTaxableExemptIncome.sssPhilhealthPagibigContributions)],
      ['Total Non-Taxable/Exempt', formatNumber(props.data.nonTaxableExemptIncome.totalNonTaxableExempt)],
      [],
      ['Taxable Income'],
      ['Gross Compensation Income', formatNumber(props.data.taxableIncome.grossCompensationIncome)],
      ['Less: Non-Taxable/Exempt', formatNumber(props.data.taxableIncome.lessNonTaxableExempt)],
      ['Net Taxable Compensation', formatNumber(props.data.taxableIncome.netTaxableCompensation)],
      [],
      ['Tax Computation'],
      ['Tax Due', formatNumber(props.data.taxComputation.taxDue)],
      ['Total Tax Withheld', formatNumber(props.data.taxComputation.taxWithheldJanDec)],
      ['Tax Due (Annualized)', formatNumber(props.data.taxComputation.taxDueAnnualized)],
      ['Tax Payable/Refundable', formatNumber(props.data.taxComputation.taxPayableRefundable)]
    ];

    const ws = XLSX.utils.aoa_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Annualization');

    // Generate filename with current date
    const date = new Date();
    const dateStr = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
    const filename = `annualization-${props.data.employeeName.replace(/\s+/g, '-').toLowerCase()}-${dateStr}.xlsx`;

    XLSX.writeFile(wb, filename);

    $q.notify({
      type: 'positive',
      message: 'Report exported successfully',
      position: 'top'
    });

    emit('export');
  } catch (error) {
    console.error('Export failed:', error);
    $q.notify({
      type: 'negative',
      message: 'Failed to export report',
      position: 'top'
    });
  }
};
</script>

<style scoped lang="scss">
.annualization-table {
  width: 100%;
  background-color: var(--q-surface);
}

.report-header {
  background-color: var(--q-surface);
}

.report-content {
  max-width: 900px;
  margin: 0 auto;
}

.section-block {
  margin-bottom: 24px;
}

.surface-variant {
  background-color: var(--q-surface-variant, #F2F2F7);
}

.rounded-borders {
  border-radius: 8px;
}

.income-table {
  background-color: var(--q-surface);
  border: 1px solid var(--q-outline, #E0E0E5);

  td {
    padding: 12px 16px;
    border: 1px solid var(--q-outline, #E0E0E5);
  }

  .total-row {
    background-color: var(--q-surface-variant, #F2F2F7);

    td {
      border-top: 2px solid var(--q-primary, #6750A4);
    }
  }
}

.tax-computation-info {
  background-color: var(--q-surface-variant, #F2F2F7);
  border: 1px solid var(--q-outline, #E0E0E5);
}

@media print {
  .q-btn {
    display: none !important;
  }

  .report-header {
    border-bottom: 2px solid #000;
  }

  .report-content {
    padding: 20px;
  }
}

@media (max-width: $breakpoint-sm-max) {
  .report-content {
    padding: 16px;
  }

  .income-table {
    font-size: 12px;

    td {
      padding: 8px;
    }
  }
}
</style>