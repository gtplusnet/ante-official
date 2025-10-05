<template>
  <div>
    <table class="global-table timekeeping-table">
      <thead class="text-title-small-f-[12px]">
        <tr>
          <th width="50px" rowspan="2">Ref.</th>
          <th rowspan="2">Employee Code</th>
          <th width="200px" rowspan="2">Employee Name</th>
          <th rowspan="2">Attendance</th>
          <th rowspan="2">Leave Days</th>
          <th rowspan="2">Work Time</th>
          <th rowspan="2">Break Time</th>
          <th rowspan="2">Late</th>
          <th rowspan="2">Undertime</th>
          <th rowspan="2">ND</th>
          <th colspan="3">Overtime</th>
          <th colspan="3">Night Differential Overtime</th>
          <th rowspan="2">Total Credited Hours</th>
        </tr>
        <tr>
          <th>Computed</th>
          <th>For Approval</th>
          <th>Approved</th>
          <th>Computed</th>
          <th>For Approval</th>
          <th>Approved</th>
        </tr>
      </thead>
      <tbody :class="isLoaded ? 'loaded' : 'loading'" class="text-body-small">
        <template v-if="rows.length === 0 && !isLoaded">
          <tr>
            <td colspan="17" class="text-center">
              <q-spinner-dots size="30px" color="gray" />
            </td>
          </tr>
        </template>
        <template v-else-if="rows.length === 0 && isLoaded">
          <tr>
            <td colspan="17" class="text-center text-grey-6">No data</td>
          </tr>
        </template>
        <template v-else>
          <template v-for="data in rows" :key="data.employeeAccountInformation.accountId">
            <tr v-if="data.timekeepingTotal.workDayCount" @click="openEmployeeTimekeepingInformation(data)">
              <td>{{ data.timekeepingCutoffId }}</td>
              <td>{{ data.employeeCode || '-' }}</td>
              <td class="clickable-code" @click.stop="openEmployeeInformationDialog(data)">
                {{ data.employeeAccountInformation.fullName }}
              </td>
              <td>
                <div class="attendance text-label-medium" :class="attendanceStatus(data.timekeepingTotal.presentDayCount, data.timekeepingTotal.workDayCount)">
                  <span class="q-mr-xs ">{{ data.timekeepingTotal.presentDayCount }}</span>
                  <span>of</span>
                  <span class="q-ml-xs">{{ data.timekeepingTotal.workDayCount }}</span>
                </div>
              </td>
              <td>
                <div v-if="data.timekeepingTotal.approvedLeaveCount > 0" class="leave-info">
                  <q-icon name="event_busy" size="20px" color="info" />
                  <span class="q-ml-xs">{{ data.timekeepingTotal.approvedLeaveCount }}</span>
                  <q-tooltip>
                    <div>Approved Leaves: {{ data.timekeepingTotal.approvedLeaveCount }}</div>
                    <div v-if="data.timekeepingTotal.leaveWithPayCount > 0">With Pay: {{ data.timekeepingTotal.leaveWithPayCount }}</div>
                    <div v-if="data.timekeepingTotal.leaveWithoutPayCount > 0">Without Pay: {{ data.timekeepingTotal.leaveWithoutPayCount }}</div>
                  </q-tooltip>
                </div>
                <div v-else class="text-grey-6">-</div>
              </td>
              <td><TimeView :time="data.timekeepingTotal.workTime" /></td>
              <td><TimeView :time="data.timekeepingTotal.breakTime" /></td>
              <td><TimeView :time="data.timekeepingTotal.late" /></td>
              <td><TimeView :time="data.timekeepingTotal.undertime" /></td>
              <td><TimeView :time="data.timekeepingTotal.nightDifferential" /></td>
              <td><TimeView :time="data.timekeepingTotal.overtime" /></td>
              <td><TimeView :time="data.timekeepingTotal.overtimeForApproval" /></td>
              <td><TimeView :time="data.timekeepingTotal.overtimeApproved" /></td>
              <td><TimeView :time="data.timekeepingTotal.nightDifferentialOvertime" /></td>
              <td><TimeView :time="data.timekeepingTotal.nightDifferentialOvertimeForApproval" /></td>
              <td><TimeView :time="data.timekeepingTotal.nightDifferentialOvertimeApproved" /></td>
              <td><TimeView :time="data.timekeepingTotal.totalCreditedHours" /></td>
            </tr>
            <tr v-else @click="processEmployeeTimekeeping(data)">
              <td>-</td>
              <td>{{ data.employeeCode || '-' }}</td>
              <td>{{ data.employeeAccountInformation.fullName }}</td>
              <td colspan="14" class="text-grey-6">No Data</td>
            </tr>
          </template>
        </template>
      </tbody>
    </table>
    <EmployeeTimekeepingInformationDialog v-model="isEmployeeInformationDialogOpen" :employeeAccountId="selectedEmployeeAccountId" />
    <PayrollTimekeepingDialog
      @simulation-completed="simulationCompleted"
      :employeeName="selectedEmployeeAccountName"
      :employeeAccountId="selectedEmployeeAccountId"
      :cutoffDateRange="selectedDateRange"
      v-model="isEmployeeTimekeepingDialogOpen"
      :employee-timekeeping="selectedDateRange"
    />
    <QueueDialog persistent v-model="isQueueDialogOpen" :queueId="queueId" @completed="queueCompleted" />
  </div>
