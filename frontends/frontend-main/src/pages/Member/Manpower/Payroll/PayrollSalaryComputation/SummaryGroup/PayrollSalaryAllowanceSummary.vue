<template>
  <div>
    <!-- Debug Info -->
    <div v-if="false" style="background: #f0f0f0; padding: 10px; margin: 10px 0;">
      <h4>DEBUG - PayrollSalaryAllowanceSummary</h4>
      <p>Regular allowances: {{ allowances.length }}</p>
      <p>Salary adjustments: {{ salaryAdjustments.length }}</p>
      <p>Taxable with adjustments: {{ taxableAllowancesWithAdjustments.length }}</p>
      <p>Non-taxable with adjustments: {{ nonTaxableAllowancesWithAdjustments.length }}</p>
      <pre>{{ JSON.stringify(salaryAdjustments, null, 2) }}</pre>
    </div>
    
    <!-- Taxable Allowances -->
    <summary-group
      class="text-left"
      description="Taxable Allowance"
      :indention="0"
    />
    <template v-if="taxableAllowancesWithAdjustments.length > 0">
      <template v-for="(allowance, index) in taxableAllowancesWithAdjustments" :key="`taxable-${index}`">
        <!-- Regular allowance -->
        <summary-group
          v-if="'allowancePlan' in allowance"
          class="text-left"
          :description="`${allowance.allowancePlan.allowanceConfiguration.name} - AL${allowance.allowancePlan.id}`"
          :amount="Number(allowance.amount)"
          :indention="1"
        />
        <!-- Adjusted allowance -->
        <summary-group
          v-else
          class="text-left"
          :description="(allowance as any).title + ' (Adjustment)'"
          :amount="Number(allowance.amount)"
          :indention="1"
        />
      </template>
    </template>
    <template v-else>
      <summary-group class="text-left text-grey text-italic" description="No taxable allowances" :indention="1" />
    </template>

    <!-- De Minimis Allowances -->
    <summary-group
      class="text-left"
      description="De Minimis Allowance"
      :indention="0"
    />
    <template v-if="deMinimisAllowancesWithAdjustments.length > 0">
      <template v-for="(allowance, index) in deMinimisAllowancesWithAdjustments" :key="`deminimis-${index}`">
        <!-- Regular allowance -->
        <summary-group
          v-if="'allowancePlan' in allowance"
          class="text-left"
          :description="`${allowance.allowancePlan.allowanceConfiguration.name} - AL${allowance.allowancePlan.id}`"
          :amount="allowance.amount"
          :indention="1"
        />
        <!-- Adjusted allowance -->
        <summary-group
          v-else
          class="text-left"
          :description="(allowance as any).title"
          :amount="Number(allowance.amount)"
          :indention="1"
        />
      </template>
    </template>
    <template v-else>
      <summary-group class="text-left text-grey text-italic" description="No de minimis allowances" :indention="1" />
    </template>

    <!-- Non-Taxable Allowances -->
    <summary-group
      class="text-left"
      description="Non-Taxable Allowance"
      :indention="0"
    />
    <template v-if="nonTaxableAllowancesWithAdjustments.length > 0">
      <template v-for="(allowance, index) in nonTaxableAllowancesWithAdjustments" :key="`non-taxable-${index}`">
        <!-- Regular allowance -->
        <summary-group
          v-if="'allowancePlan' in allowance"
          class="text-left"
          :description="`${allowance.allowancePlan.allowanceConfiguration.name} - AL${allowance.allowancePlan.id}`"
          :amount="allowance.amount"
          :indention="1"
        />
        <!-- Adjusted allowance -->
        <summary-group
          v-else
          class="text-left text-primary"
          :description="(allowance as any).title"
          :amount="allowance.amount"
          :indention="1"
        />
      </template>
    </template>
    <template v-else>
      <summary-group class="text-left text-grey text-italic" description="No non-taxable allowances" :indention="1" />
    </template>
  </div>
</template>

<style scoped src="../PayrollSalaryComputation.scss"></style>

<script lang="ts">
import { PayrollProcessingResponse } from "@shared/response";
import SummaryGroup from './SummaryGroup.vue';
import { api } from 'src/boot/axios';
import { onMounted, ref, computed } from 'vue';
import { AxiosResponse } from 'axios';

