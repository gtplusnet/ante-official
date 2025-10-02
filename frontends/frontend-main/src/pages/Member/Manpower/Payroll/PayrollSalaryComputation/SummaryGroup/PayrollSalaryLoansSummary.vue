<template>
  <div>
    <!-- Deductions -->
    <div>
      <summary-group class="text-left" description="Deductions" :indention="0" />
      <template v-if="deductionsWithAdjustments.length > 0">
        <template v-for="(deduction, index) in deductionsWithAdjustments" :key="`deduction-${index}`">
          <!-- Regular deduction -->
          <summary-group
            v-if="'deductionPlan' in deduction"
            class="text-left"
            :description="`${deduction.deductionPlan.deductionConfiguration.name}`"
            :amount="deduction.amount"
            :indention="1"
          />
          <!-- Adjusted deduction -->
          <summary-group
            v-else
            class="text-left"
            :description="(deduction as any).title + ' (Adjustment)'"
            :amount="-Number(deduction.amount)"
            :indention="1"
          />
        </template>
      </template>
      <template v-else>
        <summary-group class="text-left text-grey text-italic" description="No deductions" :indention="1" />
      </template>
    </div>

    <!-- Loans -->
    <div>
      <summary-group class="text-left" description="Loans" :indention="0" />
      <template v-if="loans.length > 0">
        <template v-for="loan in loans" :key="loan.deductionPlan.id">
          <summary-group
            class="text-left"
            :description="`${loan.deductionPlan.deductionConfiguration.name} (${loan.deductionPlan.planCode})`"
            :amount="-loan.amount"
            :indention="1"
          />
        </template>
      </template>
      <template v-else>
        <summary-group class="text-left text-grey text-italic" description="No loans" :indention="1" :amount="0" />
      </template>
    </div>
  </div>
</template>

<style scoped src="../PayrollSalaryComputation.scss"></style>

<script lang="ts">
import { EmployeeSalaryComputationDeductionsResponse, PayrollProcessingResponse } from "@shared/response";
import SummaryGroup from './SummaryGroup.vue';
import { api } from 'src/boot/axios';
import { onMounted, ref, computed } from 'vue';
import { AxiosResponse } from 'axios';

export default {
  name: 'PayrollSalaryLoansSummary',
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
    interface SalaryAdjustment {
      id: number;
      configurationId: number;
      title: string;
      amount: number;
      adjustmentType: 'ALLOWANCE' | 'DEDUCTION';
      taxBasis?: 'TAXABLE' | 'NON_TAXABLE';
    }

    const loans = ref<EmployeeSalaryComputationDeductionsResponse[]>([]);
    const deductions = ref<EmployeeSalaryComputationDeductionsResponse[]>([]);
    const salaryAdjustments = ref<SalaryAdjustment[]>([]);

    type DeductionItem = EmployeeSalaryComputationDeductionsResponse | SalaryAdjustment;

    const deductionsWithAdjustments = computed<DeductionItem[]>(() => {
      const regular: DeductionItem[] = deductions.value;
      const adjusted: DeductionItem[] = salaryAdjustments.value.filter(
        adj => adj.adjustmentType === 'DEDUCTION'
      );
      return [...regular, ...adjusted];
    });

    const fetchSalaryAdjustments = async () => {
      if (!props.accountId || !props.cutoffDateRangeId) return;
      
      try {
        const response = await api.get(`/hr-processing/employee-salary-adjustments/employee/${props.accountId}/cutoff/${props.cutoffDateRangeId}`);
        if (response.data) {
          salaryAdjustments.value = response.data.deductions || [];
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
      const url = `/hr-processing/get-employee-salary-computation-deductions?employeeTimekeepingCutoffId=${props.timekeepingData.timekeepingCutoffId}`;
      api.get(url).then((response: AxiosResponse<EmployeeSalaryComputationDeductionsResponse[]>) => {
        loans.value =
          response.data.length > 0 ? response.data.filter((deduction) => deduction.deductionPlan.deductionConfiguration.category.key === 'LOAN') : [];
        deductions.value =
          response.data.length > 0
            ? response.data.filter((deduction) => deduction.deductionPlan.deductionConfiguration.category.key === 'DEDUCTION')
            : [];
      });
    };

    return {
      loans,
      deductions,
      deductionsWithAdjustments,
    };
  },
};
</script>
