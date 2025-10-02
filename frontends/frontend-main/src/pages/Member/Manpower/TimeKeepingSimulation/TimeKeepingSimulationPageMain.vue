<template>
  <div>
    <div class="select-employee">
      <GInput
        min="0"
        type="select-search"
        label="Choose Employee"
        null-option="Select Employee"
        api-url="select-box/employee-list"
        v-model="employeeAccountId"
      >
      </GInput>
    </div>

    <div class="employee-information q-mt-md" v-if="isLoaded">
      <q-tabs
        v-model="activeTab"
        align="center"
        shrink
        dense
        no-caps
        active-color="primary"
      >
        <q-tab name="account" label="Account Details" />
        <q-tab name="branch" label="Branch Details" />
        <q-tab name="contract" label="Contract Details" />
        <q-tab name="payroll" label="Payroll Group Details" />
        <q-tab name="schedule" label="Schedule Details" />
      </q-tabs>

      <q-tab-panels v-model="activeTab">
        <q-tab-panel name="account">
          <EmployeeAccountDetails
            :accountInformation="employeeInformation"
          ></EmployeeAccountDetails>
        </q-tab-panel>

        <q-tab-panel name="branch">
          <EmployeeBranchDetails
            :branchDetails="employeeInformation.branch"
          ></EmployeeBranchDetails>
        </q-tab-panel>

        <q-tab-panel name="contract">
          <EmployeeContractDetails
            :contractDetails="employeeInformation.contractDetails"
          ></EmployeeContractDetails>
        </q-tab-panel>

        <q-tab-panel name="payroll">
          <EmployeePayrollGroupDetails
            :payrollGroup="employeeInformation.payrollGroup"
          ></EmployeePayrollGroupDetails>
        </q-tab-panel>

        <q-tab-panel name="schedule">
          <EmployeeScheduleDetails
            :schedule="employeeInformation.schedule"
          ></EmployeeScheduleDetails>
        </q-tab-panel>
      </q-tab-panels>
    </div>
  </div>
</template>

<script lang="ts">
import { ref, watch } from 'vue';
import EmployeeAccountDetails from "../../../../components/details/employee/EmployeeAccountDetails.vue";
import EmployeeBranchDetails from "../../../../components/details/employee/EmployeeBranchDetails.vue";
import EmployeeContractDetails from "../../../../components/details/employee/EmployeeContractDetails.vue";
import EmployeePayrollGroupDetails from "../../../../components/details/employee/EmployeePayrollGroupDetails.vue";
import EmployeeScheduleDetails from "../../../../components/details/employee/EmployeeScheduleDetails.vue";
import { EmployeeDataResponse } from '@shared/response/employee.response';
import { handleAxiosError } from "../../../../utility/axios.error.handler";
import GInput from "../../../../components/shared/form/GInput.vue";
import { api } from 'src/boot/axios';
import { AccountDataResponse } from '@shared/response/account.response';
import { BranchDataResponse } from '@shared/response/branch.response';
import { ContractDataResponse } from '@shared/response/contract.response';
import { PayrollGroupDataResponse } from '@shared/response/payroll-group.response';
import { ScheduleDataResponse } from '@shared/response/schedule.response';
import { useQuasar } from 'quasar';

export default {
  components: {
    GInput,
    EmployeeAccountDetails,
    EmployeeBranchDetails,
    EmployeeContractDetails,
    EmployeePayrollGroupDetails,
    EmployeeScheduleDetails,
  },
  setup() {
    const $q = useQuasar();
    const isLoaded = ref(false);
    const employeeAccountId = ref<string | null>(null);
    const employeeInformation = ref<EmployeeDataResponse>({
      employeeCode: '-',
      accountDetails: {} as AccountDataResponse,
      branch: {} as BranchDataResponse,
      contractDetails: {} as ContractDataResponse,
      payrollGroup: {} as PayrollGroupDataResponse,
      schedule: {} as ScheduleDataResponse,
    });

    const activeTab = ref<string>('account'); // Default tab

    const getEmployeeInformation = () => {
      if (!employeeAccountId.value) return;

      api
        .get(`/hris/employee/info?accountId=${employeeAccountId.value}`)
        .then((response) => {
          isLoaded.value = true;
          employeeInformation.value = response.data;
        })
        .catch((error) => {
          handleAxiosError($q, error);
        })
        .finally(() => {
          // Handle any loading state here if needed
        });
    };

    watch(employeeAccountId, () => {
      if (employeeAccountId.value) {
        getEmployeeInformation();
      } else {
        isLoaded.value = false;
      }
    });

    return {
      employeeAccountId,
      employeeInformation,
      activeTab,
      getEmployeeInformation,
      isLoaded,
    };
  },
};
</script>

<style lang="scss" scoped>
.employee-information {
  background-color: #eee;
}
</style>
