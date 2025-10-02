<template>
  <div>
    <table class="table summary">
      <tbody>
        <tr>
          <td class="bg-grey-2 text-left text-weight-medium" colspan="2">
            Basic Salary
          </td>
        </tr>
        <tr>
          <td class="text-left" colspan="2">
            <PayrollSalaryBasicSalarySummary
              :timekeepingData="timekeepingData"
            />
          </td>
        </tr>
        <tr>
          <!-- Total Basic Salary -->
          <td class="text-weight-medium" colspan="2">
            <div class="breakdown-group">
              <div class="indention">
                <div class="indent"></div>
              </div>
              <div class="description text-right q-pr-md">
                Total Basic Salary
              </div>
              <div class="amount">
                <AmountView
                  :activeClass="'text-black'"
                  :amount="
                    timekeepingData.summary.taxComputationBreakdown
                      .totalBasicSalary
                  "
                ></AmountView>
              </div>
            </div>
          </td>
          <td class="text-right text-grey nbl nbb">
            <AmountView
              :activeClass="'text-grey'"
              :amount="
                timekeepingData.summary.taxComputationBreakdown.totalBasicSalary
              "
            ></AmountView>
          </td>
        </tr>
        <tr>
          <td class="bg-grey-2 text-left text-weight-medium" colspan="2">
            Additional Earnings
          </td>
          <td class="nbb nbt"></td>
        </tr>
        <tr>
          <td class="text-left" colspan="2">
            <PayrollSalaryAdditionalEarningsSummary
              :timekeepingData="timekeepingData"
            />
          </td>
          <td class="nbb nbt"></td>
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
                <AmountView
                  :activeClass="'text-black'"
                  :amount="
                    timekeepingData.summary.taxComputationBreakdown
                      .totalEarnings
                  "
                ></AmountView>
              </div>
            </div>
          </td>
          <td class="text-right text-grey nbt nbb">
            <AmountView
              :activeClass="'text-grey'"
              :amount="
                timekeepingData.summary.taxComputationBreakdown.totalEarnings
              "
            ></AmountView>
          </td>
        </tr>
        <tr>
          <td class="bg-grey-2 text-left text-weight-medium" colspan="2">
            Taxable Allowance
          </td>
          <td class="nbb nbt"></td>
        </tr>
        <tr>
          <td class="text-left" colspan="2">
            <PayrollSalaryTaxableAllowanceSummary
              :timekeepingData="timekeepingData"
              :accountId="accountId"
              :cutoffDateRangeId="cutoffDateRangeId"
            />
          </td>
          <td class="nbb nbt"></td>
        </tr>
        <tr>
          <!-- Total Taxable Allowance -->
          <td class="text-weight-medium" colspan="2">
            <div class="breakdown-group">
              <div class="indention">
                <div class="indent"></div>
              </div>
              <div class="description text-right q-pr-md">
                Total Taxable Allowance
              </div>
              <div class="amount">
                <AmountView
                  :activeClass="'text-black'"
                  :amount="
                    timekeepingData.summary.taxComputationBreakdown
                      .totalTaxableAllowance
                  "
                ></AmountView>
              </div>
            </div>
          </td>
          <td class="text-right text-grey nbt nbb">
            <AmountView
              :activeClass="'text-grey'"
              :amount="
                timekeepingData.summary.taxComputationBreakdown
                  .totalTaxableAllowance
              "
            ></AmountView>
          </td>
        </tr>
        <tr>
          <td class="text-right text-weight-medium" colspan="3">
            <div class="breakdown-group">
              <div class="indention">
                <div class="indent"></div>
              </div>
              <div class="description text-right q-pr-md">
                Gross Taxable Income
              </div>
              <div class="amount">
                <AmountView
                  :activeClass="'text-black'"
                  :amount="
                    timekeepingData.summary.taxComputationBreakdown
                      .grossTaxableIncome
                  "
                ></AmountView>
              </div>
            </div>
          </td>
          <td class="text-right nbb text-grey">
            <AmountView
              :activeClass="'text-grey'"
              :amount="
                timekeepingData.summary.taxComputationBreakdown
                  .grossTaxableIncome
              "
            ></AmountView>
          </td>
        </tr>
        <tr>
          <td class="bg-grey-2 text-left text-weight-medium" colspan="2">
            Non-Taxable - Government Contributions
          </td>
          <td class="nbb nbt"></td>
          <td class="nbb nbt"></td>
        </tr>
        <tr>
          <td colspan="2">
            <PayrollSalaryNonTaxableGovernmentContributionSummary
              :timekeepingData="timekeepingData"
            />
          </td>
          <td class="nbb nbt"></td>
          <td class="nbb nbt"></td>
        </tr>
        <tr>
          <!-- Total Non-Taxable - Government Contributions -->
          <td class="text-weight-medium" colspan="2">
            <div class="breakdown-group">
              <div class="indention">
                <div class="indent"></div>
              </div>
              <div class="description text-right q-pr-md">
                Total Non-Taxable Government Contributions
              </div>
              <div class="amount">
                <AmountView
                  :activeClass="'text-black'"
                  :amount="
                    -timekeepingData.summary.taxComputationBreakdown
                      .nonTaxableGovernmentContribution
                  "
                ></AmountView>
              </div>
            </div>
          </td>
          <td class="text-right text-grey nbt nbb">
            <AmountView
              :activeClass="'text-grey'"
              :amount="
                -timekeepingData.summary.taxComputationBreakdown
                  .nonTaxableGovernmentContribution
              "
            ></AmountView>
          </td>
          <td class="nbb nbt"></td>
        </tr>
        <tr>
          <td class="bg-grey-2 text-left text-weight-medium" colspan="2">
            Deductions
          </td>
          <td class="nbb nbt"></td>
          <td class="nbb nbt"></td>
        </tr>
        <tr>
          <td colspan="2">
            <PayrollSalaryDeductionsSummary
              :timekeepingData="timekeepingData"
              :accountId="accountId"
              :cutoffDateRangeId="cutoffDateRangeId"
            />
          </td>
          <td class="nbb nbt"></td>
          <td class="nbb nbt"></td>
        </tr>
        <tr>
          <!-- Total Additional Deductions -->
          <td class="text-weight-medium" colspan="2">
            <div class="breakdown-group">
              <div class="indention">
                <div class="indent"></div>
              </div>
              <div class="description text-right q-pr-md">
                Total Deductions
              </div>
              <div class="amount">
                <AmountView
                  :activeClass="'text-black'"
                  :amount="
                    -timekeepingData.summary.taxComputationBreakdown
                      .totalDeduction
                  "
                ></AmountView>
              </div>
            </div>
          </td>
          <td class="text-right text-grey nbt nbb">
            <AmountView
              :activeClass="'text-grey'"
              :amount="
                -timekeepingData.summary.taxComputationBreakdown
                  .totalDeduction
              "
            ></AmountView>
          </td>
          <td class="nbb nbt"></td>
        </tr>
        <tr>
          <td class="text-right text-weight-medium" colspan="3">
            <div class="breakdown-group">
              <div class="indention">
                <div class="indent"></div>
              </div>
              <div class="description text-right q-pr-md">
                Non-Taxable Deduction
              </div>
              <div class="amount">
                <AmountView
                  :activeClass="'text-black'"
                  :amount="
                    -timekeepingData.summary.taxComputationBreakdown
                      .nonTaxableDeduction
                  "
                >
                </AmountView>

              </div>
            </div>
          </td>
          <td class="text-right nbt nbb text-grey">
            <AmountView
              :activeClass="'text-grey'"
              :amount="
                -timekeepingData.summary.taxComputationBreakdown
                  .nonTaxableDeduction
              "
            >
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
              <div class="description text-right q-pr-md">Taxable Income</div>
              <div class="amount">
                <AmountView
                  :activeClass="'text-black'"
                  :amount="
                    timekeepingData.summary.taxComputationBreakdown
                      .taxableIncomeCurrent
                  "
                ></AmountView>
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
import PayrollSalaryBasicSalarySummary from './SummaryGroup/PayrollSalaryBasicSalarySummary.vue';
import PayrollSalaryAdditionalEarningsSummary from './SummaryGroup/PayrollSalaryAdditionalEarningsSummary.vue';
import PayrollSalaryTaxableAllowanceSummary from './SummaryGroup/PayrollSalaryTaxableAllowanceSummary.vue';
import PayrollSalaryNonTaxableGovernmentContributionSummary from './SummaryGroup/PayrollSalaryNonTaxableGovernmentContributionSummary.vue';
import PayrollSalaryDeductionsSummary from './SummaryGroup/PayrollSalaryDeductionsSummary.vue';

export default {
  name: 'PayrollSalaryComputationTax',
  components: {
    PayrollSalaryBasicSalarySummary,
    PayrollSalaryAdditionalEarningsSummary,
    PayrollSalaryTaxableAllowanceSummary,
    PayrollSalaryNonTaxableGovernmentContributionSummary,
    PayrollSalaryDeductionsSummary,
    AmountView,
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
