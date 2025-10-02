<template>
  <div>
    <summary-group class="text-left" description="Taxable Allowances" :indention="0" />
    <template v-if="taxableAllowances.length > 0">
      <template v-for="(allowance, index) in taxableAllowances" :key="`taxable-${index}`">
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
          :description="(allowance as any).title + ' (Adjustment)'"
          :amount="Number(allowance.amount)"
          :indention="1"
        />
      </template>
    </template>
    <template v-else>
      <summary-group class="text-left text-grey text-italic" description="No taxable allowances" :indention="1" />
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
  name: 'PayrollSalaryTaxableAllowanceSummary',
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

    type AllowanceItem = AllowanceResponse | SalaryAdjustment;

    const taxableAllowances = computed<AllowanceItem[]>(() => {
      const regular: AllowanceItem[] = allowances.value;
      const adjusted: AllowanceItem[] = salaryAdjustments.value.filter(
        adj => adj.adjustmentType === 'ALLOWANCE' && adj.category === 'TAXABLE'
      );
      return [...regular, ...adjusted];
    });

    const fetchData = () => {
      const url = `/hr-processing/get-employee-salary-computation-allowances?employeeTimekeepingCutoffId=${props.timekeepingData.timekeepingCutoffId}`;
      api.get(url).then((response: AxiosResponse<AllowanceResponse[]>) => {
        const allAllowances = response.data || [];
        // Filter only taxable allowances
        allowances.value = allAllowances.filter(
          allowance => allowance.allowancePlan.allowanceConfiguration.category === 'TAXABLE'
        );
      });
    };

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

    return {
      taxableAllowances,
    };
  },
};
</script>
