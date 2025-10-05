<template>
  <q-dialog @before-show="initializeDialog" ref="dialog" persistent maximized>
    <q-card flat class="md3-dialog-card">
      <!-- Fixed Header -->
      <q-card-section class="md3-dialog-header">
        <div class="row items-center">
          <div class="col">
            <div class="text-h5 text-weight-regular">Payroll Timesheet</div>
            <div class="text-body2 text-grey-7 q-mt-xs">{{ selectedCutoffRange?.label || 'Loading...' }}</div>
          </div>
          <div>
            <q-btn flat round icon="close" @click="dialog?.hide()" />
          </div>
        </div>
      </q-card-section>

      <!-- Summary Info Bar -->
      <q-card-section class="md3-info-bar q-py-md">
        <div class="row items-center justify-between">
          <div class="row q-gutter-xl">
            <div>
              <div class="text-overline text-grey-7">CUT-OFF PERIOD</div>
              <div class="text-body1">{{ `${selectedCutoffRange?.startDate?.dateFull} - ${selectedCutoffRange?.endDate?.dateFull}` }}</div>
            </div>
            <div>
              <div class="text-overline text-grey-7">PROCESSING DATE</div>
              <div class="text-body1">{{ `${selectedCutoffRange?.processingDate?.dateFull}` }}</div>
            </div>
            <div>
              <div class="text-overline text-grey-7">PERIOD TYPE</div>
              <div class="text-body1">{{ selectedCutoffRange?.cutoffPeriodType?.label }}</div>
            </div>
          </div>
        </div>
      </q-card-section>

      <!-- Search and Filters Bar -->
      <q-card-section class="md3-search-bar">
        <div class="row items-center q-gutter-md">
          <!-- Search Field -->
          <div class="md3-filter-item" style="min-width: 300px;">
            <div class="md3-search-field">
              <q-icon name="search" class="md3-search-icon" />
              <input
                v-model="searchQuery"
                @input="debouncedSearch"
                type="text"
                placeholder="Search employees..."
                class="md3-search-input"
              />
              <q-btn
                v-if="searchQuery"
                @click="searchQuery = ''; handleSearch('')"
                flat
                round
                dense
                icon="close"
                class="md3-search-clear"
              />
            </div>
          </div>

          <!-- Branch Filter (only for full access users) -->
          <div class="md3-filter-item" v-if="hasFullAccess" style="min-width: 250px;">
            <CustomBranchTreeSelect
              v-model="selectedBranchIds"
              placeholder="All Branches"
              :include-children="true"
              variant="md3-filter"
              @update:model-value="handleBranchChange"
            />
          </div>

          <!-- Employment Status Filter -->
          <div class="md3-filter-item">
            <div class="md3-filter-field">
              <q-icon name="work" class="md3-filter-icon" />
              <q-select
                v-model="selectedEmploymentStatus"
                :options="employmentStatusOptions"
                placeholder="All Status"
                dense
                borderless
                emit-value
                map-options
                options-dense
                @update:model-value="handleFilterChange"
                class="md3-filter-select"
              >
                <template v-slot:no-option>
                  <q-item>
                    <q-item-section class="text-grey">
                      No status found
                    </q-item-section>
                  </q-item>
                </template>
              </q-select>
            </div>
          </div>

          <!-- Department Filter -->
          <div class="md3-filter-item">
            <div class="md3-filter-field">
              <q-icon name="group_work" class="md3-filter-icon" />
              <q-select
                v-model="selectedDepartment"
                :options="departmentOptions"
                placeholder="All Departments"
                dense
                borderless
                emit-value
                map-options
                options-dense
                @update:model-value="onDepartmentChange"
                class="md3-filter-select"
              >
                <template v-slot:no-option>
                  <q-item>
                    <q-item-section class="text-grey">
                      No departments found
                    </q-item-section>
                  </q-item>
                </template>
              </q-select>
            </div>
          </div>

          <!-- Role Filter (only shown when department is selected) -->
          <div class="md3-filter-item" v-if="selectedDepartment">
            <div class="md3-filter-field">
              <q-icon name="badge" class="md3-filter-icon" />
              <q-select
                v-model="selectedRole"
                :options="roleOptions"
                placeholder="All Roles"
                dense
                borderless
                emit-value
                map-options
                options-dense
                @update:model-value="handleFilterChange"
                class="md3-filter-select"
              >
                <template v-slot:no-option>
                  <q-item>
                    <q-item-section class="text-grey">
                      No roles found
                    </q-item-section>
                  </q-item>
                </template>
              </q-select>
            </div>
          </div>
        </div>
      </q-card-section>

      <!-- Scrollable Content -->
      <q-card-section class="md3-dialog-content q-pa-0">
        <div class="table-container">
          <!-- Empty State - Outside Table -->
          <div v-if="!isLoading && timekeepingData.length === 0" class="empty-state-container">
            <div class="empty-state">
              <q-icon name="o_description" />
              <div class="empty-title">No Timesheet Data</div>
              <div class="empty-subtitle">No employee timekeeping records found for this cutoff period</div>
            </div>
          </div>

          <!-- Table - Only shown when there's data or loading -->
          <div v-if="isLoading || timekeepingData.length > 0" class="scrollable-table-wrapper" ref="tableWrapper">
            <table class="payroll-timesheet-table">
              <thead>
                <tr>
                  <th width="220px">Employee Name</th>
                  <th width="110px">Employee Code</th>
                  <th width="60px">Ref.</th>
                  <th width="100px">Attendance</th>
                  <th width="90px">Leave</th>
                  <th width="90px">Work</th>
                  <th width="90px">Break</th>
                  <th width="70px">Late</th>
                  <th width="90px">Undertime</th>
                  <th width="70px">ND</th>
                  <th width="100px">OT</th>
                  <th width="110px">OT Approval</th>
                  <th width="100px">OT Approved</th>
                  <th width="100px">ND OT</th>
                  <th width="110px">ND OT Approval</th>
                  <th width="100px">ND OT Approved</th>
                  <th width="120px">Total Hours</th>
                </tr>
              </thead>
              <tbody v-if="isLoading" class="loading">
                <tr v-for="n in 20" :key="`skeleton-${n}`" class="skeleton-row">
                  <td><q-skeleton type="text" width="180px" /></td>
                  <td><q-skeleton type="text" width="100px" /></td>
                  <td><q-skeleton type="text" width="40px" /></td>
                  <td><q-skeleton type="text" width="80px" /></td>
                  <td><q-skeleton type="text" width="80px" /></td>
                  <td><q-skeleton type="text" width="80px" /></td>
                  <td><q-skeleton type="text" width="80px" /></td>
                  <td><q-skeleton type="text" width="60px" /></td>
                  <td><q-skeleton type="text" width="60px" /></td>
                  <td><q-skeleton type="text" width="60px" /></td>
                  <td><q-skeleton type="text" width="60px" /></td>
                  <td><q-skeleton type="text" width="60px" /></td>
                  <td><q-skeleton type="text" width="60px" /></td>
                  <td><q-skeleton type="text" width="60px" /></td>
                  <td><q-skeleton type="text" width="60px" /></td>
                  <td><q-skeleton type="text" width="60px" /></td>
                  <td></td>
                </tr>
              </tbody>
              <tbody v-if="!isLoading && timekeepingData.length > 0">
                <template v-for="data in timekeepingData" :key="data.employeeAccountInformation.accountId">
                    <tr v-if="data.timekeepingTotal.workDayCount" @click="openEmployeeTimekeepingInformation(data)" class="clickable-row">
                      <td class="employee-name" @click.stop="openEmployeeInformationDialog(data)">
                        {{ data.employeeAccountInformation.fullName }}
                      </td>
                      <td>{{ data.employeeCode || '-' }}</td>
                      <td>{{ data.timekeepingCutoffId }}</td>
                      <td>
                        <div class="attendance text-label-medium" :class="getAttendanceStatus(data.timekeepingTotal.presentDayCount, data.timekeepingTotal.workDayCount)">
                          <span class="q-mr-xs">{{ data.timekeepingTotal.presentDayCount }}</span>
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
                      <td><TimeView :time="data.timekeepingTotal.workTime" :class="getTimeClass(data.timekeepingTotal.workTime)" /></td>
                      <td><TimeView :time="data.timekeepingTotal.breakTime" :class="getTimeClass(data.timekeepingTotal.breakTime)" /></td>
                      <td><TimeView :time="data.timekeepingTotal.late" :class="getTimeClass(data.timekeepingTotal.late, 'negative')" /></td>
                      <td><TimeView :time="data.timekeepingTotal.undertime" :class="getTimeClass(data.timekeepingTotal.undertime, 'negative')" /></td>
                      <td><TimeView :time="data.timekeepingTotal.nightDifferential" :class="getTimeClass(data.timekeepingTotal.nightDifferential)" /></td>
                      <td><TimeView :time="data.timekeepingTotal.overtime" :class="getTimeClass(data.timekeepingTotal.overtime, 'positive')" /></td>
                      <td><TimeView :time="data.timekeepingTotal.overtimeForApproval" :class="getTimeClass(data.timekeepingTotal.overtimeForApproval)" /></td>
                      <td><TimeView :time="data.timekeepingTotal.overtimeApproved" :class="getTimeClass(data.timekeepingTotal.overtimeApproved, 'positive')" /></td>
                      <td><TimeView :time="data.timekeepingTotal.nightDifferentialOvertime" :class="getTimeClass(data.timekeepingTotal.nightDifferentialOvertime, 'positive')" /></td>
                      <td><TimeView :time="data.timekeepingTotal.nightDifferentialOvertimeForApproval" :class="getTimeClass(data.timekeepingTotal.nightDifferentialOvertimeForApproval)" /></td>
                      <td><TimeView :time="data.timekeepingTotal.nightDifferentialOvertimeApproved" :class="getTimeClass(data.timekeepingTotal.nightDifferentialOvertimeApproved, 'positive')" /></td>
                      <td><TimeView :time="data.timekeepingTotal.totalCreditedHours" class="text-bold" /></td>
                    </tr>
                    <tr v-else @click="processEmployeeTimekeeping(data)" class="clickable-row no-data-row">
                      <td class="employee-name">{{ data.employeeAccountInformation.fullName }}</td>
                      <td>{{ data.employeeCode || '-' }}</td>
                      <td>-</td>
                      <td class="text-grey-6 text-center">No Data</td>
                      <td class="text-grey-6 text-center">-</td>
                      <td class="text-grey-6 text-center">-</td>
                      <td class="text-grey-6 text-center">-</td>
                      <td class="text-grey-6 text-center">-</td>
                      <td class="text-grey-6 text-center">-</td>
                      <td class="text-grey-6 text-center">-</td>
                      <td class="text-grey-6 text-center">-</td>
                      <td class="text-grey-6 text-center">-</td>
                      <td class="text-grey-6 text-center">-</td>
                      <td class="text-grey-6 text-center">-</td>
                      <td class="text-grey-6 text-center">-</td>
                      <td class="text-grey-6 text-center">-</td>
                      <td class="text-grey-6 text-center">Click to process</td>
                    </tr>
                </template>
              </tbody>
              <tfoot>
                <!-- Total Row -->
                <tr v-if="!isLoadingTotals && totals">
                  <td class="text-bold text-primary">Total ({{ totals.totalEmployees }} employees)</td>
                  <td colspan="2"></td>
                  <td class="text-center">
                    <div class="attendance text-label-medium">
                      <span>{{ totals.totalPresentDays }}</span>
                      <span>of</span>
                      <span>{{ totals.totalWorkDays }}</span>
                    </div>
                  </td>
                  <td class="text-center">
                    <div v-if="totals.totalApprovedLeaves > 0" class="leave-info">
                      <q-icon name="event_busy" size="20px" color="info" />
                      <span class="q-ml-xs">{{ totals.totalApprovedLeaves }}</span>
                    </div>
                    <div v-else class="text-grey-6">-</div>
                  </td>
                  <td class="text-center"><TimeView v-if="totals.totalWorkTime" :time="totals.totalWorkTime" :class="getTimeClass(totals.totalWorkTime)" /><span v-else class="text-grey-6">-</span></td>
                  <td class="text-center"><TimeView v-if="totals.totalBreakTime" :time="totals.totalBreakTime" :class="getTimeClass(totals.totalBreakTime)" /><span v-else class="text-grey-6">-</span></td>
                  <td class="text-center"><TimeView v-if="totals.totalLate" :time="totals.totalLate" :class="getTimeClass(totals.totalLate, 'negative')" /><span v-else class="text-grey-6">-</span></td>
                  <td class="text-center"><TimeView v-if="totals.totalUndertime" :time="totals.totalUndertime" :class="getTimeClass(totals.totalUndertime, 'negative')" /><span v-else class="text-grey-6">-</span></td>
                  <td class="text-center"><TimeView v-if="totals.totalNightDifferential" :time="totals.totalNightDifferential" :class="getTimeClass(totals.totalNightDifferential)" /><span v-else class="text-grey-6">-</span></td>
                  <td class="text-center"><TimeView v-if="totals.totalOvertime" :time="totals.totalOvertime" :class="getTimeClass(totals.totalOvertime, 'positive')" /><span v-else class="text-grey-6">-</span></td>
                  <td class="text-center">-</td>
                  <td class="text-center"><TimeView v-if="totals.totalOvertimeApproved" :time="totals.totalOvertimeApproved" :class="getTimeClass(totals.totalOvertimeApproved, 'positive')" /><span v-else class="text-grey-6">-</span></td>
                  <td class="text-center"><TimeView v-if="totals.totalNightDifferentialOvertime" :time="totals.totalNightDifferentialOvertime" :class="getTimeClass(totals.totalNightDifferentialOvertime, 'positive')" /><span v-else class="text-grey-6">-</span></td>
                  <td class="text-center">-</td>
                  <td class="text-center"><TimeView v-if="totals.totalNightDifferentialOvertimeApproved" :time="totals.totalNightDifferentialOvertimeApproved" :class="getTimeClass(totals.totalNightDifferentialOvertimeApproved, 'positive')" /><span v-else class="text-grey-6">-</span></td>
                  <td><TimeView v-if="totals.totalCreditedHours" :time="totals.totalCreditedHours" class="text-bold" /><span v-else class="text-grey-6 text-bold">-</span></td>
                </tr>
                <!-- Total Loading Row -->
                <tr v-if="isLoadingTotals">
                  <td class="text-bold">Total (Loading...)</td>
                  <td colspan="16">
                    <q-skeleton type="text" width="100%" />
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </q-card-section>

      <!-- MD3 Pagination Bar -->
      <q-card-section class="md3-pagination-bar">
        <div class="row items-center">
          <div class="col-12 col-md-auto q-mb-sm q-mb-md-none">
            <div class="md3-pagination-info">
              <template v-if="isLoading">
                <q-skeleton type="text" width="150px" />
              </template>
              <template v-else-if="pagination && pagination.totalItems > 0">
                <span class="text-weight-medium">{{ (pagination.currentPage - 1) * pagination.itemsPerPage + 1 }}-{{ Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems) }}</span>
                <span class="text-grey-6"> of </span>
                <span class="text-weight-medium">{{ pagination.totalItems }}</span>
                <span class="text-grey-6"> employees</span>
              </template>
              <template v-else-if="pagination && pagination.totalItems === 0">
                <span class="text-grey-6">No employees found</span>
              </template>
            </div>
          </div>
          <q-space />
          <div class="col-12 col-md-auto">
            <div class="md3-pagination-controls">
              <q-btn
                @click="handlePageChange(1)"
                :disable="currentPage === 1 || isLoading"
                flat
                round
                dense
                icon="first_page"
                class="md3-pagination-btn"
              />
              <q-btn
                @click="handlePageChange(currentPage - 1)"
                :disable="currentPage === 1 || isLoading"
                flat
                round
                dense
                icon="chevron_left"
                class="md3-pagination-btn"
              />
              <div class="md3-page-numbers">
                <template v-if="!isLoading && pagination && pagination.totalPages > 0">
                  <template v-for="page in visiblePages" :key="page">
                    <span v-if="page === '...'" class="md3-page-ellipsis">...</span>
                    <q-btn
                      v-else
                      @click="handlePageChange(page as number)"
                      :flat="page !== currentPage"
                      :unelevated="page === currentPage"
                      :disable="isLoading"
                      :label="String(page)"
                      no-caps
                      :class="['md3-page-btn', { 'md3-page-btn-active': page === currentPage }]"
                    />
                  </template>
                </template>
                <template v-else-if="isLoading">
                  <q-skeleton type="QBtn" width="32px" height="32px" />
                  <q-skeleton type="QBtn" width="32px" height="32px" />
                  <q-skeleton type="QBtn" width="32px" height="32px" />
                </template>
              </div>
              <q-btn
                @click="handlePageChange(currentPage + 1)"
                :disable="!pagination || currentPage === pagination.totalPages || isLoading"
                flat
                round
                dense
                icon="chevron_right"
                class="md3-pagination-btn"
              />
              <q-btn
                @click="handlePageChange(pagination.totalPages)"
                :disable="!pagination || currentPage === pagination.totalPages || isLoading"
                flat
                round
                dense
                icon="last_page"
                class="md3-pagination-btn"
              />
            </div>
          </div>
        </div>
      </q-card-section>

      <!-- Sticky Bottom Actions -->
      <q-card-actions class="md3-dialog-actions">
        <!-- Show branch readiness status for full access users -->
        <q-btn
          v-if="hasFullAccess && branchReadinessStatus"
          flat
          @click="showBranchReadinessDetails"
          color="primary"
          no-caps
          class="md3-btn"
        >
          <q-icon size="16px" name="info" class="q-mr-xs" />
          <span>{{ branchReadinessText }}</span>
        </q-btn>

        <q-btn
          @click="processAllEmployeeTimekeping"
          color="primary"
          flat
          no-caps
          class="md3-btn"
        >
          <q-icon size="16px" name="refresh" class="q-mr-xs" />
          <span>Recompute All Employee</span>
        </q-btn>

        <q-space />

        <!-- Show different buttons based on access level -->
        <q-btn
          v-if="hasFullAccess"
          unelevated
          @click="submitForPayrollProcessing"
          color="primary"
          no-caps
          class="md3-btn"
        >
          <q-icon size="16px" name="check" class="q-mr-xs" />
          <span>Submit for Payroll Processing</span>
        </q-btn>

        <q-btn
          v-else
          unelevated
          @click="markBranchAsReady"
          color="primary"
          no-caps
          class="md3-btn"
        >
          <q-icon size="16px" name="check_circle" class="q-mr-xs" />
          <span>Branch Timekeeping Ready</span>
        </q-btn>
      </q-card-actions>

      <!-- Employee Information Dialog -->
      <EmployeeTimekeepingInformationDialog
        v-model="isEmployeeInformationDialogOpen"
        :employeeAccountId="selectedEmployeeAccountId"
      />

      <!-- Employee Timekeeping Dialog -->
      <PayrollTimekeepingDialog
        @simulation-completed="simulationCompleted"
        :employeeName="selectedEmployeeAccountName"
        :employeeAccountId="selectedEmployeeAccountId"
        :cutoffDateRange="selectedCutoffRange"
        v-model="isEmployeeTimekeepingDialogOpen"
        :employee-timekeeping="selectedCutoffRange"
      />

      <!-- Queue Dialog -->
      <QueueDialog persistent v-model="isQueueDialogOpen" :queueId="queueId" @completed="queueCompleted" />

      <!-- Branch Readiness Dialog -->
      <BranchReadinessDialog
        v-if="hasFullAccess"
        v-model="isBranchReadinessDialogOpen"
        :branchStatus="branchReadinessStatus || undefined"
        :cutoffDateRangeId="selectedCutoffRange?.key"
      />
    </q-card>
  </q-dialog>
