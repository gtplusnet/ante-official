<template>
  <div>
    <table class="table summary">
      <tbody>
        <!-- Title - Additional Earnings -->
        <tr>
          <td class="bg-grey-2 text-left text-weight-medium" colspan="2">Additional Earnings</td>
        </tr>
        <tr>
          <td colspan="2" class="text-left">
            <PayrollSalaryAdditionalEarningsSummary :timekeepingData="timekeepingData" />
          </td>
        </tr>
        <tr>
          <!-- Total Earnings -->
          <td class="text-weight-medium" colspan="2">
            <div class="breakdown-group">
              <div class="indention">
                <div class="indent"></div>
              </div>
              <div class="description text-right q-pr-md">Total Earnings</div>
              <div class="amount">
                <AmountView :activeClass="'text-black'" :amount="timekeepingData.summary.additionalEarnings.total">
                </AmountView>
              </div>
            </div>
          </td>
          <td class="text-right text-grey nbl nbb">
            <AmountView :activeClass="'text-grey'" :amount="timekeepingData.summary.additionalEarnings.total">
            </AmountView>
          </td>
        </tr>

        <tr>
          <!-- Total Earnings -->
          <td class="text-weight-medium" colspan="2">
            <div class="breakdown-group">
              <div class="indention">
                <div class="indent"></div>
              </div>
              <div class="description text-right q-pr-md">Basic Pay</div>
              <div class="amount">
                <div class="amount">
                  <AmountView :activeClass="'text-black'"
                    :amount="timekeepingData.summary.basicPayBeforeAdjustment || timekeepingData.summary.basicPay">
                  </AmountView>
                </div>
              </div>
            </div>
          </td>
          <td class="text-right text-grey nbl nbt nbb">
            <AmountView :activeClass="'text-grey'"
              :amount="timekeepingData.summary.basicPayBeforeAdjustment || timekeepingData.summary.basicPay">
            </AmountView>
          </td>
        </tr>

        <!-- Salary Adjustment -->
        <template v-if="timekeepingData.summary.salaryAdjustment && timekeepingData.summary.salaryAdjustment !== 0">
          <tr>
            <td class="bg-grey-2 text-left text-weight-medium" colspan="2">Salary Adjustment:</td>
            <td class="text-right nbb nbt"></td>
          </tr>
          <tr>
            <td colspan="2" class="text-left">
              <PayrollSalaryAdjustmentSummary :timekeepingData="timekeepingData" :accountId="accountId"
                :cutoffDateRangeId="cutoffDateRangeId" />
            </td>
            <td class="text-right nbt nbb"></td>
          </tr>
          <tr>
            <td class="text-weight-medium" colspan="2">
              <div class="breakdown-group">
                <div class="indention">
                  <div class="indent"></div>
                </div>
                <div class="description text-right q-pr-md">Total Salary Adjustment</div>
                <div class="amount">
                  <AmountView :activeClass="'text-black'" :amount="timekeepingData.summary.salaryAdjustment">
                  </AmountView>
                </div>
              </div>
            </td>
            <td class="text-right text-grey nbl nbt nbb">
              <AmountView :activeClass="'text-grey'" :amount="timekeepingData.summary.salaryAdjustment || 0">
              </AmountView>
            </td>
          </tr>
        </template>

        <!-- Title - Allowance -->
        <tr>
          <td class="bg-grey-2 text-left text-weight-medium" colspan="2">Allowance</td>
          <td class="text-right nbb nbt"></td>
        </tr>
        <tr>
          <td colspan="2" class="text-left">
            <PayrollSalaryAllowanceSummary :timekeepingData="timekeepingData" :accountId="accountId"
              :cutoffDateRangeId="cutoffDateRangeId" />
          </td>
          <td class="text-right nbb nbt"></td>
        </tr>
        <tr>
          <!-- Total Allowance -->
          <td class="text-weight-medium" colspan="2">
            <div class="breakdown-group">
              <div class="indention">
                <div class="indent"></div>
              </div>
              <div class="description text-right q-pr-md">Total Allowance</div>
              <div class="amount text-black">
                <AmountView :activeClass="'text-black'" :amount="timekeepingData.summary.totalAllowance"></AmountView>
              </div>
            </div>
          </td>
          <td class="text-right text-grey nbl nbt">
            <AmountView :activeClass="'text-grey'" :amount="timekeepingData.summary.totalAllowance"></AmountView>
          </td>
        </tr>
        <!-- Gross Pay -->
        <tr>
          <td class="text-right nbt text-weight-medium" colspan="3">
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
          <td class="bg-grey-2 text-left text-weight-medium" colspan="1">Government Contributions</td>
          <td class="text-right nbb nbt" colspan="2"></td>
          <td class="text-right nbb nbt"></td>
        </tr>
        <tr>
          <td colspan="1" class="text-left">
            <PayrollSalaryGovernmentContributionsSummary :timekeepingData="timekeepingData" />
          </td>
          <td class="text-right nbt text-grey nbb" colspan="2"></td>
          <td class="text-right nbt text-grey nbb"></td>
        </tr>

        <tr>
          <!-- Total Government Contributions -->
          <td class="text-right text-weight-medium" colspan="1">
            <div class="breakdown-group">
              <div class="indention">
                <div class="indent"></div>
              </div>
              <div class="description text-right q-pr-md t">Total Contributions</div>
              <div class="amount text-red">
                <AmountView :activeClass="'text-black'" :amount="-timekeepingData.summary.totalGovernmentContribution">
                </AmountView>
              </div>
            </div>
          </td>
          <td class="text-right nbt text-grey nbb" colspan="2">
            <AmountView :activeClass="'text-grey'" :amount="-timekeepingData.summary.totalGovernmentContribution">
            </AmountView>
          </td>
          <td class="text-right nbt text-grey nbb"></td>
        </tr>

        <!-- Title - Loans -->
        <tr>
          <td class="bg-grey-2 text-left text-weight-medium" colspan="1">Loan</td>
          <td class="text-right nbb nbt" colspan="2"></td>
          <td class="text-right nbb nbt"></td>
        </tr>
        <tr>
          <td colspan="2" class="text-left">
            <PayrollSalaryLoansSummary :timekeepingData="timekeepingData" :accountId="accountId"
              :cutoffDateRangeId="cutoffDateRangeId" />
          </td>
          <td class="text-right nbt text-grey nbb" colspan="1"></td>
          <td class="text-right nbt text-grey nbb"></td>
        </tr>
        <tr>
          <!-- Total Loan -->
          <td class="text-right text-weight-medium nbr" colspan="1">
            <div class="breakdown-group">
              <div class="indention">
                <div class="indent"></div>
              </div>
              <div class="description text-right q-pr-md t">Total Loan</div>
              <div class="amount text-red">
                <AmountView :activeClass="'text-black'" :amount="-timekeepingData.summary.totalLoan"></AmountView>
              </div>
            </div>
          </td>
          <td class="text-right nbt text-grey" colspan="2">
            <AmountView :activeClass="'text-grey'" :amount="-timekeepingData.summary.totalLoan" />
          </td>
          <td class="text-right nbt text-grey nbb"></td>
        </tr>

        <tr>
          <!-- Total Deductions -->
          <td class="text-right text-weight-medium nbr" colspan="3">
            <div class="breakdown-group">
              <div class="indention">
                <div class="indent"></div>
              </div>
              <div class="description text-right q-pr-md t">Total Additional Deduction</div>
              <div class="amount">
                <AmountView :activeClass="'text-black'" :amount="-timekeepingData.summary.totalAdditionalDeduction">
                </AmountView>
              </div>
            </div>
          </td>
          <td class="text-right nbt text-grey" colspan="1">
            <AmountView :activeClass="'text-grey'" :amount="-timekeepingData.summary.totalAdditionalDeduction">
            </AmountView>
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
import PayrollSalaryLoansSummary from './SummaryGroup/PayrollSalaryLoansSummary.vue';
import PayrollSalaryAllowanceSummary from './SummaryGroup/PayrollSalaryAllowanceSummary.vue';
import PayrollSalaryAdjustmentSummary from './SummaryGroup/PayrollSalaryAdjustmentSummary.vue';

export default {
  name: 'PayrollSalaryComputationBreakdownDaily',
  components: {
    AmountView,
    PayrollSalaryAdditionalEarningsSummary,
    PayrollSalaryGovernmentContributionsSummary,
    PayrollSalaryLoansSummary,
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
