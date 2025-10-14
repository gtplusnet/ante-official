<template>
  <expanded-nav-page-container>
    <div class="report-container">
      <!-- MD3 Surface with elevation -->
      <div>
        <div class="row items-center">
          <div class="col">
            <div class="text-title-large">Annualization Report</div>
            <q-breadcrumbs class="text-body-small">
              <q-breadcrumbs-el label="Manpower" :to="{ name: 'member_manpower' }" />
              <q-breadcrumbs-el label="Reports" />
              <q-breadcrumbs-el label="Annualization" />
            </q-breadcrumbs>
          </div>
        </div>
      </div>

      <!-- Filters Section with MD3 Card -->
      <div class="surface-container rounded-borders q-py-md q-mb-lg">
        <div class="q-px-md">
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-3">
              <q-select
                v-model="filters.employee"
                label="Employee"
                outlined
                dense
                :options="employeeOptions"
                clearable
                option-label="label"
                option-value="value"
                use-input
                @filter="filterEmployees"
              />
            </div>
            <div class="col-12 col-md-3">
              <q-input
                v-model="filters.year"
                label="Year Covered"
                outlined
                dense
                type="number"
                :min="2020"
                :max="new Date().getFullYear()"
              />
            </div>
            <div class="col-12 col-md-3">
              <q-select
                v-model="filters.type"
                label="Report Type"
                outlined
                dense
                :options="reportTypeOptions"
                option-label="label"
                option-value="value"
              />
            </div>
            <div class="col-12 col-md-3">
              <div class="row q-gutter-sm">
                <GButton
                  label="Generate"
                  variant="filled"
                  @click="fetchData"
                  :loading="loading"
                />
                <GButton
                  label="Clear"
                  variant="outlined"
                  @click="clearFilters"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Data Display with MD3 Surface -->
      <div class="surface-container rounded-borders" v-if="annualizationData">
        <!-- Show BIR Form 2316 PDF layout when selected -->
        <BIRForm2316PDF
          v-if="filters.type.value === 'bir2316'"
          :data="annualizationData"
        />
        <!-- Show detailed table layout for other report types -->
        <AnnualizationTable
          v-else
          :data="annualizationData"
          :loading="loading"
          @export="handleExport"
        />
      </div>

      <!-- No Data State -->
      <div class="surface-container rounded-borders q-pa-xl text-center" v-else-if="!loading">
        <q-icon name="o_assessment" size="64px" color="on-surface-variant" />
        <div class="text-h6 q-mt-md text-on-surface-variant">No Report Generated</div>
        <div class="text-body2 text-on-surface-variant">Select an employee and year to generate the annualization report</div>
      </div>
    </div>
  </expanded-nav-page-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import ExpandedNavPageContainer from '../../../../components/shared/ExpandedNavPageContainer.vue';
import AnnualizationTable from './components/AnnualizationTable.vue';
import BIRForm2316PDF from './components/BIRForm2316PDF.vue';
import GButton from 'src/components/shared/buttons/GButton.vue';

export interface AnnualizationData {
  companyName: string;
  companyTin: string;
  yearCovered: number;
  employeeName: string;
  position: string;
  tin: string;
  periodCovered: string;
  incomeSummary: {
    basicSalary: number;
    overtimePay: number;
    holidayPay: number;
    thirteenthMonthPay: number;
    otherTaxableAllowances: number;
    grossCompensationIncome: number;
  };
  nonTaxableExemptIncome: {
    deMinimisBenefits: number;
    sssPhilhealthPagibigContributions: number;
    totalNonTaxableExempt: number;
  };
  taxableIncome: {
    grossCompensationIncome: number;
    lessNonTaxableExempt: number;
    netTaxableCompensation: number;
  };
  taxComputation: {
    taxDue: number;
    taxWithheldJanDec: number;
    taxDueAnnualized: number;
    taxPayableRefundable: number;
  };
}

const $q = useQuasar();

