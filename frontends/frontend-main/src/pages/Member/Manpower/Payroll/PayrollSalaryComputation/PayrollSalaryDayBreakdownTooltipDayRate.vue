<template>
     <q-tooltip>
        <!-- AUTO mode: Based on Working Days in a Year -->
        <div v-if="!computationMethod || computationMethod === 'AUTO'">
          <div class="text-weight-bold q-mb-sm">AUTO: Based on Working Days in a Year</div>
          <div :class="!totalWorkDaysInYearBreakdown.isMondayWorkDay ? 'text-strike' : ''">Monday: {{ totalWorkDaysInYearBreakdown.monday }} Days</div>
          <div :class="!totalWorkDaysInYearBreakdown.isTuesdayWorkDay ? 'text-strike' : ''">Tuesday: {{ totalWorkDaysInYearBreakdown.tuesday }} Days</div>
          <div :class="!totalWorkDaysInYearBreakdown.isWednesdayWorkDay ? 'text-strike' : ''">Wednesday: {{ totalWorkDaysInYearBreakdown.wednesday }} Days</div>
          <div :class="!totalWorkDaysInYearBreakdown.isThursdayWorkDay ? 'text-strike' : ''">Thursday: {{ totalWorkDaysInYearBreakdown.thursday }} Days</div>
          <div :class="!totalWorkDaysInYearBreakdown.isFridayWorkDay ? 'text-strike' : ''">Friday: {{ totalWorkDaysInYearBreakdown.friday }} Days</div>
          <div :class="!totalWorkDaysInYearBreakdown.isSaturdayWorkDay ? 'text-strike' : ''">Saturday: {{ totalWorkDaysInYearBreakdown.saturday }} Days</div>
          <div :class="!totalWorkDaysInYearBreakdown.isSundayWorkDay ? 'text-strike' : ''">Sunday: {{ totalWorkDaysInYearBreakdown.sunday }} Days</div>
          <div class="q-mt-sm">Total Work Days in Year: <amount-view activeClass="text-white" :amount="totalWorkDaysInYear"></amount-view></div>
          <div>Monthly Rate: <amount-view activeClass="text-white" :amount="monthlyRate"></amount-view></div>
          <div class="q-mt-sm">Daily Rate: (<amount-view activeClass="text-white" :amount="monthlyRate"></amount-view> × 12) ÷ <amount-view activeClass="text-white" :amount="totalWorkDaysInYear"></amount-view></div>
        </div>
        
        <!-- MANUAL mode: Based on Working Days per Week -->
        <div v-else>
          <div class="text-weight-bold q-mb-sm">MANUAL: Based on Working Days per Week</div>
          <div>Working Days per Week: {{ workingDaysPerWeek }}</div>
          <div>Monthly Working Days: {{ monthlyWorkingDays }}</div>
          <div class="q-mt-sm">Monthly Rate: <amount-view activeClass="text-white" :amount="monthlyRate"></amount-view></div>
          <div class="q-mt-sm">Daily Rate: <amount-view activeClass="text-white" :amount="monthlyRate"></amount-view> ÷ {{ monthlyWorkingDays }}</div>
        </div>
     </q-tooltip>
</template>

<script lang="ts">
import { PayrollProcessingTotalWorkDaysInYearBreakdown } from '@shared/response/payroll-processing.response';
import { PropType } from 'vue';
import AmountView from "../../../../../components/shared/display/AmountView.vue";

export default {
  name: 'PayrollSalaryDayBreakdownTooltipDayRate',
  components: {
    AmountView,
  },
  props: {
    totalWorkDaysInYear: {
      type: Number,
      required: true,
    },
    totalWorkDaysInYearBreakdown: {
      type: Object as PropType<PayrollProcessingTotalWorkDaysInYearBreakdown>,
      required: true,
    },
    monthlyRate: {
      type: Number,
      required: true,
    },
    dailyRate: {
      type: Number,
      required: true,
    },
    computationMethod: {
      type: String as PropType<'AUTO' | 'MANUAL'>,
      default: 'AUTO',
    },
    monthlyWorkingDays: {
      type: Number,
      default: undefined,
    },
    workingDaysPerWeek: {
      type: Number,
      default: undefined,
    },
  },
};
</script>
