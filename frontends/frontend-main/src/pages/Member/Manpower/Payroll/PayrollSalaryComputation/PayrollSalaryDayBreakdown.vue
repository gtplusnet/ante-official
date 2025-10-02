<template>
  <div>
    <table class="table">
      <thead>
        <tr>
          <th rowspan="2">Date</th>
          <th width="80px" rowspan="2">
            Day Rate

          </th>
          <th colspan="6">Deductions</th>
          <th v-if="timekeepingData.summary.salaryRateType.key == 'DAILY_RATE'" width="80px" rowspan="2">Basic Pay</th>
          <th colspan="16">Additional Earnings</th>
        </tr>
        <tr>
          <th colspan="2">Late</th>
          <th colspan="2">Undertime</th>
          <th colspan="1">Absent</th>
          <th colspan="1">Total</th>
          <th colspan="2">Rest Day</th>
          <th colspan="3">Overtime</th>
          <th colspan="3">Night Differential</th>
          <th colspan="3">ND / OT</th>
          <th colspan="2">Special<br>Holiday Pay</th>
          <th colspan="2">Regular<br>Holiday Pay</th>
          <th>Total</th>
        </tr>
      </thead>
      <template v-if="!timekeepingData">
        <tbody>
          <tr>
            <td colspan="20" class="text-center">No data available</td>
          </tr>
        </tbody>
      </template>
      <template v-else>
        <!-- Total -->
        <tbody class="total">
          <tr>
            <td colspan="2">Total</td>
            <td class="text-right" colspan="2"><amount-view activeClass="text-black"
                :amount="timekeepingData.summary.deductions.late"></amount-view></td>
            <td class="text-right" colspan="2"><amount-view activeClass="text-black"
                :amount="timekeepingData.summary.deductions.undertime"></amount-view></td>
            <td class="text-right" colspan="1"><amount-view activeClass="text-black"
                :amount="timekeepingData.summary.deductions.absent"></amount-view></td>
            <td class="text-right"><amount-view activeClass="text-red"
                :amount="timekeepingData.summary.deductions.total"></amount-view></td>
            <td v-if="timekeepingData.summary.salaryRateType.key == 'DAILY_RATE'" class="text-right"><amount-view
                activeClass="text-black" :amount="timekeepingData.summary.basicPay"></amount-view></td>
            <td class="text-right" colspan="2"><amount-view activeClass="text-black"
                :amount="timekeepingData.summary.additionalEarnings.restDay"></amount-view></td>
            <td class="text-right" colspan="3"><amount-view activeClass="text-black"
                :amount="timekeepingData.summary.additionalEarnings.overtime"></amount-view></td>
            <td class="text-right" colspan="3"><amount-view activeClass="text-black"
                :amount="timekeepingData.summary.additionalEarnings.nightDifferential"></amount-view></td>
            <td class="text-right" colspan="3"><amount-view activeClass="text-black"
                :amount="timekeepingData.summary.additionalEarnings.nightDifferentialOvertime"></amount-view></td>
            <td class="text-right" colspan="2"><amount-view activeClass="text-black"
                :amount="timekeepingData.summary.additionalEarnings.specialHoliday"></amount-view></td>
            <td class="text-right" colspan="2"><amount-view activeClass="text-black"
                :amount="timekeepingData.summary.additionalEarnings.regularHoliday"></amount-view></td>
            <td class="text-right"><amount-view activeClass="text-blue"
                :amount="timekeepingData.summary.additionalEarnings.total"></amount-view></td>
          </tr>
        </tbody>
        <tbody v-for="(item, index) in timekeepingData.dayBreakdown" :key="index">
          <tr :key="index">
            <td>{{ item.date.date }}</td>
            <td class="text-right">
              <amount-view activeClass="text-black" :amount="item.dailyRate"></amount-view>
              <payroll-salary-day-breakdown-tooltip-day-rate
                :totalWorkDaysInYear="item.totalWorkDaysInYear"
                :totalWorkDaysInYearBreakdown="item.totalWorkDaysInYearBreakdown"
                :monthlyRate="timekeepingData.salaryRate.monthlyRate"
                :dailyRate="item.dailyRate"
                :computationMethod="item.dailyRateComputationMethod"
                :monthlyWorkingDays="item.monthlyWorkingDays"
                :workingDaysPerWeek="item.workingDaysPerWeek"
                ></payroll-salary-day-breakdown-tooltip-day-rate>
            </td>
            <td class="text-left nbr"><time-view activeClass="text-grey" :time="item.deductions.timeLate"></time-view>
            </td>
            <td class="text-right nbl"><amount-view :amount="item.deductions.late"></amount-view></td>
            <td class="text-left nbr"><time-view activeClass="text-grey"
                :time="item.deductions.timeUndertime"></time-view></td>
            <td class="text-right nbl"><amount-view :amount="item.deductions.undertime"></amount-view></td>
            <td class="text-right nbl">
              <amount-view :amount="item.deductions.absent"></amount-view>
              <span v-if="item.hasApprovedLeave && item.leaveCompensationType === 'WITHOUT_PAY'" class="absent-on-leave-indicator">
                <q-icon name="event_busy" size="14px" />
                <q-tooltip>
                  <div>Absent (On Leave)</div>
                  <div v-if="item.leaveType">Type: {{ item.leaveType }}</div>
                  <div>Without Pay</div>
                </q-tooltip>
              </span>
            </td>
            <td class="text-right"><amount-view activeClass="text-red" :amount="item.deductions.total"></amount-view>
            </td>
            <td v-if="timekeepingData.summary.salaryRateType.key == 'DAILY_RATE'" class="text-right"><amount-view
                activeClass="text-black" :amount="item.basicPay"></amount-view></td>

            <!-- Rest Day -->
            <td class="text-center nbr nbl"><amount-view activeClass="text-grey"
                :amount="item.rates.rateRestDay"></amount-view></td>
            <td class="text-right nbl"><amount-view activeClass="text-black"
                :amount="item.additionalEarnings.restDay"></amount-view></td>

            <!-- Overtime -->
            <td class="text-left nbl nbr"><time-view activeClass="text-grey"
                :time="item.additionalEarnings.timeOvertime"></time-view></td>
            <td class="text-center nbr nbl"><amount-view activeClass="text-grey"
                :amount="item.rates.rateOvertime"></amount-view></td>
            <td class="text-right nbl"><amount-view activeClass="text-black"
                :amount="item.additionalEarnings.overtime"></amount-view></td>

            <!-- Night Differential -->
            <td class="text-left nbl nbr"><time-view activeClass="text-grey"
                :time="item.additionalEarnings.timeNightDifferential"></time-view></td>
            <td class="text-center nbr nbl"><amount-view activeClass="text-grey"
                :amount="item.rates.rateNightDifferential"></amount-view></td>
            <td class="text-right nbl"><amount-view activeClass="text-black"
                :amount="item.additionalEarnings.nightDifferential"></amount-view></td>

            <!-- ND / OT -->
            <td class="text-left nbl nbr"><time-view activeClass="text-grey"
                :time="item.additionalEarnings.timeNightDifferentialOvertime"></time-view></td>
            <td class="text-center nbr nbl"><amount-view activeClass="text-grey"
                :amount="item.rates.rateNightDifferentialOvertime"></amount-view></td>
            <td class="text-right nbl"><amount-view activeClass="text-black"
                :amount="item.additionalEarnings.nightDifferentialOvertime"></amount-view></td>

            <!-- Special Holiday -->
            <td class="text-left nbr nbl"><amount-view activeClass="text-grey"
                :amount="item.rates.rateSpecialHoliday"></amount-view></td>
            <td class="text-right nbl"><amount-view activeClass="text-black"
                :amount="item.additionalEarnings.specialHoliday"></amount-view></td>

            <!-- Regular Holiday -->
            <td class="text-left nbr nbl"><amount-view activeClass="text-grey"
                :amount="item.rates.rateRegularHoliday"></amount-view></td>
            <td class="text-right nbl"><amount-view activeClass="text-black"
                :amount="item.additionalEarnings.regularHoliday"></amount-view></td>

            <!-- Total -->
            <td class="text-right nbl"><amount-view activeClass="text-blue"
                :amount="item.additionalEarnings.total"></amount-view></td>
          </tr>
        </tbody>
      </template>
    </table>
  </div>
</template>

<style scoped src="./PayrollSalaryComputation.scss"></style>

<script lang="ts">
import { PayrollProcessingResponse } from "@shared/response";
import TimeView from "../../../../../components/shared/display/TimeView.vue";
import AmountView from "../../../../../components/shared/display/AmountView.vue";
import PayrollSalaryDayBreakdownTooltipDayRate from './PayrollSalaryDayBreakdownTooltipDayRate.vue';

export default {
  name: 'PayrollSalaryDayBreakdown',
  components: {
    TimeView,
    AmountView,
    PayrollSalaryDayBreakdownTooltipDayRate,
  },
  props: {
    timekeepingData: {
      type: Object as () => PayrollProcessingResponse,
      default: null,
    },
  },
};
</script>
