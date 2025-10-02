<template>
  <div class="employee-account-details">
    <table class="details-table">
      <thead class="text-title-small">
        <tr>
          <th colspan="2" class="text-center">Branch Details</th>
        </tr>
      </thead>
      <tbody class="text-body-small">
        <tr>
          <td>Name</td>
          <td>{{ branchDetails.name }}</td>
        </tr>
        <tr>
          <td>Code</td>
          <td>{{ branchDetails.code || 'N/A' }}</td>
        </tr>
        <tr>
          <td>Status</td>
          <td>{{ branchDetails.status }}</td>
        </tr>
        <tr>
          <td>Location</td>
          <td>
            <div>
              <strong>Region:</strong> {{ branchDetails.location.region.name
              }}<br />
              <strong>Province:</strong>
              {{ branchDetails.location.province.name }}<br />
              <strong>Municipality:</strong>
              {{ branchDetails.location.municipality.name }}<br />
              <strong>Barangay:</strong>
              {{ branchDetails.location.barangay.name }}<br />
              <strong>Street:</strong>
              {{ branchDetails.location.street || 'N/A' }}<br />
              <strong>Zip Code:</strong> {{ branchDetails.location.zipCode }}
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped lang="scss" src="./EmployeeDetail.scss"></style>

<script lang="ts">
import { BranchDataResponse } from '@shared/response/branch.response';


export default {
  name: 'EmployeeBranchDetails',
  props: {
    branchDetails: {
      type: Object as () => BranchDataResponse,
      required: true,
    },
  },
};
</script>
