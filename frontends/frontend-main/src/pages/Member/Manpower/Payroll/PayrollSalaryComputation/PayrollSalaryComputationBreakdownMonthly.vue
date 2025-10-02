<template>
  <div>
    <table class="table summary">
      <tbody>
        <!-- Title - Earnings -->
        <tr>
          <td class="bg-grey-2 text-left text-weight-medium" colspan="2">Earnings:</td>
        </tr>
        <tr>
          <td class="text-left" colspan="2">
            <PayrollSalaryBasicSalarySummary :timekeepingData="timekeepingData" />
          </td>
        </tr>
        <tr>
          <!-- Total Earnings -->
          <td class="text-weight-medium" colspan="2">
            <div class="breakdown-group">
              <div class="indention">
                <div class="indent"></div>
              </div>
              <div class="description text-right q-pr-md">Total Basic Salary</div>
              <div class="amount text-blue">
                <AmountView :activeClass="'text-black'" :amount="timekeepingData.summary.totalBasicSalary" />
              </div>
            </div>
          </td>
          <td class="text-right text-grey nbl nbb">
            <AmountView :activeClass="'text-grey'" :amount="timekeepingData.summary.totalBasicSalary" />
          </td>
        </tr>

        <!-- Title - Deductions -->
        <tr>
          <td class="bg-grey-2 text-left text-weight-medium" colspan="2">Deductions:</td>
          <td class="text-right nbb nbt"></td>
        </tr>
        <tr>
          <td class="text-left nbr nbb" colspan="2">
            <PayrollSalaryDeductionsSummary :timekeepingData="timekeepingData" :accountId="accountId" :cutoffDateRangeId="cutoffDateRangeId" />
          </td>
          <td class="text-right nbb nbt"></td>
        </tr>
        <tr>
          <!-- Total Deductions -->
          <td class="text-weight-medium" colspan="2">
            <div class="breakdown-group">
              <div class="indention">
                <div class="indent"></div>
              </div>
              <div class="description text-right q-pr-md">Total Deductions</div>
              <div class="amount text-red">
                <AmountView :activeClass="'text-black'" :amount="-timekeepingData.summary.totalDeduction"></AmountView>
              </div>
            </div>
          </td>
          <td class="text-right text-grey nbl nbt">
            <AmountView :activeClass="'text-grey'" :amount="-timekeepingData.summary.totalDeduction"></AmountView>
          </td>
        </tr>
        <tr>
          <td class="text-right nbt text-weight-medium" colspan="3">
            <div class="breakdown-group">
              <div class="indention">
                <div class="indent"></div>
              </div>
              <div class="description text-right q-pr-md">Basic Pay</div>
              <div class="amount">
                <AmountView :activeClass="'text-black'" :amount="timekeepingData.summary.basicPayBeforeAdjustment || timekeepingData.summary.basicPay"></AmountView>
              </div>
            </div>
          </td>
          <td class="text-right nbb text-grey">
            <AmountView :activeClass="'text-grey'" :amount="timekeepingData.summary.basicPayBeforeAdjustment || timekeepingData.summary.basicPay"></AmountView>
          </td>
        </tr>

        <!-- Salary Adjustment -->

        <template v-if="timekeepingData.summary.salaryAdjustment && timekeepingData.summary.salaryAdjustment !== 0">
          <tr>
            <td class="bg-grey-2 text-left text-weight-medium" colspan="2">Salary Adjustment:</td>
            <td class="text-right nbb nbt"></td>
            <td class="text-right nbb nbt"></td>
          </tr>
          <tr>
            <td colspan="2" class="text-left">
              <PayrollSalaryAdjustmentSummary :timekeepingData="timekeepingData" :accountId="accountId" :cutoffDateRangeId="cutoffDateRangeId" />
            </td>
            <td class="text-right nbt nbb"></td>
            <td class="text-right nbt nbb"></td>
          </tr>

          <tr>
          <td class="text-right nbt text-weight-medium" colspan="2">
            <div class="breakdown-group">
              <div class="indention">
                <div class="indent"></div>
              </div>
              <div class="description text-right q-pr-md">Total Salary Adjustment</div>
              <div class="amount">
                <AmountView :activeClass="'text-black'" :amount="timekeepingData.summary.salaryAdjustment || 0"></AmountView>
              </div>
            </div>
          </td>
          <td class="text-right nbt nbb"></td>
          <td class="text-right nbb nbt text-grey">
            <AmountView :activeClass="'text-grey'" :amount="timekeepingData.summary.salaryAdjustment || 0"></AmountView>
          </td>
        </tr>
        </template>

        <!-- Title - Additional Earnings -->
        <tr>
          <td class="bg-grey-2 text-left text-weight-medium" colspan="2">Additional Earnings:</td>
          <td class="text-right nbt nbb text-grey"></td>
          <td class="text-right nbt nbb text-grey"></td>
        </tr>

        <tr>
          <td colspan="2" class="text-left">
            <PayrollSalaryAdditionalEarningsSummary :timekeepingData="timekeepingData" />
          </td>
          <td class="nbt nbb"></td>
          <td class="nbt nbb"></td>
        </tr>

        <tr>
          <td class="text-weight-medium" colspan="2">
            <div class="breakdown-group">
              <div class="indention">
                <div class="indent"></div>
              </div>
              <div class="description text-right q-pr-md">Total Additional Earnings</div>
              <div class="amount text-blue">
                <AmountView :activeClass="'text-black'" :amount="timekeepingData.summary.additionalEarnings.total"></AmountView>
              </div>
            </div>
          </td>
          <td class="text-right nbt nbb text-grey"></td>
          <td class="text-right nbb nbt text-grey">
            <AmountView :activeClass="'text-grey'" :amount="timekeepingData.summary.additionalEarnings.total"></AmountView>
          </td>
        </tr>

        <!-- Title - Allowance -->
        <tr>
          <td class="bg-grey-2 text-left text-weight-medium" colspan="2">Allowance:</td>
          <td class="text-right nbb nbt"></td>
          <td class="text-right nbb nbt"></td>
        </tr>
        <tr>
          <td colspan="2" class="text-left">
            <PayrollSalaryAllowanceSummary :timekeepingData="timekeepingData" :accountId="accountId" :cutoffDateRangeId="cutoffDateRangeId" />
          </td>
          <td class="text-right nbt nbb text-grey"></td>
          <td class="text-right nbt nbb text-grey"></td>
        </tr>
        <tr>
          <!-- Total Allowance -->
          <td class="text-right text-weight-medium nbr nbt" colspan="2">
            <div class="breakdown-group">
              <div class="indention">
                <div class="indent"></div>
              </div>
              <div class="description text-right q-pr-md nbt">Total Allowance</div>
              <div class="amount text-blue">
                <AmountView :activeClass="'text-black'" :amount="timekeepingData.summary.totalAllowance"></AmountView>
              </div>
            </div>
          </td>
          <td class="text-right nbt text-grey"></td>
          <td class="text-right nbt text-grey">
            <AmountView :activeClass="'text-grey'" :amount="timekeepingData.summary.totalAllowance"></AmountView>
          </td>
        </tr>
        <tr>
          <!-- Gross Pay -->
          <td class="text-right text-weight-medium" colspan="4">
            <div class="breakdown-group">
              <div class="indention">
                <div class="indent"></div>
              </div>
              <div class="description text-right q-pr-md">Gross Pay</div>
              <div class="amount">
                <AmountView :activeClass="'text-black'" :amount="timekeepingData.summary.grossPay"></AmountView>
              </div>
            </div>
          </td>
          <td class="text-right nbb text-grey">
            <AmountView :activeClass="'text-grey'" :amount="timekeepingData.summary.grossPay"></AmountView>
          </td>
        </tr>

        <!-- Title - Government Contributions -->
        <tr>
          <td class="bg-grey-2 text-left text-weight-medium" colspan="2">Government Contributions:</td>
          <td class="text-right nbb nbt"></td>
          <td class="text-right nbb nbt"></td>
          <td class="text-right nbb nbt"></td>
        </tr>
        <tr>
          <td colspan="2" class="text-left">
            <PayrollSalaryGovernmentContributionsSummary :timekeepingData="timekeepingData" />
          </td>
          <td class="text-right nbt text-grey nbb"></td>
          <td class="nbt nbb"></td>
          <td class="nbt nbb"></td>
        </tr>
        <tr>
          <td class="text-weight-medium" colspan="2">
            <div class="breakdown-group">
              <div class="indention">
                <div class="indent"></div>
              </div>
              <div class="description text-right q-pr-md">Total Government Contributions</div>
              <div class="amount text-blue">
                <AmountView :activeClass="'text-black'" :amount="-timekeepingData.summary.totalGovernmentContribution"></AmountView>
              </div>
            </div>
          </td>
          <td class="nbt nbb"></td>
          <td class="text-right nbb nbt text-grey">
            <AmountView :activeClass="'text-grey'" :amount="-timekeepingData.summary.totalGovernmentContribution"></AmountView>
          </td>
          <td class="nbt nbb"></td>
        </tr>

        <!-- Title - Loans -->
        <tr>
          <td class="bg-grey-2 text-left text-weight-medium" colspan="2">Loans:</td>
          <td class="nbt nbb"></td>
          <td class="nbt nbb"></td>
          <td class="nbt nbb"></td>
        </tr>
        <tr>
          <td colspan="2" class="text-left">
            <PayrollSalaryLoansSummary :timekeepingData="timekeepingData" :accountId="accountId" :cutoffDateRangeId="cutoffDateRangeId" />
          </td>
          <td class="nbt nbb"></td>
          <td class="nbt nbb"></td>
          <td class="nbt nbb"></td>
        </tr>
        <tr>
          <td class="text-weight-medium" colspan="2">
            <div class="breakdown-group">
              <div class="indention">
                <div class="indent"></div>
              </div>
              <div class="description text-right q-pr-md">Total Loans</div>
              <div class="amount text-blue">
                <AmountView :activeClass="'text-black'" :amount="-timekeepingData.summary.totalLoan"></AmountView>
              </div>
            </div>
          </td>
          <td class="nbt nbb"></td>
          <td class="text-right nbb nbt text-grey" colspan="1">
            <AmountView :activeClass="'text-grey'" :amount="-timekeepingData.summary.totalLoan"></AmountView>
          </td>
          <td class="nbt nbb"></td>
        </tr>
        <tr>
          <!-- Total Additional Deductions -->
          <td class="text-right text-weight-medium nbr" colspan="4">
            <div class="breakdown-group">
              <div class="indention">
                <div class="indent"></div>
              </div>
              <div class="description text-right q-pr-md t">Total Additional Deductions</div>
              <div class="amount text-red">
                <AmountView :activeClass="'text-black'" :amount="-timekeepingData.summary.totalAdditionalDeduction"></AmountView>
              </div>
            </div>
          </td>
          <td class="text-right nbt text-grey">
            <AmountView :activeClass="'text-grey'" :amount="-timekeepingData.summary.totalAdditionalDeduction"></AmountView>
          </td>
        </tr>
        <tr>
          <!-- Net Pay -->
          <td class="text-right text-weight-medium" colspan="5">
            <div class="breakdown-group">
              <div class="indention">
                <div class="indent"></div>
              </div>
              <div class="description text-right q-pr-md">Net Pay</div>
              <div class="amount">
                <AmountView :activeClass="'text-blue'" :amount="timekeepingData.summary.netPay"></AmountView>
              </div>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped src="./PayrollSalaryComputation.scss"></style>

