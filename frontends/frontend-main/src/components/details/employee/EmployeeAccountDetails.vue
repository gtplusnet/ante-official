<template>
  <div class="employee-account-details">
    <table class="details-table">
      <thead class="text-title-small">
        <tr>
          <th colspan="2" class="text-center">Account Details</th>
        </tr>
      </thead>
      <tbody class="text-body-small">
        <tr>
          <td>Employee Code</td>
          <td>{{ accountInformation.employeeCode }}</td>
        </tr>
        <tr>
          <td>Email</td>
          <td>{{ accountInformation.accountDetails?.email }}</td>
        </tr>
        <tr>
          <td>Username</td>
          <td>{{ formatWord(accountInformation.accountDetails?.username) }}</td>
        </tr>
        <tr>
          <td>First Name</td>
          <td>
            {{ formatWord(accountInformation.accountDetails?.firstName) }}
          </td>
        </tr>
        <tr>
          <td>Last Name</td>
          <td>{{ formatWord(accountInformation.accountDetails?.lastName) }}</td>
        </tr>
        <tr>
          <td>Contact Number</td>
          <td>{{ accountInformation.accountDetails?.contactNumber }}</td>
        </tr>
        <tr>
          <td>Status</td>
          <td>
            {{ accountInformation.contractDetails.employmentStatus?.label }}
          </td>
        </tr>
        <tr>
          <td>Role</td>
          <td>
            {{ accountInformation.accountDetails?.role?.name }}
          </td>
        </tr>
        <tr>
          <td>Role Group</td>
          <td>
            {{ accountInformation.accountDetails?.role?.roleGroup?.name }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped lang="scss" src="./EmployeeDetail.scss"></style>

<script lang="ts">
import { EmployeeDataResponse } from "@shared/response";
import { formatWord } from "../../../utility/formatter";

export default {
  name: 'EmployeeAccountDetails',
  components: {},
  props: {
    accountInformation: {
      type: Object as () => EmployeeDataResponse,
      required: true,
    },
  },
  setup() {
    return {
      formatWord,
    };
  },
};
</script>
