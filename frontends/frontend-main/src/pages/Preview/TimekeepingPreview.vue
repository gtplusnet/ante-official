<template>
  <div>
    <PayrollTimeKeepingDialog
      v-if="cutoffDateRange && isDataLoaded"
      :employeeName="employeeName"
      :employeeAccountId="employeeAccountId"
      :cutoffDateRange="cutoffDateRange"
      v-model="isEmployeeTimekeepingDialogOpen"
      :employee-timekeeping="cutoffDateRange"
    />
  </div>
</template>

<script lang="ts">
import { useRoute } from 'vue-router';
import { useQuasar } from 'quasar';
import PayrollTimeKeepingDialog from '../Member/Manpower/Payroll/PayrollTimeKeepingDialog.vue';
import { CutoffDateRangeResponse, EmployeeDataResponse } from "@shared/response";
import { Ref, ref } from 'vue';
import { api } from 'src/boot/axios';

export default {
  name: 'TimekeepingPreview',
  components: {
    PayrollTimeKeepingDialog,
  },
  setup() {
    const route = useRoute();
    const $q = useQuasar();
    const isDataLoaded: Ref<boolean> = ref(false);
    const employeeAccountId: Ref<string> = ref(route.query.employeeAccountId as string);
    const employeeData: Ref<EmployeeDataResponse | null> = ref(null);
    const employeeName: Ref<string> = ref('');
    const cutoffDateRange: Ref<CutoffDateRangeResponse | null> = ref(null);
    const isEmployeeTimekeepingDialogOpen: Ref<boolean> = ref(false);
    const cutoffDateRangeId: Ref<string> = ref(route.query.cutoffDateRange as string);

    const getInitialData = async () => {
      $q.loading.show();
      await api.get(`/hris/employee/info?accountId=${employeeAccountId.value}`).then((response) => {
        employeeData.value = response.data;
        employeeName.value = employeeData.value?.accountDetails.fullName || '';
      });

      await api.get(`/hr-configuration/cutoff/date-range?id=${cutoffDateRangeId.value}`).then((response) => {
        cutoffDateRange.value = response.data;
      });

      isDataLoaded.value = true;
      isEmployeeTimekeepingDialogOpen.value = true;
      $q.loading.hide();
    };

    getInitialData();

    return {
      employeeAccountId,
      employeeName,
      cutoffDateRange,
      isEmployeeTimekeepingDialogOpen,
      isDataLoaded,
    }
  }
};
</script>