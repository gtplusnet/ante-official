<template>
  <div class="employee-payroll-group-details">
    <table class="details-table">
      <thead class="text-title-small">
        <tr>
          <th colspan="2" class="text-center">Payroll Group Details</th>
        </tr>
      </thead>
      <tbody class="text-body-small">
        <tr>
          <td>ID</td>
          <td>{{ payrollGroup.id }}</td>
        </tr>
        <tr>
          <td>Payroll Group Code</td>
          <td>{{ payrollGroup.payrollGroupCode }}</td>
        </tr>
        <tr>
          <td>Cutoff Code</td>
          <td>{{ payrollGroup.cutoff.cutoffCode }}</td>
        </tr>
        <tr>
          <td>Cutoff Type</td>
          <td>{{ payrollGroup.cutoff.cutoffType }}</td>
        </tr>
        <tr>
          <td>Day Cutoff Period</td>
          <td>{{ payrollGroup.cutoff.cutoffConfig.dayCutoffPeriod }}</td>
        </tr>
        <tr>
          <td>Release Processing Days</td>
          <td>{{ payrollGroup.cutoff.releaseProcessingDays }}</td>
        </tr>
        <tr>
          <td>Salary Rate Type</td>
          <td>{{ payrollGroup.salaryRateType.label }}</td>
        </tr>
        <tr>
          <td>Deduction Period (Withholding Tax)</td>
          <td>{{ payrollGroup.deductionPeriodWitholdingTax.label }}</td>
        </tr>
        <tr>
          <td>Deduction Period (SSS)</td>
          <td>{{ payrollGroup.deductionPeriodSSS.label }}</td>
        </tr>
        <tr>
          <td>Deduction Period (PhilHealth)</td>
          <td>{{ payrollGroup.deductionPeriodPhilhealth.label }}</td>
        </tr>
        <tr>
          <td>Deduction Period (Pag-IBIG)</td>
          <td>{{ payrollGroup.deductionPeriodPagibig.label }}</td>
        </tr>
        <tr>
          <td>Deduction Basis (PhilHealth)</td>
          <td>{{ payrollGroup.deductionBasisPhilhealth.label }}</td>
        </tr>
        <tr>
          <td>Deduction Basis (SSS)</td>
          <td>{{ payrollGroup.deductionBasisSSS.label }}</td>
        </tr>
        <tr>
          <td>Late Deduction Type</td>
          <td>{{ payrollGroup.lateDeductionType.label }}</td>
        </tr>
        <tr>
          <td>Late Deduction Custom Amount</td>
          <td>{{ payrollGroup.lateDeductionCustom.amount }}</td>
        </tr>
        <tr>
          <td>Late Deduction Time Basis</td>
          <td>{{ payrollGroup.lateDeductionCustom.timeBasis.label }}</td>
        </tr>
        <tr>
          <td>Undertime Deduction Type</td>
          <td>{{ payrollGroup.undertimeDeductionType.label }}</td>
        </tr>
        <tr>
          <td>Undertime Deduction Custom Amount</td>
          <td>{{ payrollGroup.undertimeDeductionCustom.amount }}</td>
        </tr>
        <tr>
          <td>Undertime Deduction Time Basis</td>
          <td>{{ payrollGroup.undertimeDeductionCustom.timeBasis.label }}</td>
        </tr>
        <tr>
          <td>Absent Deduction Hours</td>
          <td>{{ payrollGroup.absentDeductionHours }}</td>
        </tr>
        <tr>
          <td>Shifting Working Days Per Week</td>
          <td>{{ payrollGroup.shiftingWorkingDaysPerWeek === 0 ? 'Auto (Based on Schedule)' : payrollGroup.shiftingWorkingDaysPerWeek }}</td>
        </tr>
        <tr>
          <td>Late Grace Time (Minutes)</td>
          <td>{{ payrollGroup.lateGraceTimeMinutes }}</td>
        </tr>
        <tr>
          <td>Undertime Grace Time (Minutes)</td>
          <td>{{ payrollGroup.undertimeGraceTimeMinutes }}</td>
        </tr>
        <tr>
          <td>Overtime Grace Time (Minutes)</td>
          <td>{{ payrollGroup.overtimeGraceTimeMinutes }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped lang="scss" src="./EmployeeDetail.scss"></style>

<script>
export default {
  name: 'EmployeePayrollGroupDetails',
  props: {
    payrollGroup: {
      type: Object,
      required: true,
    },
  },
};
</script>
