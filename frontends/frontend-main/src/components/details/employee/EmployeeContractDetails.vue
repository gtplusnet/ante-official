<template>
  <div class="employee-account-details">
    <table class="details-table">
      <thead class="text-title-small">
        <tr>
          <th colspan="2" class="text-center">Contract Details</th>
        </tr>
      </thead>
      <tbody class="text-body-small">
        <tr>
          <td>Monthly Rate</td>
          <td>{{ contractDetails.monthlyRate.formatCurrency }}</td>
        </tr>
        <tr>
          <td>Employment Status</td>
          <td>{{ contractDetails.employmentStatus?.label }}</td>
        </tr>
        <tr>
          <td>Start Date</td>
          <td>
            {{ contractDetails.startDate.dateFull }}
          </td>
        </tr>
        <tr>
          <td>End Date</td>
          <td>
            {{ contractDetails.endDate.dateFull }}
          </td>
        </tr>
        <tr>
          <td>Contract File</td>
          <td>
            <a v-if="contractDetails.contractFile" :href="contractDetails.contractFile?.url" target="_blank">
              {{ contractDetails.contractFile?.originalName }}
            </a>
            <span v-else>N/A</span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped lang="scss" src="./EmployeeDetail.scss"></style>

<script>
export default {
  name: 'EmployeeContractDetails',
  props: {
    contractDetails: {
      type: Object,
      required: true,
    },
  },
};
</script>
