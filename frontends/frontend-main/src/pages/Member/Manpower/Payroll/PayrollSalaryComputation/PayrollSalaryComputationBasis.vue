<template>
  <div>
    <table class="table summary">
      <tbody>
        <tr>
          <td class="bg-grey-2 text-center text-weight-medium" colspan="2">Computation Basis</td>
        </tr>
        <tr>
          <td class="text-left" colspan="2">
            <summary-group
              description="Payroll Period Type"
              :amount="timekeepingData.summary.cutoffType.label"
              :indention="0"
            />

            <summary-group
              description="Computation Type"
              :amount="timekeepingData.summary.salaryRateType.label"
              :indention="0"
            />

            <!-- Salary Rate -->
            <summary-group
              class="q-mt-sm text-bold"
              description="Salary Rate"
              :indention="0"
            />

            <summary-group
              description="Monthly Rate"
              :amount="timekeepingData.salaryRate.monthlyRate"
              :indention="1"
            />

            <summary-group
              description="Daily Rate"
              :amount="timekeepingData.salaryRate.dailyRate"
              :indention="1"
            />

            <summary-group
              description="Hourly Rate"
              :amount="timekeepingData.salaryRate.hourlyRate"
              :indention="1"
            />

            <summary-group
              description="Basic Salary"
              :amount="timekeepingData.salaryRate.cutoffRate"
              :indention="1"
            />

            <!-- Deduction Period -->
            <summary-group
              class="q-mt-sm text-bold"
              description="Deduction Period"
              :indention="0"
            />

            <summary-group
              description="Witholding Tax"
              :amount="timekeepingData.summary.deductionPeriodWitholdingTax.label"
              :indention="1"
            />

            <summary-group
              description="SSS"
              :amount="timekeepingData.summary.deductionPeriodSSS.label"
              :indention="1"
            />


            <summary-group
              description="Philhealth"
              :amount="timekeepingData.summary.deductionPeriodPhilhealth.label"
              :indention="1"
            />

            <summary-group
              description="Pagibig"
              :amount="timekeepingData.summary.deductionPeriodPagibig.label"
              :indention="1"
            />

            <!-- Deduction Basis -->
            <summary-group
              class="q-mt-sm text-bold"
              description="Deduction Basis"
              :indention="0"
            />

            <summary-group
              description="SSS"
              :amount="timekeepingData.summary.deductionBasisSSS.label"
              :indention="1"
            />

            <summary-group
              description="Philhealth"
              :amount="timekeepingData.summary.deductionBasisPhilhealth.label"
              :indention="1"
            />

            <!-- SSS Computation Basis -->
            <summary-group
              class="q-mt-sm text-bold"
              description="SSS Computation"
              :indention="0"
            />

            <summary-group
              :amount="timekeepingData.summary.contributions.sssAmountBasis"
              description="SSS Amount Basis"
              :indention="1"
            />

            <summary-group
              v-if="timekeepingData.summary.deductionPeriodSSS.key === 'FIRST_PERIOD' || timekeepingData.summary.deductionPeriodSSS.key === 'LAST_PERIOD'"
              description="Current"
              :amount="timekeepingData.summary.contributions.sssAmountBasisCurrent"
              :indention="2"
            />

            <summary-group
              v-if="timekeepingData.summary.deductionPeriodSSS.key === 'FIRST_PERIOD' || timekeepingData.summary.deductionPeriodSSS.key === 'LAST_PERIOD'"
              description="Previous"
              :amount="timekeepingData.summary.contributions.sssAmountBasisPrevious"
              :indention="2"
            />

            <summary-group
              description="Employee Share"
              :indention="1"
            />

            <summary-group
              description="Regular"
              :amount="timekeepingData.summary.contributions.sssBreakdown.employee.regular"
              :indention="2"
            />
            <summary-group
              description="Mandatory Provident Fund"
              :amount="timekeepingData.summary.contributions.sssBreakdown.employee.mandatoryProvidentFund"
              :indention="2"
            />
            <summary-group
              description="Total"
              :amount="timekeepingData.summary.contributions.sssBreakdown.employee.total"
              :indention="2"
            />

            <summary-group
              description="Employer Share"
              :indention="1"
            />

            <summary-group
              description="Regular"
              :amount="timekeepingData.summary.contributions.sssBreakdown.employer.regular"
              :indention="2"
            />

            <summary-group
              description="Employees' Compensation"
              :amount="timekeepingData.summary.contributions.sssBreakdown.employer.ec"
              :indention="2"
            />

            <summary-group
              description="Mandatory Provident Fund"
              :amount="timekeepingData.summary.contributions.sssBreakdown.employer.mandatoryProvidentFund"
              :indention="2"
            />
            <summary-group
              description="Total"
              :amount="timekeepingData.summary.contributions.sssBreakdown.employer.total"
              :indention="2"
            />

            <summary-group
              description="Monthly Salary Credit"
              :indention="1"
            />

            <summary-group
              description="Regular"
              :amount="timekeepingData.summary.contributions.sssBreakdown.monthlySalaryCredit.regular"
              :indention="2"
            />
            <summary-group
              description="Mandatory Provident Fund"
              :amount="timekeepingData.summary.contributions.sssBreakdown.monthlySalaryCredit.mandatoryProvidentFund"
              :indention="2"
            />
            <summary-group
              description="Total"
              :amount="timekeepingData.summary.contributions.sssBreakdown.monthlySalaryCredit.total"
              :indention="2"
            />


            <!-- Philhealth Computation Basis -->
            <summary-group
              class="q-mt-sm text-bold"
              description="Philhealth Computation"
              :indention="0"
            />

            <summary-group
              description="Percentage"
              :amount="timekeepingData.summary.contributions.philhealthBreakdown.percentage.formatPercentage"
              :indention="1"
            />

            <summary-group
              description="Amount Basis"
              :amount="timekeepingData.summary.contributions.philhealthAmountBasis"
              :indention="1"
            />

            <summary-group
              v-if="timekeepingData.summary.deductionPeriodPhilhealth.key === 'FIRST_PERIOD' || timekeepingData.summary.deductionPeriodPhilhealth.key === 'LAST_PERIOD'"
              description="Current"
              :amount="timekeepingData.summary.contributions.philhealthAmountBasisCurrent"
              :indention="2"
            />

            <summary-group
              v-if="timekeepingData.summary.deductionPeriodPhilhealth.key === 'FIRST_PERIOD' || timekeepingData.summary.deductionPeriodPhilhealth.key === 'LAST_PERIOD'"
              description="Previous"
              :amount="timekeepingData.summary.contributions.philhealthAmountBasisPrevious"
              :indention="2"
            />

            <summary-group
              description="Maximum Contribution"
              :amount="timekeepingData.summary.contributions.philhealthBreakdown.maximumContribution"
              :indention="1"
            />

            <summary-group
              description="Minimum Contribution"
              :amount="timekeepingData.summary.contributions.philhealthBreakdown.minimumContribution"
              :indention="1"
            />

            <summary-group
              description="Employee Share"
              :amount="timekeepingData.summary.contributions.philhealthBreakdown.employeeShare"
              :indention="1"
            />

            <summary-group
              description="Employer Share"
              :amount="timekeepingData.summary.contributions.philhealthBreakdown.employerShare"
              :indention="1"
            />

            <!-- Pagibig Computation Basis -->
            <summary-group
              class="q-mt-sm text-bold"
              description="Pagibig Computation"
              :indention="0"
            />

            <summary-group
              description="Percentage"
              :amount="timekeepingData.summary.contributions.pagibigBreakdown.percentage.formatPercentage"
              :indention="1"
            />

            <summary-group
              description="Amount Basis"
              :amount="timekeepingData.summary.contributions.pagibigAmountBasis"
              :indention="1"
            />

            <summary-group
              description="Employee Share"
              :indention="1"
            />

            <summary-group
              description="Minimum"
              :amount="timekeepingData.summary.contributions.pagibigBreakdown.employee.minimum"
              :indention="2"
            />

            <summary-group
              description="Minimum Percentage"
              :amount="timekeepingData.summary.contributions.pagibigBreakdown.employee.minimumPercentage.formatPercentage"
              :indention="2"
            />
            <summary-group
              description="Maximum"
              :amount="timekeepingData.summary.contributions.pagibigBreakdown.employee.maximum"
              :indention="2"
            />
            <summary-group
              description="Contribution"
              :amount="timekeepingData.summary.contributions.pagibigBreakdown.employee.contribution"
              :indention="2"
            />

            <summary-group
              description="Employer Share"
              :indention="1"
            />

            <summary-group
              description="Maximum"
              :amount="timekeepingData.summary.contributions.pagibigBreakdown.employer.maximum"
              :indention="2"
            />
            <summary-group
              description="Contribution"
              :amount="timekeepingData.summary.contributions.pagibigBreakdown.employer.contribution"
              :indention="2"
            />

            <!-- Tax Computation Basis -->
            <summary-group
              class="q-mt-sm text-bold"
              description="Tax Computation"
              :indention="0"
            />
            <summary-group
              description="Taxable Income Basis"
              :amount="timekeepingData.summary.taxComputationBreakdown.taxableIncome"
              :indention="1"
            />

            <summary-group
              v-if="timekeepingData.summary.deductionPeriodWitholdingTax.key === 'FIRST_PERIOD' || timekeepingData.summary.deductionPeriodWitholdingTax.key === 'LAST_PERIOD'"
              description="Current"
              :amount="timekeepingData.summary.taxComputationBreakdown.taxableIncomeCurrent"
              :indention="2"
            />

            <summary-group
              v-if="timekeepingData.summary.deductionPeriodWitholdingTax.key === 'FIRST_PERIOD' || timekeepingData.summary.deductionPeriodWitholdingTax.key === 'LAST_PERIOD'"
              description="Previous"
              :amount="timekeepingData.summary.taxComputationBreakdown.taxableIncomePrevious"
              :indention="2"
            />


            <summary-group
              description="Taxable Offset"
              :amount="timekeepingData.summary.taxComputationBreakdown.taxOffset"
              :indention="1"
            />

            <summary-group
              description="Percentage"
              :amount="timekeepingData.summary.taxComputationBreakdown.taxPercentage.formatPercentage"
              :indention="1"
            />

            <summary-group
              description="Fixed Amount"
              :amount="timekeepingData.summary.taxComputationBreakdown.taxFixedAmount"
              :indention="1"
            />

            <summary-group
              description="By Offset Percentage"
              :amount="timekeepingData.summary.taxComputationBreakdown.taxByPercentage"
              :indention="1"
            />


            <summary-group
              description="Total"
              :amount="timekeepingData.summary.taxComputationBreakdown.taxTotal"
              :indention="1"
            />

          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped src="./PayrollSalaryComputation.scss"></style>

<script lang="ts">
import { PayrollProcessingResponse } from "@shared/response";
import SummaryGroup from './SummaryGroup/SummaryGroup.vue';

export default {
  name: 'PayrollSalaryComputationBasis',
  components: {
    SummaryGroup,
  },
  props: {
    timekeepingData: {
      type: Object as () => PayrollProcessingResponse,
      default: null,
    },
  },
};
</script>