</template>

<style src="./PayrollTimesheetDialog.scss" scoped></style>

<script lang="ts">
import { Ref, ref, computed } from 'vue';
import { defineAsyncComponent } from 'vue';
import { api } from 'src/boot/axios';
import { AxiosError } from 'axios';
import { CutoffDateRangeResponse, EmployeeTimekeepingTotal } from "@shared/response";
import { QDialog, useQuasar } from 'quasar';
import { handleAxiosError } from "../../../../../utility/axios.error.handler";
import { useTimekeepingStore } from '../../../../../stores/timekeeping.store';
import TimeView from "../../../../../components/shared/display/TimeView.vue";
import CustomBranchTreeSelect from "../../../../../components/selection/CustomBranchTreeSelect.vue";
import { useAuthStore } from '../../../../../stores/auth';
import { ScopeList } from 'src/types/prisma-enums.d';

// Lazy-loaded dialogs (ALL dialogs must be lazy loaded - CLAUDE.md)
const EmployeeTimekeepingInformationDialog = defineAsyncComponent(() =>
  import('../../Payroll/EmployeeTimekeepingInformationDialog.vue')
);
const PayrollTimekeepingDialog = defineAsyncComponent(() =>
  import('../../Payroll/PayrollTimeKeepingDialog.vue')
);
const QueueDialog = defineAsyncComponent(() =>
  import('../../../../../components/dialog/QueueDialog/QueueDialog.vue')
);
const BranchReadinessDialog = defineAsyncComponent(() =>
  import('../../Payroll/BranchReadinessDialog.vue')
);

