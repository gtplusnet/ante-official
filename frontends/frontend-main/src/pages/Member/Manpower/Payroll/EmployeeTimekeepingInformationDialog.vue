<template>
  <q-dialog>
    <TemplateDialog no-padding="true">
      <template #DialogTitle>
        Employee Information
      </template>
      <template #DialogIcon>
        <q-icon name="o_star" />
      </template>
      <template #DialogContent>
        <div class="employee-information">
          <q-tabs v-model="activeTab" align="center" class="text-grey" shrink dense no-caps active-color="primary">
            <q-tab name="account" label="Account Details" />
            <q-tab name="branch" label="Branch Details" />
            <q-tab name="contract" label="Contract Details" />
            <q-tab name="payroll" label="Payroll Group Details" />
            <q-tab name="schedule" label="Schedule Details" />
          </q-tabs>
        <q-tab-panels v-model="activeTab">
          <q-tab-panel name="account">
            <EmployeeAccountDetails :accountInformation="employeeInformation" />
          </q-tab-panel>
          <q-tab-panel name="branch">
            <EmployeeBranchDetails :branchDetails="employeeInformation.branch" />
          </q-tab-panel>
          <q-tab-panel name="contract">
            <EmployeeContractDetails :contractDetails="employeeInformation.contractDetails" />
          </q-tab-panel>
          <q-tab-panel name="payroll">
            <EmployeePayrollGroupDetails :payrollGroup="employeeInformation.payrollGroup" />
          </q-tab-panel>
          <q-tab-panel name="schedule">
            <EmployeeScheduleDetails :schedule="employeeInformation.schedule" />
          </q-tab-panel>
        </q-tab-panels>
      </div>
    </template>
    </TemplateDialog>
  </q-dialog>
</template>

<style scoped lang="scss">
.employee-information {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 200px); // Adjusted height to account for dialog header and tabs
}

.q-tab-panels {
  flex: 1;
  overflow-y: auto;
}

.dialog-card {
  max-width: 1000px;
  min-height: calc(100vh - 50px);
}
</style>

<script lang="ts">
import { BranchDataResponse, ContractDataResponse, EmployeeDataResponse, PayrollGroupDataResponse, ScheduleDataResponse } from "@shared/response";
import { useQuasar } from 'quasar';
import { api } from 'src/boot/axios';
import EmployeeAccountDetails from "../../../../components/details/employee/EmployeeAccountDetails.vue";
import EmployeeBranchDetails from "../../../../components/details/employee/EmployeeBranchDetails.vue";
import EmployeeContractDetails from "../../../../components/details/employee/EmployeeContractDetails.vue";
import EmployeePayrollGroupDetails from "../../../../components/details/employee/EmployeePayrollGroupDetails.vue";
import EmployeeScheduleDetails from "../../../../components/details/employee/EmployeeScheduleDetails.vue";
import { handleAxiosError } from "../../../../utility/axios.error.handler";
import { ref, watch } from 'vue';
import { defineAsyncComponent } from 'vue';

// Lazy-loaded dialogs (ALL dialogs must be lazy loaded - CLAUDE.md)
const TemplateDialog = defineAsyncComponent(() =>
  import('src/components/dialog/TemplateDialog.vue')
);

export default {
  name: 'EmployeeTimekeepingInformationDialog',
  components: {
    EmployeeAccountDetails,
    EmployeeBranchDetails,
    EmployeeContractDetails,
    EmployeePayrollGroupDetails,
    EmployeeScheduleDetails,
    TemplateDialog,
  },
  props: {
    employeeAccountId: {
      type: String,
      required: true,
    },
  },
  setup(props) {
    const isLoaded = ref(false);
    const activeTab = ref<string>('account');
    const $q = useQuasar();
    const employeeInformation = ref<EmployeeDataResponse>({
      ...({} as EmployeeDataResponse),
      branch: {} as BranchDataResponse,
      contractDetails: {} as ContractDataResponse,
      payrollGroup: {} as PayrollGroupDataResponse,
      schedule: {} as ScheduleDataResponse,
    });

    watch(
      () => props.employeeAccountId,
      () => {
        if (props.employeeAccountId) {
          getEmployeeInformation();
        } else {
          isLoaded.value = false;
        }
      }
    );

    const getEmployeeInformation = () => {
      if (!props.employeeAccountId) return;

      api
        .get(`hris/employee/info?accountId=${props.employeeAccountId}`)
        .then((response) => {
          isLoaded.value = true;
          employeeInformation.value = response.data;
        })
        .catch((error) => {
          handleAxiosError($q, error);
        })
        .finally(() => {
          $q.loading.hide();
        });
    };

    return {
      isLoaded,
      activeTab,
      employeeInformation,
    };
  },
};
</script>
