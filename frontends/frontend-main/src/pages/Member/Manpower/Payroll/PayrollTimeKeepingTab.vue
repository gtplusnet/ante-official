<template>
  <div>
    <div class="text-right q-mb-sm" v-if="!readonly">
      <q-btn @click="copyURL" color="primary q-mr-sm text-label-large" dense flat>
        <q-icon size="16px" class="q-mb-xs" name="content_copy" />
        <span class="q-ml-xs text-label-large">Copy URL</span>
      </q-btn>
      <q-btn @click="recomputeAll" color="primary" dense flat class="text-label-large">
        <q-icon size="16px" class="q-mb-xs" name="refresh" />
        <span class="q-ml-xs text-label-large">Recompute All</span>
      </q-btn>
    </div>
    <div class="table-wrapper">
      <table class="global-table">
        <thead class="text-label-medium">
          <tr>
            <th width="90px" rowspan="2">Date</th>
            <th width="50px" rowspan="2">Day</th>
            <th width="80px" rowspan="2">Time In</th>
            <th width="80px" rowspan="2">Time Out</th>
            <th width="90px" rowspan="2">Shift Type</th>
            <th rowspan="2">Work Hours</th>
            <th rowspan="2">Break Hours</th>
            <th rowspan="2">Late</th>
            <th rowspan="2">UT <q-tooltip>Undertime</q-tooltip></th>
            <th rowspan="2">ND <q-tooltip>Night Differential</q-tooltip></th>
            <th colspan="3">Overtime</th>
            <th colspan="3">Night Differential Overtime</th>
            <th width="30px" rowspan="2">A <q-tooltip>Absent</q-tooltip></th>
            <th width="30px" rowspan="2">P <q-tooltip>Present</q-tooltip></th>
            <th width="40px" rowspan="2">H <q-tooltip>Holiday</q-tooltip></th>
            <th rowspan="2">Total Credited Hours</th>
          </tr>
          <tr>
            <th class="text-center">
              C
              <q-tooltip>Computed based on raw logs</q-tooltip>
            </th>
            <th class="text-center">
              FA
              <q-tooltip>For Approval</q-tooltip>
            </th>
            <th class="text-center">
              APP
              <q-tooltip>Approved</q-tooltip>
            </th>
            <th class="text-center">
              C
              <q-tooltip>Computed based on raw logs</q-tooltip>
            </th>
            <th class="text-center">
              FA
              <q-tooltip>For Approval</q-tooltip>
            </th>
            <th class="text-center">
              APP
              <q-tooltip>Approved</q-tooltip>
            </th>
          </tr>
        </thead>
        <tbody
          class="total text-body-small"
          :class="employeeTimekeepingStore.isListLoaded ? 'loaded' : 'loading'"
          v-if="
            employeeTimekeepingStore &&
            employeeTimekeepingStore.total &&
            employeeTimekeepingStore.total.timekeepingTotal
          "
        >
          <tr>
            <td colspan="5">Total</td>
            <td>
              <time-view
                :time="employeeTimekeepingStore.total.timekeepingTotal.workTime"
              ></time-view>
            </td>
            <td>
              <time-view
                :time="employeeTimekeepingStore.total.timekeepingTotal.breakTime"
              ></time-view>
            </td>
            <td>
              <time-view :time="employeeTimekeepingStore.total.timekeepingTotal.late"></time-view>
            </td>
            <td>
              <time-view
                :time="employeeTimekeepingStore.total.timekeepingTotal.undertime"
              ></time-view>
            </td>
            <td>
              <time-view
                :time="employeeTimekeepingStore.total.timekeepingTotal.nightDifferential"
              ></time-view>
            </td>
            <td>
              <time-view
                :time="employeeTimekeepingStore.total.timekeepingTotal.overtime"
              ></time-view>
            </td>
            <td>
              <time-view
                :time="employeeTimekeepingStore.total.timekeepingTotal.overtimeForApproval"
              ></time-view>
            </td>
            <td>
              <time-view
                :time="employeeTimekeepingStore.total.timekeepingTotal.overtimeApproved"
              ></time-view>
            </td>
            <td>
              <time-view
                :time="employeeTimekeepingStore.total.timekeepingTotal.nightDifferentialOvertime"
              ></time-view>
            </td>
            <td>
              <time-view
                :time="
                  employeeTimekeepingStore.total.timekeepingTotal
                    .nightDifferentialOvertimeForApproval
                "
              ></time-view>
            </td>
            <td>
              <time-view
                :time="
                  employeeTimekeepingStore.total.timekeepingTotal.nightDifferentialOvertimeApproved
                "
              ></time-view>
            </td>
            <td class="icon-cell">
              {{ employeeTimekeepingStore.total.timekeepingTotal.absentCount }}
            </td>
            <td class="icon-cell">
              {{ employeeTimekeepingStore.total.timekeepingTotal.presentDayCount }}
            </td>
            <td class="icon-cell">
              {{ employeeTimekeepingStore.total.timekeepingTotal.totalHolidayCount }}
            </td>
            <td>
              <time-view
                :time="employeeTimekeepingStore.total.timekeepingTotal.totalCreditedHours"
              ></time-view>
            </td>
          </tr>
        </tbody>
        <tbody
          :class="employeeTimekeepingStore.isListLoaded ? 'loaded' : 'loading'"
          v-if="employeeTimekeepingStore.list.length > 0"
        >
          <!-- time keeping total loading -->
          <template v-if="employeeTimekeepingStore.list.length == 0">
            <tr>
              <td colspan="12" class="text-center">
                <q-spinner-dots size="30px" color="gray" />
              </td>
            </tr>
          </template>

          <!-- time keeping total -->
          <template v-else>
            <tr
              v-for="data in employeeTimekeepingStore.list"
              :key="data.dateFormatted.date"
              @click="eventClickEmployeeTimekeeping(data)"
              :class="{ 'on-leave': data.dayDetails?.hasApprovedLeave }"
            >
              <q-menu v-if="!readonly" touch-position context-menu auto-close dense>
                <q-list dense>
                  <q-item @click="recompute(data)" clickable v-close-popup>
                    <q-item-section thumbnail>
                      <q-icon class="q-ml-md" name="refresh"
                    /></q-item-section>
                    <q-item-section>Recompute</q-item-section>
                  </q-item>
                  <q-item @click="openModifyDialog(data)" clickable v-close-popup>
                    <q-item-section thumbnail>
                      <q-icon class="q-ml-md" name="edit"
                    /></q-item-section>
                    <q-item-section>Modify Time</q-item-section>
                  </q-item>
                  <q-item @click="openShiftAdjustmentDialog(data)" clickable v-close-popup>
                    <q-item-section thumbnail>
                      <q-icon class="q-ml-md" name="schedule"
                    /></q-item-section>
                    <q-item-section>Adjust Shift</q-item-section>
                  </q-item>
                  <template v-if="data.activeShift.shiftType.key == 'REST_DAY'">
                    <q-item
                      v-if="data.dayDetails.isDayApproved"
                      @click="approveDay(data)"
                      clickable
                      v-close-popup
                    >
                      <q-item-section thumbnail>
                        <q-icon class="q-ml-md" name="close"
                      /></q-item-section>
                      <q-item-section>Disable Day</q-item-section>
                    </q-item>
                    <q-item
                      v-if="!data.dayDetails.isDayApproved"
                      @click="approveDay(data)"
                      clickable
                      v-close-popup
                    >
                      <q-item-section thumbnail>
                        <q-icon class="q-ml-md" name="check"
                      /></q-item-section>
                      <q-item-section>Enable Day</q-item-section>
                    </q-item>
                  </template>
                  <template v-if="data.timekeepingSummary.totalHolidayCount > 0">
                    <q-item @click="toggleHolidayEligibility(data)" clickable v-close-popup>
                      <q-item-section thumbnail>
                        <q-icon
                          class="q-ml-md"
                          :name="
                            data.dayDetails.isEligibleHolidayOverride === null ? 'edit' : 'refresh'
                          "
                        />
                      </q-item-section>
                      <q-item-section>
                        <template v-if="data.dayDetails.isEligibleHolidayOverride === null">
                          Override Holiday Eligibility (Currently
                          {{ data.dayDetails.isEligibleHoliday ? 'Eligible' : 'Not Eligible' }})
                        </template>
                        <template v-else>
                          Reset to Automatic (Currently
                          {{
                            data.dayDetails.isEligibleHolidayOverride
                              ? 'Manually Enabled'
                              : 'Manually Disabled'
                          }})
                        </template>
                      </q-item-section>
                    </q-item>
                  </template>
                </q-list>
              </q-menu>
              <td>{{ data.dateFormatted.date }}</td>
              <td>{{ data.dateFormatted.daySmall }}</td>
              <td>{{ data.dayDetails?.hasApprovedLeave ? 'ON LEAVE' : data.timeIn }}</td>
              <td>{{ data.dayDetails?.hasApprovedLeave ? 'ON LEAVE' : data.timeOut }}</td>
              <td>
                <span v-if="data.dayDetails?.hasApprovedLeave" class="leave-badge">
                  <q-icon name="event_busy" size="18px" />
                  <span class="q-ml-xs">LEAVE</span>
                  <q-tooltip>
                    <div>On Approved Leave</div>
                    <div v-if="data.dayDetails.leaveType">
                      Type: {{ data.dayDetails.leaveType }}
                    </div>
                    <div v-if="data.dayDetails.leaveCompensationType">
                      {{
                        data.dayDetails.leaveCompensationType === 'WITH_PAY'
                          ? 'With Pay'
                          : 'Without Pay'
                      }}
                    </div>
                  </q-tooltip>
                </span>
                <span
                  v-else-if="!data.dayDetails.isDayForApproval"
                  @click.stop="approveDay(data)"
                  class="td-button"
                  :style="{ color: data.activeShiftType?.color || '#000000' }"
                  >{{ data.activeShift?.shiftType?.label || 'N/A' }}</span
                >
                <span v-else :style="{ color: data.activeShiftType?.color || '#000000' }">{{
                  data.activeShift?.shiftType?.label || 'N/A'
                }}</span>
              </td>
              <td>
                <time-view
                  :time="data.timekeepingComputed.worktime"
                  :isOverridden="data.isOverridden"
                  :override="data.timekeepingOverride.worktime"
                ></time-view>
              </td>
              <td><time-view :time="data.timekeepingSummary.breaktime"></time-view></td>
              <td>
                <time-view
                  :time="data.timekeepingComputed.late"
                  :isOverridden="data.isOverridden"
                  :override="data.timekeepingOverride.late"
                ></time-view>
              </td>
              <td>
                <time-view
                  :time="data.timekeepingComputed.undertime"
                  :isOverridden="data.isOverridden"
                  :override="data.timekeepingOverride.undertime"
                ></time-view>
              </td>
              <td>
                <time-view
                  :time="data.timekeepingComputed.nightDifferential"
                  :isOverridden="data.isOverridden"
                  :override="data.timekeepingOverride.nightDifferential"
                ></time-view>
              </td>
              <td><time-view :time="data.timekeepingSummary.overtime"></time-view></td>
              <td>
                <span
                  v-if="data.timekeepingSummary.overtimeForApproval?.raw > 0 && !readonly"
                  @click.stop="approveOvertime(data)"
                  class="td-button"
                >
                  <time-view
                    active-class="tex-white"
                    :time="data.timekeepingSummary.overtimeForApproval"
                  ></time-view>
                </span>
                <time-view v-else :time="data.timekeepingSummary.overtimeForApproval"></time-view>
              </td>
              <td>
                <time-view
                  :time="data.timekeepingSummary.overtimeApproved"
                  :isOverridden="data.isOverridden"
                  :override="data.timekeepingOverride.overtime"
                ></time-view>
              </td>
              <td>
                <time-view :time="data.timekeepingSummary.nightDifferentialOvertime"></time-view>
              </td>
              <td>
                <time-view
                  :time="data.timekeepingSummary.nightDifferentialOvertimeForApproval"
                ></time-view>
              </td>
              <td>
                <time-view
                  :time="data.timekeepingSummary.nightDifferentialOvertimeApproved"
                  :override="data.timekeepingOverride.nightDifferentialOvertime"
                ></time-view>
              </td>
              <td class="icon-cell">
                <q-icon
                  v-if="data.timekeepingSummary.absentReason === 'ON_LEAVE'"
                  name="event_busy"
                  size="16px"
                  color="orange"
                >
                  <q-tooltip>
                    <div>Absent (On Leave)</div>
                    <div v-if="data.dayDetails.leaveType">
                      Type: {{ data.dayDetails.leaveType }}
                    </div>
                    <div>Without Pay</div>
                  </q-tooltip>
                </q-icon>
                <q-icon
                  v-else-if="data.timekeepingSummary.absentCount > 0"
                  name="check"
                  size="16px"
                  color="negative"
                >
                  <q-tooltip>Absent</q-tooltip>
                </q-icon>
                <q-icon v-else name="close" size="16px" color="grey-5">
                  <q-tooltip>Not Absent</q-tooltip>
                </q-icon>
              </td>
              <td class="icon-cell">
                <q-icon
                  v-if="data.timekeepingSummary.presentDayCount > 0"
                  name="check"
                  size="16px"
                  color="positive"
                >
                  <q-tooltip>Present</q-tooltip>
                </q-icon>
                <q-icon v-else name="close" size="16px" color="grey-5">
                  <q-tooltip>Not Present</q-tooltip>
                </q-icon>
              </td>
              <td class="icon-cell">
                <span class="holiday-indicator-wrapper">
                  <q-icon
                    v-if="data.timekeepingSummary.totalHolidayCount > 0"
                    name="check"
                    size="16px"
                    :color="data.dayDetails.isEligibleHoliday ? 'primary' : 'negative'"
                    :class="{
                      'holiday-overridden': data.dayDetails.isEligibleHolidayOverride !== null,
                    }"
                  >
                    <q-tooltip>
                      <div v-if="data.dayDetails.isEligibleHoliday">
                        Holiday (Eligible for pay)
                        <div v-if="data.dayDetails.isEligibleHolidayOverride !== null">
                          <q-icon name="edit" size="12px" /> Manually overridden
                        </div>
                      </div>
                      <div v-else>
                        Holiday (Not eligible - absent on previous working day)
                        <div v-if="data.dayDetails.isEligibleHolidayOverride !== null">
                          <q-icon name="edit" size="12px" /> Manually overridden
                        </div>
                      </div>
                    </q-tooltip>
                  </q-icon>
                  <q-icon v-else name="close" size="16px" color="grey-5">
                    <q-tooltip>Regular Day</q-tooltip>
                  </q-icon>
                  <q-icon
                    v-if="data.dayDetails.isEligibleHolidayOverride !== null"
                    name="edit"
                    size="12px"
                    class="override-indicator"
                    :class="{
                      'override-enabled': data.dayDetails.isEligibleHolidayOverride === true,
                    }"
                  />
                </span>
              </td>
              <td><time-view :time="data.timekeepingSummary.totalCreditedHours"></time-view></td>
            </tr>
          </template>
        </tbody>
        <tbody v-else>
          <tr>
            <td colspan="12" class="text-center">
              <q-spinner-dots size="30px" color="gray" />
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Timekeeping Simulation Output Dialog -->
    <payroll-time-keeping-details-dialog
      v-if="selectedOutputData"
      v-model="isTimeKeepingSimulationOutputDialogOpen"
      :employeeAccountId="employeeAccountId"
      :cutoffDateRange="cutoffDateRange"
      :selectedOutputData="selectedOutputData"
    ></payroll-time-keeping-details-dialog>

    <!-- Timekeeping Override Dialog -->
    <payroll-timekeeping-overrride-dialog
      v-model="isTimeKeepingOverrideDialogOpen"
      @override-saved="simulationCompleted"
      v-if="selectedOutputData"
      :employeeName="employeeName"
      :employeeAccountId="employeeAccountId"
      :selectedOutputData="selectedOutputData"
    ></payroll-timekeeping-overrride-dialog>

    <!-- Shift Adjustment Dialog -->
    <payroll-shift-adjustment-dialog
      v-if="selectedOutputData"
      v-model="isShiftAdjustmentDialogOpen"
      @shift-adjusted="simulationCompleted"
      :employeeName="employeeName"
      :employeeAccountId="employeeAccountId"
      :selectedOutputData="selectedOutputData"
      :shiftOptions="shiftOptions"
    ></payroll-shift-adjustment-dialog>
  </div>