export default {
  name: 'PayrollAllowanceSummary',
  components: {
    SummaryGroup,
  },
  props: {
    timekeepingData: {
      type: Object as () => PayrollProcessingResponse,
      default: null,
    },
    accountId: {
      type: String,
      required: true,
    },
    cutoffDateRangeId: {
      type: String,
      required: true,
    },
  },

  setup(props) {
    interface AllowanceResponse {
      allowancePlan: {
        id: number;
        name: string;
        allowanceConfiguration: {
          name: string;
          taxBasis: string;
          category: string;
        };
      };
      amount: number;
    }

    interface SalaryAdjustment {
      id: number;
      configurationId: number;
      title: string;
      amount: number;
      adjustmentType: 'ALLOWANCE' | 'DEDUCTION';
      taxBasis?: 'TAXABLE' | 'NON_TAXABLE';
      category?: 'DEMINIMIS' | 'TAXABLE' | 'NON_TAXABLE';
    }

    const allowances = ref<AllowanceResponse[]>([]);
    const salaryAdjustments = ref<SalaryAdjustment[]>([]);

    const taxableAllowances = computed(() => {
      return allowances.value.filter(
        allowance => allowance.allowancePlan.allowanceConfiguration.category === 'TAXABLE'
      );
    });

    const nonTaxableAllowances = computed(() => {
      return allowances.value.filter(
        allowance => allowance.allowancePlan.allowanceConfiguration.category === 'NON_TAXABLE'
      );
    });

    const deMinimisAllowances = computed(() => {
      return allowances.value.filter(
        allowance => allowance.allowancePlan.allowanceConfiguration.category === 'DEMINIMIS'
      );
    });

    type AllowanceItem = AllowanceResponse | SalaryAdjustment;

    const taxableAllowancesWithAdjustments = computed<AllowanceItem[]>(() => {
      const regular: AllowanceItem[] = taxableAllowances.value;
      const adjusted: AllowanceItem[] = salaryAdjustments.value.filter(
        adj => adj.adjustmentType === 'ALLOWANCE' && adj.category === 'TAXABLE'
      );
      return [...regular, ...adjusted];
    });

    const nonTaxableAllowancesWithAdjustments = computed<AllowanceItem[]>(() => {
      const regular: AllowanceItem[] = nonTaxableAllowances.value;
      const adjusted: AllowanceItem[] = salaryAdjustments.value.filter(
        adj => adj.adjustmentType === 'ALLOWANCE' && adj.category === 'NON_TAXABLE'
      );
      return [...regular, ...adjusted];
    });

    const deMinimisAllowancesWithAdjustments = computed<AllowanceItem[]>(() => {
      const regular: AllowanceItem[] = deMinimisAllowances.value;
      const adjusted: AllowanceItem[] = salaryAdjustments.value.filter(
        adj => adj.adjustmentType === 'ALLOWANCE' && adj.category === 'DEMINIMIS'
      );
      return [...regular, ...adjusted];
    });

    const fetchSalaryAdjustments = async () => {
      if (!props.accountId || !props.cutoffDateRangeId) return;
      
      try {
        const response = await api.get(`/hr-processing/employee-salary-adjustments/employee/${props.accountId}/cutoff/${props.cutoffDateRangeId}`);
        if (response.data) {
          salaryAdjustments.value = response.data.allowances || [];
        }
      } catch (error) {
        console.error('Error fetching salary adjustments:', error);
      }
    };

    onMounted(async () => {
      await fetchData();
      await fetchSalaryAdjustments();
    });

    const fetchData = () => {
      const url = `/hr-processing/get-employee-salary-computation-allowances?employeeTimekeepingCutoffId=${props.timekeepingData.timekeepingCutoffId}`;
      api.get(url).then((response: AxiosResponse<AllowanceResponse[]>) => {
        allowances.value = response.data || [];
      });
    };

    return {
      allowances,
      salaryAdjustments,
      taxableAllowances,
      nonTaxableAllowances,
      deMinimisAllowances,
      taxableAllowancesWithAdjustments,
      nonTaxableAllowancesWithAdjustments,
      deMinimisAllowancesWithAdjustments,
    };
  },
};
</script>
