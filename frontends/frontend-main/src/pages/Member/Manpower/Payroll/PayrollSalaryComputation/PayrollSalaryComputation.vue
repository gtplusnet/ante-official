<template>
  <div class="tab-container">
    <div v-if="!isLoading">
      <template v-if="timekeepingData?.summary.salaryRateType.key != 'FIXED_RATE'">
        <div class="text-center q-mb-sm text-weight-medium q-mt-md title">Day Breakdown</div>

        <div class="table-container q-pb-sm">
          <payroll-salary-day-breakdown v-if="timekeepingData" :timekeepingData="timekeepingData" />
        </div>
      </template>

      <div class="text-center q-mb-sm text-weight-medium q-mt-md q-mb-md title">Computation Summary</div>
      <div class="summary-container q-pb-lg">
        <!-- Computation Summary -->
        <div class="table-container">
          <payroll-salary-computation-basis v-if="timekeepingData" :timekeepingData="timekeepingData" :accountId="accountId" :cutoffDateRangeId="cutoffDateRangeId" />
        </div>
        <div class="table-container">
          <payroll-salary-computation-tax class="q-mb-md" v-if="timekeepingData" :timekeepingData="timekeepingData" :accountId="accountId" :cutoffDateRangeId="cutoffDateRangeId" />
          <payroll-salary-computation-breakdown-monthly v-if="timekeepingData && timekeepingData.summary.salaryRateType.key == 'MONTHLY_RATE'" :timekeepingData="timekeepingData" :accountId="accountId" :cutoffDateRangeId="cutoffDateRangeId" />
          <payroll-salary-computation-breakdown-daily v-if="timekeepingData && timekeepingData.summary.salaryRateType.key == 'DAILY_RATE'" :timekeepingData="timekeepingData" :accountId="accountId" :cutoffDateRangeId="cutoffDateRangeId" />
          <payroll-salary-computation-breakdown-fixed v-if="timekeepingData && timekeepingData.summary.salaryRateType.key == 'FIXED_RATE'" :timekeepingData="timekeepingData" :accountId="accountId" :cutoffDateRangeId="cutoffDateRangeId" />
        </div>
      </div>
    </div>
    <div class="text-center" v-else>
      <q-spinner-dots class="q-mt-xl" size="30px" color="grey" />
    </div>
  </div>
</template>

<style scoped src="./PayrollSalaryComputation.scss"></style>

<script lang="ts">
import { PayrollProcessingResponse } from "@shared/response";
import PayrollSalaryDayBreakdown from './PayrollSalaryDayBreakdown.vue';
import PayrollSalaryComputationBasis from './PayrollSalaryComputationBasis.vue';
import PayrollSalaryComputationBreakdownMonthly from './PayrollSalaryComputationBreakdownMonthly.vue';
import PayrollSalaryComputationBreakdownDaily from './PayrollSalaryComputationBreakdownDaily.vue';
import PayrollSalaryComputationBreakdownFixed from './PayrollSalaryComputationBreakdownFixed.vue';
import PayrollSalaryComputationTax from './PayrollSalaryComputationTax.vue';
import { useQuasar } from 'quasar';
import { api } from 'src/boot/axios';
import { handleAxiosError } from "../../../../../utility/axios.error.handler";
import { formatNumber } from "../../../../../utility/formatter";
import { ref, Ref } from 'vue';
export default {
  name: 'PayrollSalaryComputation',
  components: {
    PayrollSalaryDayBreakdown,
    PayrollSalaryComputationBasis,
    PayrollSalaryComputationBreakdownMonthly,
    PayrollSalaryComputationBreakdownDaily,
    PayrollSalaryComputationBreakdownFixed,
    PayrollSalaryComputationTax,
  },
  props: {
    timekeepingCutoffId: {
      type: Number,
      required: true,
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
    const timekeepingCutoffId = props.timekeepingCutoffId;
    const $q = useQuasar();
    const timekeepingData: Ref<PayrollProcessingResponse | null> = ref(null);
    const isLoading: Ref<boolean> = ref(false);

    const loadEmployeeSalaryComputation = () => {
      isLoading.value = true;

      api
        .get(`/hr-processing/get-employee-salary-computation?timekeepingCutoffId=${timekeepingCutoffId}`)
        .then((response) => {
          timekeepingData.value = response.data;
          isLoading.value = false;
        })
        .catch((error) => {
          handleAxiosError($q, error);
        });
    };

    loadEmployeeSalaryComputation();

    return {
      timekeepingData,
      isLoading,
      formatNumber,
    };
  },
};
</script>