</template>

<style scoped lang="scss">
.dialog-card {
  max-width: 1300px;
  min-height: calc(100vh - 100px);
}

.table-wrapper {
  max-height: calc(100vh - 250px);
  overflow: auto;

  &::-webkit-scrollbar {
    height: 4px;
    width: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background-color: #d9d9d9;
    border-radius: 50px;
  }

  &::-webkit-scrollbar-track {
    background-color: #f4f4f4;
    border-radius: 50px;
  }

}
</style>

<style scoped lang="scss" src="./PayrollTimekeepingTab.scss"></style>

<script lang="ts">
import TimeView from '../../../../components/shared/display/TimeView.vue';
import { computed, ref, Ref, onMounted } from 'vue';
import { CutoffDateRangeResponse, TimekeepingOutputResponse } from '@shared/response';
import { useEmployeeTimekeepingStore } from '../../../../stores/employee-timekeeping.store';
import { api } from 'src/boot/axios';
import { useQuasar } from 'quasar';
import { handleAxiosError } from '../../../../utility/axios.error.handler';
import PayrollTimeKeepingDetailsDialog from './PayrollTimeKeepingDetailsDialog.vue';
import PayrollTimekeepingOverrrideDialog from './PayrollTimekeepingOverrrideDialog.vue';
import PayrollShiftAdjustmentDialog from './PayrollShiftAdjustmentDialog.vue';
import bus from 'src/bus';