export default {
  name: 'PayrollTimesheetDialog',
  components: {
    TimeView,
    EmployeeTimekeepingInformationDialog,
    PayrollTimekeepingDialog,
    QueueDialog,
    BranchReadinessDialog,
    CustomBranchTreeSelect,
  },
  props: {
    selectedCutoffRange: {
      type: Object as () => CutoffDateRangeResponse,
      required: true,
    },
  },
  emits: ['reload'],
  setup(props, { emit }) {
    const $q = useQuasar();
    const timekeepingStore = useTimekeepingStore();
    const authStore = useAuthStore();
    const dialog = ref<InstanceType<typeof QDialog>>();
    const tableWrapper = ref<HTMLElement | null>(null);
    const timekeepingData: Ref<EmployeeTimekeepingTotal[]> = ref([]);
    const isLoading = ref(false);
    const isLoadingTotals = ref(false);

    // Child dialog states
    const isEmployeeInformationDialogOpen = ref(false);
    const isEmployeeTimekeepingDialogOpen = ref(false);
    const isQueueDialogOpen = ref(false);
    const isBranchReadinessDialogOpen = ref(false);
    const selectedEmployeeAccountId = ref('');
    const selectedEmployeeAccountName = ref('');
    const queueId = ref('');

    // Branch readiness interface
    interface BranchStatus {
      totalBranches: number;
      readyBranches: number;
      allReady: boolean;
      branches: Array<{
        branchId: number;
        branchName: string;
        isReady: boolean;
        markedReadyBy: string | null;
        markedReadyAt: string | null;
      }>;
    }

    const branchReadinessStatus = ref<BranchStatus | null>(null);

    // Pagination and search state
    const currentPage = ref(1);
    const pageSize = ref(50);
    const searchQuery = ref('');
    const pagination = ref({
      currentPage: 1,
      totalPages: 1,
      totalItems: 0,
      itemsPerPage: 50,
      hasNext: false,
      hasPrevious: false,
    });

    // Filter state
    const selectedBranchIds = ref<(number | string)[]>([]);
    const selectedEmploymentStatus = ref<string | null>(null);
    const selectedDepartment = ref<string | null>(null);
    const selectedRole = ref<string | null>(null);

    const employmentStatusOptions = ref<{label: string, value: string | null}[]>([{ label: 'All Status', value: null }]);
    const departmentOptions = ref<{label: string, value: string | null}[]>([{ label: 'All Departments', value: null }]);
    const roleOptions = ref<{label: string, value: string | null}[]>([{ label: 'All Roles', value: null }]);

    // Permission checks
    const hasFullAccess = computed(() => {
      return authStore.accountInformation?.role?.scopeList?.includes(ScopeList.MANPOWER_TIME_KEEPING_ACCESS_ALL) || false;
    });

    const branchReadinessText = computed(() => {
      if (!branchReadinessStatus.value || !hasFullAccess.value) return '';
      const { readyBranches, totalBranches } = branchReadinessStatus.value;
      return `${readyBranches} of ${totalBranches} branches ready`;
    });

    const initializeDialog = () => {
      // Reset pagination and search state when dialog opens
      currentPage.value = 1;
      searchQuery.value = '';
      // Reset filters
      selectedBranchIds.value = [];
      selectedEmploymentStatus.value = null;
      selectedDepartment.value = null;
      selectedRole.value = null;
      // Load filter options and data
      loadFilterOptions();
      loadTimekeepingData(true);
      fetchTotals(); // Load totals separately
      if (hasFullAccess.value) {
        loadBranchReadinessStatus();
      }
    };

    const loadFilterOptions = async () => {
      try {
        // Load employment statuses - API returns { list: [...] }
        const employmentStatusResponse = await api.get('/select-box/employment-status-list');
        if (employmentStatusResponse.data && employmentStatusResponse.data.list) {
          employmentStatusOptions.value = employmentStatusResponse.data.list.map((item: any) => ({
            label: item.label,
            value: item.key === 'all' ? null : item.key
          }));
        }

        // Load departments - API returns { list: [...] }
        const departmentResponse = await api.get('/select-box/departmentList');
        if (departmentResponse.data && departmentResponse.data.list) {
          const departments = departmentResponse.data.list.map((item: any) => ({
            label: item.label,
            value: item.key
          }));
          departmentOptions.value = [{ label: 'All Departments', value: null }, ...departments];
        }

      } catch (error) {
        console.error('Error loading filter options:', error);
        if (error instanceof AxiosError) {
          handleAxiosError($q, error);
        }
      }
    };

    const loadRoleOptions = async (departmentId: string | null) => {
      if (!departmentId) {
        roleOptions.value = [{ label: 'All Roles', value: null }];
        return;
      }

      try {
        const response = await api.get('/select-box/role-list', { params: { roleGroupId: departmentId } });
        if (response.data && response.data.list) {
          const roles = response.data.list.map((item: any) => ({
            label: item.label,
            value: item.key
          }));
          roleOptions.value = [{ label: 'All Roles', value: null }, ...roles];
        }
      } catch (error) {
        console.error('Error loading role options:', error);
        roleOptions.value = [{ label: 'All Roles', value: null }];
      }
    };

    const onDepartmentChange = async (value: string | null) => {
      selectedRole.value = null; // Reset role when department changes
      await loadRoleOptions(value);
      handleFilterChange();
    };

    const loadTimekeepingData = async (resetPage = false) => {
      if (!props.selectedCutoffRange?.key) return;

      isLoading.value = true;

      // Reset to page 1 when opening dialog or when explicitly requested
      if (resetPage) {
        currentPage.value = 1;
      }

      try {
        // Load paginated data with all selected branch IDs
        await timekeepingStore.loadTimekeepingTotalPaginated(
          props.selectedCutoffRange.key,
          currentPage.value,
          pageSize.value,
          selectedBranchIds.value.length > 0 ? selectedBranchIds.value : null,
          searchQuery.value,
          selectedEmploymentStatus.value,
          selectedDepartment.value,
          selectedRole.value
        );

        // Get data from store
        timekeepingData.value = timekeepingStore.paginatedData;
        // Ensure pagination has valid values even if store returns undefined
        pagination.value = timekeepingStore.pagination || {
          currentPage: 1,
          totalPages: 1,
          totalItems: 0,
          itemsPerPage: 50,
          hasNext: false,
          hasPrevious: false,
        };

        // Scroll to top after data loads
        scrollToTop();
      } catch (error) {
        handleAxiosError($q, error as AxiosError);
      } finally {
        isLoading.value = false;
      }
    };

    const fetchTotals = async () => {
      if (!props.selectedCutoffRange?.key) return;

      isLoadingTotals.value = true;

      try {
        await timekeepingStore.loadTimekeepingTotals(
          props.selectedCutoffRange.key,
          selectedBranchIds.value.length > 0 ? selectedBranchIds.value : null,
          searchQuery.value,
          selectedEmploymentStatus.value,
          selectedDepartment.value,
          selectedRole.value
        );
      } catch (error) {
        console.error('Error fetching totals:', error);
      } finally {
        isLoadingTotals.value = false;
      }
    };

    const scrollToTop = () => {
      if (tableWrapper.value) {
        tableWrapper.value.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      }
    };

    // Employee interaction handlers
    const openEmployeeInformationDialog = (employeeTimekeepingTotal: EmployeeTimekeepingTotal) => {
      selectedEmployeeAccountId.value = employeeTimekeepingTotal.employeeAccountInformation.accountId;
      isEmployeeInformationDialogOpen.value = true;
    };

    const openEmployeeTimekeepingInformation = (employeeTimekeepingTotal: EmployeeTimekeepingTotal) => {
      selectedEmployeeAccountId.value = employeeTimekeepingTotal.employeeAccountInformation.accountId;
      selectedEmployeeAccountName.value = employeeTimekeepingTotal.employeeAccountInformation.fullName;
      isEmployeeTimekeepingDialogOpen.value = true;
    };

    const processEmployeeTimekeeping = (data: EmployeeTimekeepingTotal) => {
      const loadingMessage = `Processing Employee Timekeeping ${data.employeeAccountInformation.fullName}`;

      $q.loading.show({
        message: loadingMessage,
      });

      api
        .post('hris/timekeeping/recompute-cutoff', {
          employeeAccountId: data.employeeAccountInformation.accountId,
          cutoffDateRangeId: props.selectedCutoffRange.key,
        })
        .finally(() => {
          $q.loading.hide();
          simulationCompleted();
        })
        .catch((error) => {
          $q.loading.hide();
          $q.notify({
            type: 'negative',
            message: error.response.data.message,
          });
        });
    };

    const simulationCompleted = () => {
      loadTimekeepingData();
      fetchTotals(); // Also reload totals when data changes
      emit('reload');
    };

    const queueCompleted = () => {
      isQueueDialogOpen.value = false;
      simulationCompleted();
    };

    // Pagination handlers
    const handlePageChange = (page: number) => {
      currentPage.value = page;
      loadTimekeepingData();
      // Note: Totals don't need to reload on page change as they represent all data, not just current page
    };

    // Search and filter handlers
    const handleSearch = (query: string | number | null) => {
      searchQuery.value = query ? String(query) : '';
      currentPage.value = 1; // Reset to first page when searching
      loadTimekeepingData();
      fetchTotals(); // Update totals when search changes
    };

    const handleFilterChange = () => {
      currentPage.value = 1; // Reset to first page when filters change
      loadTimekeepingData();
      fetchTotals(); // Update totals when filters change
    };

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const handleBranchChange = (_branchIds: (number | string)[]) => {
      // The BranchTreeSelect now always returns an array of IDs
      // When a parent is selected, it includes all child IDs automatically
      // TODO: Update backend to support filtering by multiple branch IDs
      // Currently using only the first ID, but the component is ready
      // for when the backend can handle multiple IDs
      handleFilterChange();
    };

    // Debounced search function
    let searchTimeout: NodeJS.Timeout;
    const debouncedSearch = () => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        handleSearch(searchQuery.value);
      }, 300);
    };

    // Helper functions
    const getAttendanceStatus = (presentDayCount: number, workDayCount: number) => {
      if (presentDayCount === 0) {
        return 'absent';
      } else if (presentDayCount < workDayCount) {
        return 'partial';
      } else {
        return 'present';
      }
    };

    const getTimeClass = (time: any, type?: 'positive' | 'negative') => {
      const classes = ['time-view'];

      if (!time || time.raw === 0) {
        classes.push('zero-time');
      } else if (type === 'negative' && time.raw > 0) {
        classes.push('negative-time');
      } else if (type === 'positive' && time.raw > 0) {
        classes.push('positive-time');
      }

      return classes.join(' ');
    };

    // Computed property for totals
    const totals = computed(() => timekeepingStore.timekeepingTotals);

    // Computed property for visible page numbers
    const visiblePages = computed(() => {
      const pages: (number | string)[] = [];
      const total = pagination.value?.totalPages || 1;
      const current = currentPage.value;

      if (total <= 7) {
        // Show all pages if 7 or less
        for (let i = 1; i <= total; i++) {
          pages.push(i);
        }
      } else {
        // Always show first page
        pages.push(1);

        if (current > 3) {
          pages.push('...');
        }

        // Show pages around current
        let start = Math.max(2, current - 1);
        let end = Math.min(total - 1, current + 1);

        if (current <= 3) {
          end = 5;
        }
        if (current >= total - 2) {
          start = total - 4;
        }

        for (let i = start; i <= end; i++) {
          pages.push(i);
        }

        if (current < total - 2) {
          pages.push('...');
        }

        // Always show last page
        pages.push(total);
      }

      return pages;
    });

    // Footer action methods
    const processAllEmployeeTimekeping = () => {
      $q.dialog({
        title: 'Recompute All Employee Timekeeping',
        message: 'Are you sure you want to recompute all employee timekeeping?',
        ok: true,
        cancel: true,
      }).onOk(async () => {
        $q.loading.show({
          message: 'Recomputing All Employee Timekeeping',
        });
        await api
          .post('hris/timekeeping/recompute-all-timekeeping', {
            cutoffDateRangeId: props.selectedCutoffRange.key,
          })
          .catch((error) => {
            $q.notify({
              type: 'negative',
              message: error.response.data.message,
            });
          })
          .then((response) => {
            isQueueDialogOpen.value = true;
            queueId.value = response?.data?.queueId || '';
          })
          .finally(() => {
            $q.loading.hide();
          });
      });
    };

    const submitForPayrollProcessing = () => {
      $q.dialog({
        title: 'Submit for Payroll Processing',
        message: 'Are you sure you want to submit for payroll processing? This will trigger the payroll processing queue.',
        ok: true,
        cancel: true,
      }).onOk(() => {
        callAPISubmitForPayrollProcessing();
      });
    };

    const callAPISubmitForPayrollProcessing = () => {
      $q.loading.show({
        message: 'Submitting for Payroll Processing',
      });

      api
        .post('hris/timekeeping/submit-for-payroll-processing', {
          cutoffDateRangeId: props.selectedCutoffRange.key,
        })
        .catch((error) => {
          $q.notify({
            type: 'negative',
            message: error.response.data.message,
          });
        })
        .finally(async () => {
          await timekeepingStore.loadTimekeepingDateRange();
          $q.loading.hide();
          // Close dialog after successful submission
          dialog.value?.hide();
        });
    };

    const markBranchAsReady = () => {
      $q.dialog({
        title: 'Mark Branch Timekeeping Ready',
        message: 'Are you sure your branch timekeeping is complete and ready for payroll processing?',
        ok: true,
        cancel: true,
      }).onOk(async () => {
        $q.loading.show({
          message: 'Marking branch as ready...',
        });

        try {
          await api.post('hris/timekeeping/mark-branch-ready', {
            cutoffDateRangeId: props.selectedCutoffRange.key,
          });

          $q.notify({
            type: 'positive',
            message: 'Branch marked as ready for payroll processing',
          });

          // Reload data
          simulationCompleted();
          if (hasFullAccess.value) {
            await loadBranchReadinessStatus();
          }
        } catch (error) {
          const err = error as { response?: { data?: { message?: string } } };
          $q.notify({
            type: 'negative',
            message: err.response?.data?.message || 'Failed to mark branch as ready',
          });
        } finally {
          $q.loading.hide();
        }
      });
    };

    const showBranchReadinessDetails = () => {
      isBranchReadinessDialogOpen.value = true;
    };

    const loadBranchReadinessStatus = async () => {
      if (!hasFullAccess.value || !props.selectedCutoffRange?.key) return;

      try {
        const response = await api.get(`hris/timekeeping/branch-status/${props.selectedCutoffRange.key}`);
        branchReadinessStatus.value = response.data;
      } catch (error) {
        console.error('Error loading branch readiness status:', error);
      }
    };

    return {
      dialog,
      tableWrapper,
      timekeepingData,
      isLoading,
      initializeDialog,
      // Child dialogs
      isEmployeeInformationDialogOpen,
      isEmployeeTimekeepingDialogOpen,
      isQueueDialogOpen,
      isBranchReadinessDialogOpen,
      selectedEmployeeAccountId,
      selectedEmployeeAccountName,
      queueId,
      // Employee interactions
      openEmployeeInformationDialog,
      openEmployeeTimekeepingInformation,
      processEmployeeTimekeeping,
      simulationCompleted,
      queueCompleted,
      // Pagination and search
      currentPage,
      pageSize,
      searchQuery,
      pagination,
      handlePageChange,
      handleSearch,
      handleFilterChange,
      debouncedSearch,
      visiblePages,
      // Filters
      selectedBranchIds,
      selectedEmploymentStatus,
      selectedDepartment,
      selectedRole,
      employmentStatusOptions,
      departmentOptions,
      roleOptions,
      hasFullAccess,
      loadFilterOptions,
      loadRoleOptions,
      onDepartmentChange,
      handleBranchChange,
      // Helper functions
      getAttendanceStatus,
      getTimeClass,
      // Totals
      totals,
      isLoadingTotals,
      fetchTotals,
      // Footer actions
      processAllEmployeeTimekeping,
      submitForPayrollProcessing,
      markBranchAsReady,
      showBranchReadinessDetails,
      branchReadinessStatus,
      branchReadinessText,
    };
  },
};
</script>