const annualizationData = ref<AnnualizationData | null>(null);
const loading = ref(false);
const filters = ref({
  employee: null as { label: string; value: string } | null,
  year: new Date().getFullYear(),
  type: { label: 'BIR Form 2316', value: 'bir2316' }
});

const employeeOptions = ref([
  { label: 'Juan Dela Cruz - 987-654-321-000', value: 'emp001' },
  { label: 'Maria Santos - 123-456-789-000', value: 'emp002' },
  { label: 'Pedro Reyes - 456-789-123-000', value: 'emp003' },
  { label: 'Ana Mendoza - 789-123-456-000', value: 'emp004' },
  { label: 'Jose Ramirez - 321-654-987-000', value: 'emp005' }
]);

const filteredEmployeeOptions = ref(employeeOptions.value);

const reportTypeOptions = ref([
  { label: 'BIR Form 2316', value: 'bir2316' },
  { label: 'Detailed Report', value: 'detailed' }
]);

const filterEmployees = (val: string, update: (fn: () => void) => void) => {
  update(() => {
    const needle = val.toLowerCase();
    filteredEmployeeOptions.value = employeeOptions.value.filter(
      v => v.label.toLowerCase().indexOf(needle) > -1
    );
  });
};

const fetchData = async () => {
  // Auto-select first employee if none selected
  if (!filters.value.employee) {
    filters.value.employee = employeeOptions.value[0];
  }

  loading.value = true;
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Static data based on the screenshot
    annualizationData.value = {
      companyName: 'ABC Corporation',
      companyTin: '123-456-789-000',
      yearCovered: filters.value.year,
      employeeName: 'Juan Dela Cruz',
      address: '123 Main St, City, Country',
      zipCode: '1234',
      position: 'Staff',
      tin: '987-654-321-000',
      periodCovered: `January ${filters.value.year} - December ${filters.value.year}`,
      incomeSummary: {
        basicSalary: 360000,
        overtimePay: 15000,
        holidayPay: 10000,
        thirteenthMonthPay: 30000,
        otherTaxableAllowances: 20000,
        grossCompensationIncome: 435000
      },
      nonTaxableExemptIncome: {
        deMinimisBenefits: 12000,
        sssPhilhealthPagibigContributions: 21600,
        totalNonTaxableExempt: 33600
      },
      taxableIncome: {
        grossCompensationIncome: 435000,
        lessNonTaxableExempt: -33600,
        netTaxableCompensation: 401400
      },
      taxComputation: {
        taxDue: 30280,
        taxWithheldJanDec: 29500,
        taxDueAnnualized: 30280,
        taxPayableRefundable: 780
      }
    };

    $q.notify({
      type: 'positive',
      message: 'Annualization report generated successfully',
      position: 'top'
    });
  } catch (error) {
    console.error('Error generating annualization report:', error);
    $q.notify({
      type: 'negative',
      message: 'Failed to generate annualization report',
      position: 'top'
    });
  } finally {
    loading.value = false;
  }
};

const clearFilters = () => {
  filters.value.employee = null;
  filters.value.year = new Date().getFullYear();
  filters.value.type = { label: 'BIR Form 2316', value: 'bir2316' };
  annualizationData.value = null;
};

const handleExport = () => {
  // Export functionality will be handled by the table component
  console.log('Export triggered');
};

onMounted(() => {
  // Auto-generate report with default employee on mount
  fetchData();
});
</script>

<style scoped lang="scss">
.report-container {
  width: 100%;
}

.surface-container {
  background-color: var(--q-surface);
  border: 1px solid var(--q-border);
  transition: box-shadow 0.2s ease-in-out;
}

.rounded-borders {
  border-radius: 12px;
}

.text-on-surface-variant {
  color: var(--q-on-surface-variant, #49454E);
}

@media (max-width: $breakpoint-sm-max) {
  .report-container {
    padding: 0;
  }

  .surface-container {
    border-radius: 0;
    margin-left: -16px;
    margin-right: -16px;
    width: calc(100% + 32px);
  }
}
</style>