export default {
  name: 'PayrollTimeKeepingTab',
  components: {
    TimeView,
    PayrollTimeKeepingDetailsDialog,
    PayrollTimekeepingOverrrideDialog,
    PayrollShiftAdjustmentDialog,
  },
  props: {
    readonly: {
      type: Boolean,
      default: false,
    },
    employeeName: {
      type: String,
      required: true,
    },
    employeeAccountId: {
      type: String,
      required: true,
    },
    cutoffDateRange: {
      type: Object as () => CutoffDateRangeResponse,
      required: true,
    },
  },
  emits: ['simulation-completed'],
  setup(props, { emit }) {
    const $q = useQuasar();
    const recomputeKey = ref(0);
    const isRecomputeAll = ref(false);
    const employeeTimekeepingStore = useEmployeeTimekeepingStore();
    const employeeAccountId = computed(() => props.employeeAccountId);
    const cutoffDateRange = computed(() => props.cutoffDateRange);
    const selectedOutputData: Ref<TimekeepingOutputResponse | null> = ref(null);
    const isTimeKeepingSimulationOutputDialogOpen: Ref<boolean> = ref(false);
    const isTimeKeepingOverrideDialogOpen: Ref<boolean> = ref(false);
    const isShiftAdjustmentDialogOpen: Ref<boolean> = ref(false);
    const tab = ref('timekeeping');
    const shiftOptions = ref([]);
    const shiftsLoading = ref(false);

    const initialize = () => {
      tab.value = 'timekeeping';
      loadEmployeeTimekeeping();
    };

    const copyURL = () => {
      navigator.clipboard.writeText(
        `${window.location.origin}/preview/timekeeping?employeeAccountId=${employeeAccountId.value}&cutoffDateRange=${cutoffDateRange.value.key}`
      );

      $q.notify({
        message: 'URL copied to clipboard',
        color: 'primary',
        icon: 'content_copy',
      });
    };

    const recomputeAll = () => {
      recomputeKey.value = 0;
      isRecomputeAll.value = true;
      recompute(employeeTimekeepingStore.list[recomputeKey.value]);
    };

    const recompute = (data: TimekeepingOutputResponse) => {
      $q.loading.show({
        message: `Recomputing timekeeping (${data.dateFormatted.date})`,
      });

      api
        .post('hris/timekeeping/recompute', {
          employeeAccountId: employeeAccountId.value,
          date: data.dateFormatted.dateStandard,
        })
        .then(() => {
          // If recompute all is true, increment the key and recompute the next item
          if (isRecomputeAll.value) {
            recomputeKey.value++;
            if (recomputeKey.value < employeeTimekeepingStore.list.length) {
              recompute(employeeTimekeepingStore.list[recomputeKey.value]);
            } else {
              isRecomputeAll.value = false;
              loadEmployeeTimekeeping();
              emit('simulation-completed');
            }
          } else {
            loadEmployeeTimekeeping();
            emit('simulation-completed');
          }
        })
        .catch((error) => {
          console.error('Error recomputing timekeeping:', error);
        })
        .finally(() => {
          if (!isRecomputeAll.value) {
            $q.loading.hide();
          }
        });
    };

    const loadEmployeeTimekeeping = async () => {
      employeeTimekeepingStore.startLoading();
      employeeTimekeepingStore.setParams({
        cutoffDateRange: cutoffDateRange.value.key,
        employeeAccountId: employeeAccountId.value,
      });

      await employeeTimekeepingStore.requestData();
    };

    const eventClickEmployeeTimekeeping = (data: TimekeepingOutputResponse) => {
      selectedOutputData.value = data;
      isTimeKeepingSimulationOutputDialogOpen.value = true;
    };

    const openModifyDialog = (data: TimekeepingOutputResponse) => {
      selectedOutputData.value = data;
      isTimeKeepingOverrideDialogOpen.value = true;
    };

    const openShiftAdjustmentDialog = (data: TimekeepingOutputResponse) => {
      selectedOutputData.value = data;
      isShiftAdjustmentDialogOpen.value = true;
    };

    const fetchShifts = async () => {
      try {
        shiftsLoading.value = true;
        const response = await api.get('/hris/employee/scheduling-shifts');
        if (response.data) {
          shiftOptions.value = response.data;
        }
      } catch (error: any) {
        console.error('Error fetching shifts:', error);
        handleAxiosError($q, error);
        shiftOptions.value = [];
      } finally {
        shiftsLoading.value = false;
      }
    };

    const simulationCompleted = () => {
      emit('simulation-completed');
      loadEmployeeTimekeeping();
    };

    const approveDay = (data: TimekeepingOutputResponse) => {
      if (props.readonly) {
        return;
      }

      $q.dialog({
        title: 'Approve Day',
        message:
          'Are you sure you want to approve this day? Approving it will result in the salary being credited on this day.',
        cancel: true,
        persistent: true,
      }).onOk(() => {
        $q.loading.show();

        api
          .post('hris/timekeeping/approve-day', {
            timekeepingId: data.timekeepingId,
          })
          .then(() => {
            loadEmployeeTimekeeping();
            emit('simulation-completed');
          })
          .catch((error) => {
            handleAxiosError($q, error);
          })
          .finally(() => {
            $q.loading.hide();
          });
      });
    };

    const approveOvertime = (data: TimekeepingOutputResponse) => {
      if (props.readonly) {
        return;
      }

      const overtimeHours = (data.timekeepingSummary.overtimeForApproval?.raw).toFixed(2);

      $q.dialog({
        title: 'Approve Overtime',
        message: `Are you sure you want to approve ${overtimeHours} hours of overtime for ${data.dateFormatted.date}?`,
        cancel: true,
        persistent: true,
      }).onOk(() => {
        $q.loading.show();

        api
          .post('hris/timekeeping/approve-overtime', {
            timekeepingId: data.timekeepingId,
            date: data.dateFormatted.dateStandard,
          })
          .then(() => {
            loadEmployeeTimekeeping();
            emit('simulation-completed');

            // Emit events for TaskWidget and RequestPanelWidget
            bus.emit('filing-approved');
            bus.emit('reloadTaskList');
            bus.emit('reloadRequestPanel');
          })
          .catch((error) => {
            handleAxiosError($q, error);
          })
          .finally(() => {
            $q.loading.hide();
          });
      });
    };

    const toggleHolidayEligibility = (data: TimekeepingOutputResponse) => {
      if (props.readonly) {
        return;
      }

      const action =
        data.dayDetails.isEligibleHolidayOverride === null
          ? data.dayDetails.isEligibleHoliday
            ? 'disable'
            : 'enable'
          : 'reset';

      const message =
        data.dayDetails.isEligibleHolidayOverride === null
          ? `Are you sure you want to ${action} holiday pay for ${data.dateFormatted.date}?`
          : `Are you sure you want to reset holiday eligibility to automatic calculation for ${data.dateFormatted.date}?`;

      $q.dialog({
        title: 'Toggle Holiday Eligibility',
        message: message,
        cancel: true,
        persistent: true,
      }).onOk(() => {
        $q.loading.show();

        api
          .post('hris/timekeeping/toggle-holiday-eligibility', {
            timekeepingId: data.timekeepingId,
          })
          .then(() => {
            loadEmployeeTimekeeping();
            emit('simulation-completed');
          })
          .catch((error) => {
            handleAxiosError($q, error);
          })
          .finally(() => {
            $q.loading.hide();
          });
      });
    };

    onMounted(() => {
      initialize();
      fetchShifts();
    });

    // Debug: Log timekeeping data to check leave information
    employeeTimekeepingStore.$subscribe((mutation, state) => {
      if (state.list && state.list.length > 0) {
        console.log('Timekeeping data loaded:', state.list);
        state.list.forEach((day: any) => {
          if (day.dayDetails) {
            console.log(
              `Date: ${day.dateFormatted.date}, Has Leave: ${day.dayDetails.hasApprovedLeave}, Leave Type: ${day.dayDetails.leaveType}`
            );
          }
        });
      }
    });

    return {
      employeeTimekeepingStore,
      isTimeKeepingSimulationOutputDialogOpen,
      isTimeKeepingOverrideDialogOpen,
      isShiftAdjustmentDialogOpen,
      selectedOutputData,
      shiftOptions,
      tab,
      loadEmployeeTimekeeping,
      eventClickEmployeeTimekeeping,
      simulationCompleted,
      openModifyDialog,
      openShiftAdjustmentDialog,
      initialize,
      recomputeAll,
      recompute,
      approveDay,
      approveOvertime,
      toggleHolidayEligibility,
      copyURL,
    };
  },
};
</script>
