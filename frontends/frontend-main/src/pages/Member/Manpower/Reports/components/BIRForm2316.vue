<template>
  <div class="bir-form-2316">
    <!-- Form Header -->
    <div class="form-header">
      <div class="row items-center q-mb-md">
        <div class="col text-right">
          <GButton
            icon="print"
            label="Print"
            variant="filled"
            size="sm"
            @click="printForm"
            class="q-mr-sm"
          />
          <GButton
            icon="download"
            label="Export PDF"
            variant="tonal"
            size="sm"
            @click="exportPDF"
          />
        </div>
      </div>

      <div class="form-title-section">
        <div class="row">
          <div class="col-2">
            <div class="text-caption">For BIR Use Only</div>
            <div class="text-caption">RCS:</div>
          </div>
          <div class="col-8 text-center">
            <div class="text-caption">Republic of the Philippines</div>
            <div class="text-caption text-weight-bold">Department of Finance</div>
            <div class="text-body2 text-weight-bold">Bureau of Internal Revenue</div>
            <div class="text-h6 text-weight-bold q-mt-sm">Certificate of Compensation</div>
            <div class="text-h6 text-weight-bold">Payment/Tax Withheld</div>
          </div>
          <div class="col-2 text-right">
            <div class="barcode">|||||||||||||||</div>
          </div>
        </div>
      </div>

      <div class="form-number text-center q-mb-md">
        <div class="text-body1 text-weight-bold">BIR Form No.</div>
        <div class="text-h4 text-weight-bold">2316</div>
        <div class="text-caption">(January 2018 (ENCS))</div>
        <div class="text-caption q-mt-xs">For the Period {{ data.yearCovered }}</div>
      </div>
    </div>

    <!-- Form Content -->
    <div class="form-content">
      <!-- Part I: Employee Information -->
      <div class="form-section">
        <div class="section-header">Part I - Employee Information (Present)</div>

        <div class="form-row">
          <div class="form-field col-4">
            <label>1. For the Year (YYYY):</label>
            <div class="field-value">{{ data.yearCovered }}</div>
          </div>
          <div class="form-field col-8">
            <label>2. For the Period:</label>
            <div class="field-value">
              From: January {{ data.yearCovered }} To: December {{ data.yearCovered }}
              <q-checkbox v-model="isSubstitutedFiling" label="To be filed by Substituted Filing Agent" class="q-ml-md" disable />
            </div>
          </div>
        </div>

        <div class="form-row">
          <div class="form-field col-6">
            <label>3. TIN:</label>
            <div class="field-value bordered">{{ formatTIN(data.tin) }}</div>
          </div>
          <div class="form-field col-6">
            <label>4. Employee's Name:</label>
            <div class="field-value">{{ data.employeeName }}</div>
          </div>
        </div>

        <div class="form-row">
          <div class="form-field col-12">
            <label>5. Registered Address:</label>
            <div class="field-value">{{ employeeAddress || 'N/A' }}</div>
          </div>
        </div>

        <div class="form-row">
          <div class="form-field col-6">
            <label>6. Local Home Address:</label>
            <div class="field-value">{{ localAddress || 'Same as above' }}</div>
          </div>
          <div class="form-field col-6">
            <label>7. Foreign Address:</label>
            <div class="field-value">{{ foreignAddress || 'N/A' }}</div>
          </div>
        </div>

        <div class="form-row">
          <div class="form-field col-3">
            <label>8. Date of Birth (MM/DD/YYYY):</label>
            <div class="field-value">{{ dateOfBirth || 'N/A' }}</div>
          </div>
          <div class="form-field col-3">
            <label>9. Contact Number:</label>
            <div class="field-value">{{ contactNumber || 'N/A' }}</div>
          </div>
          <div class="form-field col-6">
            <label>10. Civil Status:</label>
            <div class="field-boxes">
              <q-checkbox v-model="civilStatus.single" label="Single" disable />
              <q-checkbox v-model="civilStatus.married" label="Married" disable />
              <q-checkbox v-model="civilStatus.widowed" label="Widow/er" disable />
              <q-checkbox v-model="civilStatus.separated" label="Legally Separated" disable />
            </div>
          </div>
        </div>

        <div class="form-row">
          <div class="form-field col-3">
            <label>11. Statutory Minimum Wage rate per day:</label>
            <div class="field-value">{{ minimumWage || '537.00' }}</div>
          </div>
          <div class="form-field col-3">
            <label>12. Statutory Minimum Wage rate per month:</label>
            <div class="field-value">{{ monthlyMinimumWage || '13,935.00' }}</div>
          </div>
          <div class="form-field col-6">
            <label>13. Minimum Wage Earner (MWE):</label>
            <div class="field-boxes">
              <q-checkbox v-model="isMWE" label="Yes" disable />
              <q-checkbox :model-value="!isMWE" label="No" disable />
            </div>
          </div>
        </div>
      </div>

      <!-- Part II: Employer Information -->
      <div class="form-section">
        <div class="section-header">Part II - Employer Information (Present)</div>

        <div class="form-row">
          <div class="form-field col-6">
            <label>14. Employer's Name:</label>
            <div class="field-value">{{ data.companyName }}</div>
          </div>
          <div class="form-field col-6">
            <label>15. Registered Address:</label>
            <div class="field-value">{{ companyAddress || 'N/A' }}</div>
          </div>
        </div>

        <div class="form-row">
          <div class="form-field col-4">
            <label>16. TIN:</label>
            <div class="field-value bordered">{{ formatTIN(data.companyTin) }}</div>
          </div>
          <div class="form-field col-4">
            <label>17. ZIP Code:</label>
            <div class="field-value">{{ zipCode || 'N/A' }}</div>
          </div>
          <div class="form-field col-4">
            <label>18. Type of Employer:</label>
            <div class="field-boxes">
              <q-checkbox v-model="employerType.main" label="Main Employer" disable />
              <q-checkbox v-model="employerType.secondary" label="Secondary Employer" disable />
            </div>
          </div>
        </div>
      </div>

      <!-- Part IIA: Summary -->
      <div class="form-section">
        <div class="section-header">Part IIA - Summary</div>

        <table class="summary-table">
          <tbody>
            <tr>
              <td class="label-col">19. Gross Compensation Income from Present Employer</td>
              <td class="value-col">{{ formatCurrency(data.incomeSummary.grossCompensationIncome) }}</td>
            </tr>
            <tr>
              <td class="label-col">20. Less: Total Non-Taxable/Exempt Compensation Income</td>
              <td class="value-col">({{ formatCurrency(data.nonTaxableExemptIncome.totalNonTaxableExempt) }})</td>
            </tr>
            <tr>
              <td class="label-col">21. Taxable Compensation Income from Present Employer</td>
              <td class="value-col">{{ formatCurrency(data.taxableIncome.netTaxableCompensation) }}</td>
            </tr>
            <tr>
              <td class="label-col">22. Add: Taxable Compensation Income from Previous Employer</td>
              <td class="value-col">{{ formatCurrency(0) }}</td>
            </tr>
            <tr>
              <td class="label-col">23. Gross Taxable Compensation Income</td>
              <td class="value-col text-weight-bold">{{ formatCurrency(data.taxableIncome.netTaxableCompensation) }}</td>
            </tr>
            <tr>
              <td class="label-col">24. Tax Due</td>
              <td class="value-col">{{ formatCurrency(data.taxComputation.taxDue) }}</td>
            </tr>
            <tr>
              <td class="label-col">25. Less: Tax Withheld - Present Employer</td>
              <td class="value-col">({{ formatCurrency(data.taxComputation.taxWithheldJanDec) }})</td>
            </tr>
            <tr>
              <td class="label-col">26. Add: Tax Withheld - Previous Employer</td>
              <td class="value-col">{{ formatCurrency(0) }}</td>
            </tr>
            <tr>
              <td class="label-col">27. Total Amount of Taxes Withheld as Adjusted</td>
              <td class="value-col">{{ formatCurrency(data.taxComputation.taxWithheldJanDec) }}</td>
            </tr>
            <tr>
              <td class="label-col">28. Tax Due/(Refundable)</td>
              <td class="value-col text-weight-bold">
                {{ data.taxComputation.taxPayableRefundable >= 0 ? '' : '(' }}{{ formatCurrency(Math.abs(data.taxComputation.taxPayableRefundable)) }}{{ data.taxComputation.taxPayableRefundable >= 0 ? '' : ')' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Part IV: Detailed Compensation -->
      <div class="form-section">
        <div class="section-header">Part IV - Details of Compensation Income and Tax Withheld</div>

        <div class="compensation-details">
          <div class="detail-header">TAXABLE COMPENSATION INCOME REGULAR</div>

          <table class="detail-table">
            <tbody>
              <tr>
                <td class="item-no">30</td>
                <td class="item-label">Basic Salary (including the exempt P250,000 & below or the statutory Minimum Wage of the MWE)</td>
                <td class="item-value">{{ formatCurrency(data.incomeSummary.basicSalary) }}</td>
              </tr>
              <tr>
                <td class="item-no">31</td>
                <td class="item-label">Holiday Pay (MWE)</td>
                <td class="item-value">{{ formatCurrency(data.incomeSummary.holidayPay) }}</td>
              </tr>
              <tr>
                <td class="item-no">32</td>
                <td class="item-label">Overtime Pay (MWE)</td>
                <td class="item-value">{{ formatCurrency(data.incomeSummary.overtimePay) }}</td>
              </tr>
              <tr>
                <td class="item-no">33</td>
                <td class="item-label">Night Shift Differential (MWE)</td>
                <td class="item-value">{{ formatCurrency(0) }}</td>
              </tr>
              <tr>
                <td class="item-no">34</td>
                <td class="item-label">Hazard Pay (MWE)</td>
                <td class="item-value">{{ formatCurrency(0) }}</td>
              </tr>
              <tr>
                <td class="item-no">35</td>
                <td class="item-label">13th Month Pay and Other Benefits (maximum of P90,000)</td>
                <td class="item-value">{{ formatCurrency(Math.min(data.incomeSummary.thirteenthMonthPay, 90000)) }}</td>
              </tr>
              <tr>
                <td class="item-no">36</td>
                <td class="item-label">De Minimis Benefits</td>
                <td class="item-value">{{ formatCurrency(data.nonTaxableExemptIncome.deMinimisBenefits) }}</td>
              </tr>
              <tr>
                <td class="item-no">37</td>
                <td class="item-label">SSS, GSIS, PHIC & PAG-IBIG Contributions and Union Dues (Employee share only)</td>
                <td class="item-value">{{ formatCurrency(data.nonTaxableExemptIncome.sssPhilhealthPagibigContributions) }}</td>
              </tr>
              <tr>
                <td class="item-no">38</td>
                <td class="item-label">Salaries and Other Forms of Compensation</td>
                <td class="item-value">{{ formatCurrency(data.incomeSummary.otherTaxableAllowances) }}</td>
              </tr>
            </tbody>
          </table>

          <div class="detail-header q-mt-md">SUPPLEMENTARY</div>

          <table class="detail-table">
            <tbody>
              <tr>
                <td class="item-no">45</td>
                <td class="item-label">Commission</td>
                <td class="item-value">{{ formatCurrency(0) }}</td>
              </tr>
              <tr>
                <td class="item-no">46</td>
                <td class="item-label">Profit Sharing</td>
                <td class="item-value">{{ formatCurrency(0) }}</td>
              </tr>
              <tr>
                <td class="item-no">47</td>
                <td class="item-label">Fees Including Director's Fees</td>
                <td class="item-value">{{ formatCurrency(0) }}</td>
              </tr>
              <tr>
                <td class="item-no">48</td>
                <td class="item-label">Taxable 13th Month Benefits</td>
                <td class="item-value">{{ formatCurrency(Math.max(0, data.incomeSummary.thirteenthMonthPay - 90000)) }}</td>
              </tr>
              <tr>
                <td class="item-no">49</td>
                <td class="item-label">Hazard Pay</td>
                <td class="item-value">{{ formatCurrency(0) }}</td>
              </tr>
              <tr>
                <td class="item-no">50</td>
                <td class="item-label">Overtime Pay</td>
                <td class="item-value">{{ formatCurrency(0) }}</td>
              </tr>
              <tr>
                <td class="item-no">51</td>
                <td class="item-label">Others (specify)</td>
                <td class="item-value">{{ formatCurrency(0) }}</td>
              </tr>
              <tr class="total-row">
                <td class="item-no"></td>
                <td class="item-label text-weight-bold">52. Total Taxable Compensation Income</td>
                <td class="item-value text-weight-bold">{{ formatCurrency(data.taxableIncome.netTaxableCompensation) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Signature Section -->
      <div class="form-section signature-section">
        <div class="row q-col-gutter-md">
          <div class="col-6">
            <div class="text-caption text-weight-bold">53. Present Employer/Authorized Agent Signature over Printed Name</div>
            <div class="signature-line q-mt-md"></div>
            <div class="text-center q-mt-xs">{{ authorizedSignatory || 'Authorized Representative' }}</div>
          </div>
          <div class="col-3">
            <div class="text-caption">Date Signed</div>
            <div class="date-boxes q-mt-sm">
              <input type="text" class="date-box" maxlength="2" placeholder="MM" />
              <span>/</span>
              <input type="text" class="date-box" maxlength="2" placeholder="DD" />
              <span>/</span>
              <input type="text" class="date-box" maxlength="4" placeholder="YYYY" />
            </div>
          </div>
          <div class="col-3">
            <div class="text-caption">Amount of CTC</div>
            <div class="field-value q-mt-sm">{{ ctcAmount || '' }}</div>
          </div>
        </div>

        <div class="row q-col-gutter-md q-mt-lg">
          <div class="col-6">
            <div class="text-caption text-weight-bold">Employee Signature over Printed Name</div>
            <div class="signature-line q-mt-md"></div>
            <div class="text-center q-mt-xs">{{ data.employeeName }}</div>
          </div>
          <div class="col-3">
            <div class="text-caption">Date Signed</div>
            <div class="date-boxes q-mt-sm">
              <input type="text" class="date-box" maxlength="2" placeholder="MM" />
              <span>/</span>
              <input type="text" class="date-box" maxlength="2" placeholder="DD" />
              <span>/</span>
              <input type="text" class="date-box" maxlength="4" placeholder="YYYY" />
            </div>
          </div>
          <div class="col-3">
            <div class="text-caption">Date Issued</div>
            <div class="field-value q-mt-sm">{{ new Date().toLocaleDateString() }}</div>
          </div>
        </div>
      </div>

      <!-- Footer Note -->
      <div class="form-footer q-mt-lg">
        <div class="text-caption">
          Note: This certificate is to be accomplished by the employer. The original copy is to be filed with the BIR and the duplicate
          copy is to be furnished to the employee on or before January 31 of the following year or before the last day of employment.
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useQuasar } from 'quasar';
import GButton from 'src/components/shared/buttons/GButton.vue';
import type { AnnualizationData } from '../AnnualizationReport.vue';

interface Props {
  data: AnnualizationData;
}

const { data } = defineProps<Props>();
const $q = useQuasar();

// Additional data for BIR form
const isSubstitutedFiling = ref(false);
const employeeAddress = ref('123 Main Street, Quezon City, Metro Manila');
const localAddress = ref('');
const foreignAddress = ref('');
const dateOfBirth = ref('01/01/1990');
const contactNumber = ref('09123456789');
const civilStatus = ref({
  single: true,
  married: false,
  widowed: false,
  separated: false
});
const minimumWage = ref('537.00');
const monthlyMinimumWage = ref('13,935.00');
const isMWE = ref(false);
const companyAddress = ref('456 Business Avenue, Makati City, Metro Manila');
const zipCode = ref('1200');
const employerType = ref({
  main: true,
  secondary: false
});
const authorizedSignatory = ref('HR Manager');
const ctcAmount = ref('');

const formatTIN = (tin: string) => {
  // Format TIN with dashes if not already formatted
  if (tin && tin.length === 12) {
    return `${tin.substr(0, 3)}-${tin.substr(3, 3)}-${tin.substr(6, 3)}-${tin.substr(9, 3)}`;
  }
  return tin;
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

const printForm = () => {
  window.print();
};

const exportPDF = () => {
  // PDF export would require a library like jsPDF
  $q.notify({
    type: 'info',
    message: 'PDF export functionality would be implemented with jsPDF library',
    position: 'top'
  });
};
</script>

<style scoped lang="scss">
.bir-form-2316 {
  background: white;
  padding: 20px;
  max-width: 1000px;
  margin: 0 auto;
  font-family: Arial, sans-serif;
  font-size: 11px;
}

.form-header {
  margin-bottom: 20px;
}

.form-title-section {
  border: 2px solid black;
  padding: 10px;
  margin-bottom: 10px;
}

.barcode {
  font-family: monospace;
  font-size: 16px;
}

.form-number {
  border: 2px solid black;
  padding: 10px;
  background-color: #f0f0f0;
}

.form-section {
  border: 1px solid black;
  margin-bottom: 10px;

  .section-header {
    background-color: #e0e0e0;
    padding: 5px 10px;
    font-weight: bold;
    border-bottom: 1px solid black;
  }
}

.form-row {
  display: flex;
  border-bottom: 1px solid #ccc;

  &:last-child {
    border-bottom: none;
  }
}

.form-field {
  padding: 8px;
  border-right: 1px solid #ccc;

  &:last-child {
    border-right: none;
  }

  label {
    font-size: 10px;
    display: block;
    margin-bottom: 3px;
  }

  .field-value {
    font-weight: 500;
    min-height: 20px;

    &.bordered {
      border: 1px solid black;
      padding: 2px 4px;
      letter-spacing: 2px;
    }
  }

  .field-boxes {
    display: flex;
    gap: 15px;

    .q-checkbox {
      font-size: 10px;
    }
  }
}

.summary-table {
  width: 100%;
  border-collapse: collapse;

  td {
    border: 1px solid #ccc;
    padding: 6px 8px;

    &.label-col {
      width: 70%;
      font-size: 10px;
    }

    &.value-col {
      width: 30%;
      text-align: right;
      font-weight: 500;
    }
  }
}

.compensation-details {
  padding: 10px;

  .detail-header {
    font-weight: bold;
    background-color: #f0f0f0;
    padding: 5px;
    margin-bottom: 5px;
  }
}

.detail-table {
  width: 100%;
  border-collapse: collapse;

  td {
    border: 1px solid #ccc;
    padding: 4px 6px;

    &.item-no {
      width: 5%;
      text-align: center;
      font-weight: bold;
    }

    &.item-label {
      width: 75%;
      font-size: 10px;
    }

    &.item-value {
      width: 20%;
      text-align: right;
      font-weight: 500;
    }
  }

  .total-row {
    background-color: #f0f0f0;
  }
}

.signature-section {
  padding: 20px;

  .signature-line {
    border-bottom: 1px solid black;
    height: 30px;
  }

  .date-boxes {
    display: flex;
    gap: 5px;
    align-items: center;

    .date-box {
      width: 30px;
      height: 25px;
      border: 1px solid black;
      text-align: center;
      font-size: 10px;
    }
  }
}

.form-footer {
  border: 1px solid #ccc;
  padding: 10px;
  background-color: #f9f9f9;
}

// Print styles
@media print {
  .bir-form-2316 {
    padding: 0;
    font-size: 10px;
  }

  .q-btn {
    display: none !important;
  }

  .form-section {
    page-break-inside: avoid;
  }

  @page {
    size: legal;
    margin: 0.5in;
  }
}
</style>