<script lang="ts">
import { PayrollProcessingResponse } from "@shared/response";
import AmountView from "../../../../../components/shared/display/AmountView.vue";
import PayrollSalaryAdditionalEarningsSummary from './SummaryGroup/PayrollSalaryAdditionalEarningsSummary.vue';
import PayrollSalaryGovernmentContributionsSummary from './SummaryGroup/PayrollSalaryGovernmentContributionsSummary.vue';
import PayrollSalaryDeductionsSummary from './SummaryGroup/PayrollSalaryDeductionsSummary.vue';
import PayrollSalaryBasicSalarySummary from './SummaryGroup/PayrollSalaryBasicSalarySummary.vue';
import PayrollSalaryAllowanceSummary from './SummaryGroup/PayrollSalaryAllowanceSummary.vue';
import PayrollSalaryLoansSummary from './SummaryGroup/PayrollSalaryLoansSummary.vue';
import PayrollSalaryAdjustmentSummary from './SummaryGroup/PayrollSalaryAdjustmentSummary.vue';

export default {
  name: 'PayrollSalaryComputationBreakdownMonthly',
  components: {
    AmountView,
    PayrollSalaryAdditionalEarningsSummary,
    PayrollSalaryGovernmentContributionsSummary,
    PayrollSalaryLoansSummary,
    PayrollSalaryDeductionsSummary,
    PayrollSalaryBasicSalarySummary,
    PayrollSalaryAllowanceSummary,
    PayrollSalaryAdjustmentSummary,
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
};
</script>