</template>

<style scoped lang="scss" src="./ManpowerTimekeepingTable.scss"></style>

<script lang="ts">
import { ref } from 'vue';
import { defineAsyncComponent } from 'vue';
import TimeView from "../../../../../components/shared/display/TimeView.vue";
import { EmployeeTimekeepingTotal, CutoffDateRangeResponse } from "@shared/response";
import { useQuasar } from 'quasar';
import { api } from 'src/boot/axios';

// Lazy-loaded dialogs (ALL dialogs must be lazy loaded - CLAUDE.md)
const PayrollTimekeepingDialog = defineAsyncComponent(() =>
  import('../../../../../pages/Member/Manpower/Payroll/PayrollTimeKeepingDialog.vue')
);
const EmployeeTimekeepingInformationDialog = defineAsyncComponent(() =>
  import('../../../../../pages/Member/Manpower/Payroll/EmployeeTimekeepingInformationDialog.vue')
);
const QueueDialog = defineAsyncComponent(() =>
  import('../../../../../components/dialog/QueueDialog/QueueDialog.vue')
);

export default {
  name: 'TimekeepingTable',
  components: { TimeView, PayrollTimekeepingDialog, EmployeeTimekeepingInformationDialog, QueueDialog },
  props: {
    rows: {
      type: Array as () => EmployeeTimekeepingTotal[],
      required: true,
    },
    isLoaded: {
      type: Boolean,
      default: false,
    },
    selectedDateRange: {
      type: Object as () => CutoffDateRangeResponse,
      required: false,
      default: null,
    },
  },
  emits: ['reload'],
  setup(props, { emit }) {
    const isEmployeeInformationDialogOpen = ref(false);
    const isEmployeeTimekeepingDialogOpen = ref(false);
    const isQueueDialogOpen = ref(false);
    const selectedEmployeeAccountId = ref('');
    const selectedEmployeeAccountName = ref('');
    const queueId = ref('');
    const $q = useQuasar();

    const attendanceStatus = (presentDayCount: number, workDayCount: number) => {
      if (presentDayCount === 0) {
        return 'absent';
      } else if (presentDayCount < workDayCount) {
        return 'partial';
      } else {
        return 'present';
      }
    };

    const openEmployeeInformationDialog = (employeeTimekeepingTotal: EmployeeTimekeepingTotal) => {
      selectedEmployeeAccountId.value = employeeTimekeepingTotal.employeeAccountInformation.accountId;
      isEmployeeInformationDialogOpen.value = true;
    };

    const openEmployeeTimekeepingInformation = (employeeTimekeepingTotal: EmployeeTimekeepingTotal) => {
      selectedEmployeeAccountId.value = employeeTimekeepingTotal.employeeAccountInformation.accountId;
      selectedEmployeeAccountName.value = employeeTimekeepingTotal.employeeAccountInformation.fullName;
      isEmployeeTimekeepingDialogOpen.value = true;
    };

    const simulationCompleted = () => {
      emit('reload');
    };

    const processEmployeeTimekeeping = (data: EmployeeTimekeepingTotal) => {
      const loadingMessage = `Processing Employee Timekeeping ${data.employeeAccountInformation.fullName}`;

      $q.loading.show({
        message: loadingMessage,
      });

      api
        .post('hris/timekeeping/recompute-cutoff', {
          employeeAccountId: data.employeeAccountInformation.accountId,
          cutoffDateRangeId: props.selectedDateRange.key,
        })
        .finally(() => {
          $q.loading.hide();
          emit('reload');
        })
        .catch((error) => {
          $q.loading.hide();
          $q.notify({
            type: 'negative',
            message: error.response.data.message,
          });
        });
    };

    const queueCompleted = () => {
      isQueueDialogOpen.value = false;
      // Optionally emit or handle reload logic here
    };

    return {
      isEmployeeInformationDialogOpen,
      isEmployeeTimekeepingDialogOpen,
      isQueueDialogOpen,
      selectedEmployeeAccountId,
      selectedEmployeeAccountName,
      queueId,
      attendanceStatus,
      openEmployeeInformationDialog,
      openEmployeeTimekeepingInformation,
      simulationCompleted,
      processEmployeeTimekeeping,
      queueCompleted,
    };
  },
};
</script>
