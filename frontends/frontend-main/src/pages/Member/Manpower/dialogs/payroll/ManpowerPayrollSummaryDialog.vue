<template>
  <q-dialog @before-show="initializeDialog" ref="dialog" persistent maximized>
    <q-card flat class="md3-dialog-card">
      <!-- Fixed Header -->
      <q-card-section class="md3-dialog-header">
        <div class="row items-center">
          <div class="col">
            <div class="text-h5 text-weight-regular">Payroll Summary</div>
            <div class="text-body2 text-grey-7 q-mt-xs">{{ selectedPayroll?.label || 'Loading...' }}</div>
          </div>
          <div>
            <discussion-button
              v-if="enableDiscussionButton"
              flat
              round
              icon="o_comment"
              :data="{
                discussionTitle: `Payroll Summary - ${selectedPayroll.label}`,
                discussionModule: DiscussionModule.PayrollSummary,
                targetId: selectedPayroll.key,
                fromNotification: false,
              }"
              class="q-mr-sm"
            />
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
              <div class="text-body1">{{ `${selectedPayroll?.startDate?.dateFull} - ${selectedPayroll?.endDate?.dateFull}` }}</div>
            </div>
            <div>
              <div class="text-overline text-grey-7">PROCESSING DATE</div>
              <div class="text-body1">{{ `${selectedPayroll?.processingDate?.dateFull}` }}</div>
            </div>
            <div>
              <div class="text-overline text-grey-7">PERIOD TYPE</div>
              <div class="text-body1">{{ selectedPayroll?.cutoffPeriodType?.label }}</div>
            </div>
          </div>
          <div class="row items-center q-gutter-sm">
            <q-btn-dropdown
              flat
              icon="download"
              label="Export"
              no-caps
              class="md3-btn"
              :disable="isLoading || payrollProcessingList.length === 0"
            >
              <q-list>
                <q-item clickable v-close-popup @click="exportPayrollSummary('csv')">
                  <q-item-section avatar>
                    <q-icon name="description" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>Export as CSV</q-item-label>
                    <q-item-label caption>Comma-separated values</q-item-label>
                  </q-item-section>
                </q-item>
                <q-item clickable v-close-popup @click="exportPayrollSummary('excel')">
                  <q-item-section avatar>
                    <q-icon name="table_chart" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>Export as Excel</q-item-label>
                    <q-item-label caption>Microsoft Excel format</q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
            </q-btn-dropdown>
            <q-btn
              flat
              icon="account_balance"
              label="Bank File Writers"
              no-caps
              class="md3-btn"
              :disable="isLoading || payrollProcessingList.length === 0"
              @click="handleBankFileWriters"
            />
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
          
          <!-- Branch Filter -->
          <div class="md3-filter-item" style="min-width: 250px;">
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
        <div class="table-container" :class="{ 'loading-overlay': isLoading }">
          <div class="scrollable-table-wrapper" ref="tableWrapper">
            <table class="payroll-summary-table">
              <thead>
                <tr>
                  <th class="sortable-header" width="200px" @click="handleSort('lastName')">
                    <div class="header-content">
                      <span>Employee Name</span>
                      <q-icon v-if="getSortIcon('lastName')" :name="getSortIcon('lastName')" size="16px" class="sort-icon" />
                    </div>
                  </th>
                  <th class="text-center sortable-header" width="120px" @click="handleSort('employeeCode')">
                    <div class="header-content">
                      <span>Employee Code</span>
                      <q-icon v-if="getSortIcon('employeeCode')" :name="getSortIcon('employeeCode')" size="16px" class="sort-icon" />
                    </div>
                  </th>
                  <th class="text-center sortable-header" width="120px" @click="handleSort('branch')">
                    <div class="header-content">
                      <span>Branch</span>
                      <q-icon v-if="getSortIcon('branch')" :name="getSortIcon('branch')" size="16px" class="sort-icon" />
                    </div>
                  </th>
                  <th class="text-center sortable-header" width="120px" @click="handleSort('payrollGroup')">
                    <div class="header-content">
                      <span>Payroll Group</span>
                      <q-icon v-if="getSortIcon('payrollGroup')" :name="getSortIcon('payrollGroup')" size="16px" class="sort-icon" />
                    </div>
                  </th>
                  <th class="text-center sortable-header" width="120px" @click="handleSort('basicSalary')">
                    <div class="header-content">
                      <span>Basic Salary</span>
                      <q-icon v-if="getSortIcon('basicSalary')" :name="getSortIcon('basicSalary')" size="16px" class="sort-icon" />
                    </div>
                  </th>
                  <th class="text-center sortable-header" width="80px" @click="handleSort('deductionLate')">
                    <div class="header-content">
                      <span>Late</span>
                      <q-icon v-if="getSortIcon('deductionLate')" :name="getSortIcon('deductionLate')" size="16px" class="sort-icon" />
                    </div>
                  </th>
                  <th class="text-center sortable-header" width="80px" @click="handleSort('deductionUndertime')">
                    <div class="header-content">
                      <span>Undertime</span>
                      <q-icon v-if="getSortIcon('deductionUndertime')" :name="getSortIcon('deductionUndertime')" size="16px" class="sort-icon" />
                    </div>
                  </th>
                  <th class="text-center sortable-header" width="80px" @click="handleSort('deductionAbsent')">
                    <div class="header-content">
                      <span>Absent</span>
                      <q-icon v-if="getSortIcon('deductionAbsent')" :name="getSortIcon('deductionAbsent')" size="16px" class="sort-icon" />
                    </div>
                  </th>
                  <th class="text-center sortable-header" width="120px" @click="handleSort('basicPay')">
                    <div class="header-content">
                      <span>Basic Pay</span>
                      <q-icon v-if="getSortIcon('basicPay')" :name="getSortIcon('basicPay')" size="16px" class="sort-icon" />
                    </div>
                  </th>
                  <th class="text-center sortable-header" width="120px" @click="handleSort('allowance')">
                    <div class="header-content">
                      <span>Allowance Pay</span>
                      <q-icon v-if="getSortIcon('allowance')" :name="getSortIcon('allowance')" size="16px" class="sort-icon" />
                    </div>
                  </th>
                  <th class="text-center sortable-header" width="120px" @click="handleSort('earningRegularHoliday')">
                    <div class="header-content">
                      <span>Holiday Pay</span>
                      <q-icon v-if="getSortIcon('earningRegularHoliday')" :name="getSortIcon('earningRegularHoliday')" size="16px" class="sort-icon" />
                    </div>
                  </th>
                  <th class="text-center sortable-header" width="120px" @click="handleSort('earningOvertime')">
                    <div class="header-content">
                      <span>Overtime Pay</span>
                      <q-icon v-if="getSortIcon('earningOvertime')" :name="getSortIcon('earningOvertime')" size="16px" class="sort-icon" />
                    </div>
                  </th>
                  <th class="text-center sortable-header" width="120px" @click="handleSort('earningNightDifferential')">
                    <div class="header-content">
                      <span>Night Differential Pay</span>
                      <q-icon v-if="getSortIcon('earningNightDifferential')" :name="getSortIcon('earningNightDifferential')" size="16px" class="sort-icon" />
                    </div>
                  </th>
                  <th class="text-center sortable-header" width="120px" @click="handleSort('earningRestDay')">
                    <div class="header-content">
                      <span>Rest Day Pay</span>
                      <q-icon v-if="getSortIcon('earningRestDay')" :name="getSortIcon('earningRestDay')" size="16px" class="sort-icon" />
                    </div>
                  </th>
                  <th class="text-center sortable-header" width="120px" @click="handleSort('earningSalaryAdjustment')">
                    <div class="header-content">
                      <span>Manual Earnings</span>
                      <q-icon v-if="getSortIcon('earningSalaryAdjustment')" :name="getSortIcon('earningSalaryAdjustment')" size="16px" class="sort-icon" />
                    </div>
                  </th>
                  <th class="text-center sortable-header" width="120px" @click="handleSort('grossPay')">
                    <div class="header-content">
                      <span>Gross Pay</span>
                      <q-icon v-if="getSortIcon('grossPay')" :name="getSortIcon('grossPay')" size="16px" class="sort-icon" />
                    </div>
                  </th>
                  <th class="text-center sortable-header" width="80px" @click="handleSort('governmentContributionSSS')">
                    <div class="header-content">
                      <span>SSS</span>
                      <q-icon v-if="getSortIcon('governmentContributionSSS')" :name="getSortIcon('governmentContributionSSS')" size="16px" class="sort-icon" />
                    </div>
                  </th>
                  <th class="text-center sortable-header" width="80px" @click="handleSort('governmentContributionPhilhealth')">
                    <div class="header-content">
                      <span>Philhealth</span>
                      <q-icon v-if="getSortIcon('governmentContributionPhilhealth')" :name="getSortIcon('governmentContributionPhilhealth')" size="16px" class="sort-icon" />
                    </div>
                  </th>
                  <th class="text-center sortable-header" width="80px" @click="handleSort('governmentContributionPagibig')">
                    <div class="header-content">
                      <span>Pagibig</span>
                      <q-icon v-if="getSortIcon('governmentContributionPagibig')" :name="getSortIcon('governmentContributionPagibig')" size="16px" class="sort-icon" />
                    </div>
                  </th>
                  <th class="text-center sortable-header" width="80px" @click="handleSort('governmentContributionTax')">
                    <div class="header-content">
                      <span>Tax</span>
                      <q-icon v-if="getSortIcon('governmentContributionTax')" :name="getSortIcon('governmentContributionTax')" size="16px" class="sort-icon" />
                    </div>
                  </th>
                  <th class="text-center sortable-header" width="100px" @click="handleSort('loans')">
                    <div class="header-content">
                      <span>Loans</span>
                      <q-icon v-if="getSortIcon('loans')" :name="getSortIcon('loans')" size="16px" class="sort-icon" />
                    </div>
                  </th>
                  <th class="text-center sortable-header" width="120px" @click="handleSort('totalDeduction')">
                    <div class="header-content">
                      <span>Manual Deductions</span>
                      <q-icon v-if="getSortIcon('totalDeduction')" :name="getSortIcon('totalDeduction')" size="16px" class="sort-icon" />
                    </div>
                  </th>
                  <th class="sortable-header" width="150px" @click="handleSort('netPay')">
                    <div class="header-content">
                      <span>Net Pay</span>
                      <q-icon v-if="getSortIcon('netPay')" :name="getSortIcon('netPay')" size="16px" class="sort-icon" />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody v-if="isLoading" class="loading">
                <tr v-for="n in 20" :key="`skeleton-${n}`" class="skeleton-row">
                  <td><q-skeleton type="text" /></td>
                  <td><q-skeleton type="text" width="80px" /></td>
                  <td><q-skeleton type="text" /></td>
                  <td><q-skeleton type="text" width="100px" /></td>
                  <td><q-skeleton type="text" width="80px" /></td>
                  <td><q-skeleton type="text" width="60px" /></td>
                  <td><q-skeleton type="text" width="60px" /></td>
                  <td><q-skeleton type="text" width="60px" /></td>
                  <td><q-skeleton type="text" width="80px" /></td>
                  <td><q-skeleton type="text" width="80px" /></td>
                  <td><q-skeleton type="text" width="80px" /></td>
                  <td><q-skeleton type="text" width="80px" /></td>
                  <td><q-skeleton type="text" width="80px" /></td>
                  <td><q-skeleton type="text" width="80px" /></td>
                  <td><q-skeleton type="text" width="80px" /></td>
                  <td><q-skeleton type="text" width="80px" /></td>
                  <td><q-skeleton type="text" width="60px" /></td>
                  <td><q-skeleton type="text" width="60px" /></td>
                  <td><q-skeleton type="text" width="60px" /></td>
                  <td><q-skeleton type="text" width="60px" /></td>
                  <td><q-skeleton type="text" width="80px" /></td>
                  <td><q-skeleton type="text" width="80px" /></td>
                  <td><q-skeleton type="text" width="100px" /></td>
                </tr>
              </tbody>
              <tbody v-if="!isLoading">
                <tr v-for="data in payrollProcessingList" :key="data.employeeInformation.accountDetails.id" @click="showEmployeeInformation(data)">
                  <td class="employee-name">
                    {{ formatEmployeeName(data.employeeInformation.accountDetails) }}
                  </td>
                  <td class="text-center">
                    {{ data.employeeInformation.employeeCode }}
                  </td>
                  <td class="text-center">
                    {{ data.employeeInformation.branch.name }}
                  </td>
                  <td class="text-center">
                    {{ data.employeeInformation.payrollGroup.payrollGroupCode }}
                  </td>
                  <td class="text-center">
                    <amount-view :amount="data.salaryComputation.summary.basicSalary"></amount-view>
                  </td>
                  <td class="text-center">
                    <amount-view :amount="data.salaryComputation.summary.deductions.late"></amount-view>
                  </td>
                  <td class="text-center">
                    <amount-view :amount="data.salaryComputation.summary.deductions.undertime"></amount-view>
                  </td>
                  <td class="text-center">
                    <amount-view :amount="data.salaryComputation.summary.deductions.absent"></amount-view>
                  </td>
                  <td class="text-center">
                    <amount-view :amount="data.salaryComputation.summary.basicPay"></amount-view>
                  </td>
                  <td class="text-center">
                    <amount-view :amount="data.salaryComputation.summary.totalAllowance"></amount-view>
                  </td>
                  <td class="text-center">
                    <amount-view :amount="data.salaryComputation.summary.additionalEarnings.regularHoliday + data.salaryComputation.summary.additionalEarnings.specialHoliday"></amount-view>
                  </td>
                  <td class="text-center">
                    <amount-view :amount="data.salaryComputation.summary.additionalEarnings.overtime"></amount-view>
                  </td>
                  <td class="text-center">
                    <amount-view :amount="data.salaryComputation.summary.additionalEarnings.nightDifferentialOvertime"></amount-view>
                  </td>
                  <td class="text-center">
                    <amount-view :amount="data.salaryComputation.summary.additionalEarnings.restDay"></amount-view>
                  </td>
                  <td class="text-center">
                    <amount-view :amount="data.salaryComputation.summary.salaryAdjustmentEarnings"></amount-view>
                  </td>
                  <td class="text-center">
                    <amount-view :amount="data.salaryComputation.summary.grossPay"></amount-view>
                  </td>
                  <td class="text-center">
                    <amount-view :amount="data.salaryComputation.summary.contributions.sss"></amount-view>
                  </td>
                  <td class="text-center">
                    <amount-view :amount="data.salaryComputation.summary.contributions.philhealth"></amount-view>
                  </td>
                  <td class="text-center">
                    <amount-view :amount="data.salaryComputation.summary.contributions.pagibig"></amount-view>
                  </td>
                  <td class="text-center">
                    <amount-view :amount="data.salaryComputation.summary.contributions.withholdingTax"></amount-view>
                  </td>
                  <td class="text-center">
                    <amount-view :amount="data.salaryComputation.summary.totalLoan"></amount-view>
                  </td>
                  <td class="text-center">
                    <amount-view :amount="data.salaryComputation.summary.salaryAdjustmentDeductions"></amount-view>
                  </td>
                  <td class="text-bold">
                    <amount-view :amount="data.salaryComputation.summary.netPay"></amount-view>
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <!-- Total Row -->
                <tr v-if="!isLoadingGrandTotal">
                  <td class="text-bold text-primary">Total ({{ grandTotal.totalEmployees }} employees)</td>
                  <td colspan="3"></td>
                  <td class="text-center text-bold text-primary"><amount-view :amount="grandTotal.basicSalary"></amount-view></td>
                  <td class="text-center text-bold text-primary"><amount-view :amount="grandTotal.deductionLate"></amount-view></td>
                  <td class="text-center text-bold text-primary"><amount-view :amount="grandTotal.deductionUndertime"></amount-view></td>
                  <td class="text-center text-bold text-primary"><amount-view :amount="grandTotal.deductionAbsent"></amount-view></td>
                  <td class="text-center text-bold text-primary"><amount-view :amount="grandTotal.basicPay"></amount-view></td>
                  <td class="text-center text-bold text-primary"><amount-view :amount="grandTotal.allowance"></amount-view></td>
                  <td class="text-center text-bold text-primary"><amount-view :amount="grandTotal.holiday"></amount-view></td>
                  <td class="text-center text-bold text-primary"><amount-view :amount="grandTotal.overtime"></amount-view></td>
                  <td class="text-center text-bold text-primary"><amount-view :amount="grandTotal.nightDiff"></amount-view></td>
                  <td class="text-center text-bold text-primary"><amount-view :amount="grandTotal.restDay"></amount-view></td>
                  <td class="text-center text-bold text-primary"><amount-view :amount="grandTotal.manualEarnings"></amount-view></td>
                  <td class="text-center text-bold text-primary"><amount-view :amount="grandTotal.grossPay"></amount-view></td>
                  <td class="text-center text-bold text-primary"><amount-view :amount="grandTotal.sss"></amount-view></td>
                  <td class="text-center text-bold text-primary"><amount-view :amount="grandTotal.philhealth"></amount-view></td>
                  <td class="text-center text-bold text-primary"><amount-view :amount="grandTotal.pagibig"></amount-view></td>
                  <td class="text-center text-bold text-primary"><amount-view :amount="grandTotal.tax"></amount-view></td>
                  <td class="text-center text-bold text-primary"><amount-view :amount="grandTotal.loans"></amount-view></td>
                  <td class="text-center text-bold text-primary"><amount-view :amount="grandTotal.manualDeductions"></amount-view></td>
                  <td class="text-bold text-primary"><amount-view :amount="grandTotal.netPay"></amount-view></td>
                </tr>
                <!-- Total Loading Row -->
                <tr v-if="isLoadingGrandTotal">
                  <td class="text-bold">Total (Loading...)</td>
                  <td colspan="22">
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
              <template v-if="!isLoading && pagination.totalItems > 0">
                <span class="text-weight-medium">{{ (pagination.currentPage - 1) * pagination.itemsPerPage + 1 }}-{{ Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems) }}</span>
                <span class="text-grey-6"> of </span>
                <span class="text-weight-medium">{{ pagination.totalItems }}</span>
                <span class="text-grey-6"> employees</span>
              </template>
              <template v-else-if="isLoading">
                <q-skeleton type="text" width="150px" />
              </template>
              <template v-else>
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
                <template v-if="!isLoading && pagination.totalPages > 0">
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
                :disable="currentPage === pagination.totalPages || isLoading"
                flat
                round
                dense
                icon="chevron_right"
                class="md3-pagination-btn"
              />
              <q-btn
                @click="handlePageChange(pagination.totalPages)"
                :disable="currentPage === pagination.totalPages || isLoading"
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
        <!-- Re-Compute Salary Button -->
        <q-btn 
          v-if="selectedPayroll.status === 'PENDING'" 
          flat
          icon="refresh"
          label="Re-Compute Salary"
          @click="recomputeSalary()" 
          no-caps 
          class="md3-btn"
        />

        <q-space />

        <!-- Reject Button (hide for PROCESSED status since we have manual reject) -->
        <q-btn 
          v-if="['PENDING', 'APPROVED'].includes(selectedPayroll.status)" 
          flat
          icon="close"
          label="Reject"
          color="negative"
          @click="rejectPayroll()" 
          no-caps 
          class="md3-btn"
        />

        <!-- Rejected Status Actions -->
        <template v-if="selectedPayroll.status === 'REJECTED'">
          <q-btn 
            flat
            icon="undo"
            label="Return to Timekeeping"
            color="warning"
            @click="returnToTimekeeping()" 
            no-caps 
            class="md3-btn"
          />
          
          <q-btn 
            unelevated
            icon="send"
            label="Resubmit for Approval"
            color="primary"
            @click="resubmitForApproval()" 
            no-caps 
            class="md3-btn"
          />
        </template>

        <!-- Status-based Action Button -->
        <q-btn 
          v-if="selectedPayroll.status === 'PENDING'" 
          unelevated
          icon="check"
          label="Submit for Approval"
          color="primary"
          @click="submitForApproval()"
          no-caps 
          class="md3-btn"
        />

        <!-- Manual Approval Buttons (Only for PROCESSED status) -->
        <template v-if="selectedPayroll.status === 'PROCESSED' && showManualApprovalButtons">
          <q-separator vertical class="q-mx-md" />
          <q-btn
            flat
            icon="gavel"
            label="Manual Approve"
            color="positive"
            @click="showManualApprovalDialog('approve')"
            no-caps
            class="md3-btn"
          />
          <q-btn
            flat
            icon="block"
            label="Manual Reject"
            color="negative"
            @click="showManualApprovalDialog('reject')"
            no-caps
            class="md3-btn"
          />
        </template>

        <q-btn 
          v-if="selectedPayroll.status === 'APPROVED'" 
          unelevated
          icon="publish"
          label="Publish"
          color="primary"
          @click="submitForApproval()"
          no-caps 
          class="md3-btn"
        />

        <!-- Return to Approved Button (Dev/Staging only) -->
        <q-btn 
          v-if="selectedPayroll.status === 'POSTED' && ['DEVELOPMENT', 'LOCAL-DEVELOPMENT', 'STAGING'].includes(authStore.serverName)" 
          flat
          icon="undo"
          label="Return to Approved"
          color="warning"
          @click="returnToApproved()" 
          no-caps 
          class="md3-btn"
        />
      </q-card-actions>

      <!-- Employee Information Dialog -->
      <EmployeeInformationDialog 
        v-if="selectedPayroll && employeeSalaryComputationData" 
        :cutoffInformation="selectedPayroll" 
        :employeeSalaryComputationData="employeeSalaryComputationData" 
        v-model="openEmployeeInfo" 
        @update:salary="handleSalaryUpdate" 
      />

      <!-- Manual Override Warning Dialog -->
      <q-dialog v-model="showOverrideDialog" persistent>
        <q-card class="override-dialog-card" style="min-width: 500px">
          <q-card-section class="q-pb-sm">
            <div class="row items-center q-gutter-sm">
              <q-icon name="warning" color="orange" size="28px" />
              <div class="text-h6">Manual {{ overrideAction === 'approve' ? 'Approval' : 'Rejection' }} Override</div>
            </div>
          </q-card-section>

          <q-card-section>
            <div class="text-body1 q-mb-md">
              <strong>⚠️ Warning:</strong> You are about to manually {{ overrideAction }} this payroll.
            </div>
            
            <div class="text-body2 q-mb-md">This action will:</div>
            <ul class="q-pl-md q-my-sm">
              <li>Close all {{ pendingApprovalTasks.length }} pending approval tasks</li>
              <li>Skip the normal approval workflow</li>
              <li>Notify all affected approvers</li>
              <li>Record this action as a manual override in the audit trail</li>
            </ul>

            <div v-if="pendingApprovalTasks.length > 0" class="q-mt-md">
              <div class="text-subtitle2 q-mb-sm">Affected Approvers:</div>
              <q-chip 
                v-for="task in pendingApprovalTasks" 
                :key="task.id"
                color="grey-3"
                text-color="black"
                icon="person"
              >
                {{ task.approverName }} (Level {{ task.level }})
              </q-chip>
            </div>

            <q-input
              v-model="overrideRemarks"
              label="Reason for override (required)"
              type="textarea"
              rows="3"
              outlined
              :rules="[val => !!val || 'Reason is required']"
              class="q-mt-md"
            />
          </q-card-section>

          <q-card-actions align="right" class="q-pa-md">
            <q-btn flat label="Cancel" @click="closeOverrideDialog" />
            <q-btn 
              unelevated
              :label="`Confirm ${overrideAction === 'approve' ? 'Approval' : 'Rejection'}`"
              :color="overrideAction === 'approve' ? 'positive' : 'negative'"
              :disable="!overrideRemarks"
              @click="confirmManualOverride"
            />
          </q-card-actions>
        </q-card>
      </q-dialog>
      
      <!-- Bank File Writers Dialog -->
      <BankFileWritersDialog
        v-model="showBankFileWritersDialog"
        :selected-payroll="selectedPayroll"
        @export-complete="handleBankExportComplete"
      />
    </q-card>
  </q-dialog>
</template>

<style src="./ManpowerPayrollSummaryDialog.scss" scoped></style>

<script lang="ts">
import { Ref, ref, computed } from 'vue';
import EmployeeInformationDialog from './ManpowerEmployeeInformationDialog/EmployeeSalaryInformationDialog.vue';
import BankFileWritersDialog from './BankFileWritersDialog.vue';
import { api } from 'src/boot/axios';
import { AxiosError } from 'axios';
import { CutoffDateRangeResponse, SalaryInformationListResponse } from "@shared/response";
import AmountView from "../../../../../components/shared/display/AmountView.vue";
import { QDialog, useQuasar } from 'quasar';
import { handleAxiosError } from "../../../../../utility/axios.error.handler";
import DiscussionButton from "../../../../../components/shared/discussion/DiscussionButton.vue";
import { DiscussionModule } from "../../../../../components/shared/discussion/DiscussionProps";
import CustomBranchTreeSelect from "../../../../../components/selection/CustomBranchTreeSelect.vue";
import { useAuthStore } from 'src/stores/auth';

// Type definitions for the optimized payroll summary response
interface PayrollSummaryEmployeeInfo {
  accountId: string;
  employeeCode: string;
  fullName: string;
  firstName: string;
  lastName: string;
  branchName: string;
  payrollGroupCode: string;
}

interface PayrollSummarySalaryInfo {
  timekeepingCutoffId: number;
  basicSalary: number;
  deductionLate: number;
  deductionUndertime: number;
  deductionAbsent: number;
  basicPay: number;
  allowance: number;
  earningRegularHoliday: number;
  earningSpecialHoliday: number;
  earningOvertime: number;
  earningNightDifferential: number;
  earningNightDifferentialOvertime: number;
  earningRestDay: number;
  earningSalaryAdjustment: number;
  grossPay: number;
  governmentContributionSSS: number;
  governmentContributionPhilhealth: number;
  governmentContributionPagibig: number;
  governmentContributionTax: number;
  loans: number;
  totalDeduction: number;
  netPay: number;
}

interface PayrollSummaryListItem {
  employee: PayrollSummaryEmployeeInfo;
  salary: PayrollSummarySalaryInfo;
}

export default {
  name: 'PayrollSummaryDialog',
  components: {
    EmployeeInformationDialog,
    BankFileWritersDialog,
    AmountView,
    DiscussionButton,
    CustomBranchTreeSelect,
  },
  props: {
    selectedPayroll: {
      type: Object as () => CutoffDateRangeResponse,
      default: () => {},
    },
    enableDiscussionButton: {
      type: Boolean,
      default: true,
    },
  },
  emits: ['reload'],
  setup(props, { emit }) {
    const $q = useQuasar();
    const authStore = useAuthStore();
    const dialog = ref<InstanceType<typeof QDialog>>();
    const tableWrapper = ref<HTMLElement | null>(null);
    const payrollProcessingList: Ref<SalaryInformationListResponse[]> = ref([]);
    const isLoading = ref(false);
    const selectAll = ref(false);
    const openEmployeeInfo = ref(false);
    const employeeSalaryComputationData: Ref<SalaryInformationListResponse | null> = ref(null);
    const text = ref('');
    const selectRange = ref(0);
    
    // Pagination and search state
    const currentPage = ref(1);
    const pageSize = ref(50);
    const pageSizeOptions = [20, 50, 100, 200];
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
    const selectedEmploymentStatus = ref<string | null>(null); // Employment status is a string enum
    const selectedDepartment = ref<string | null>(null);
    const selectedRole = ref<string | null>(null);
    
    // Filter options with default "All" option - branch options removed as it's handled by BranchTreeSelect
    const employmentStatusOptions = ref<{label: string, value: string | null}[]>([{ label: 'All Status', value: null }]);
    const departmentOptions = ref<{label: string, value: string | null}[]>([{ label: 'All Department', value: null }]);
    const roleOptions = ref<{label: string, value: string | null}[]>([{ label: 'All Role', value: null }]);
    
    // Sorting state
    const sortColumn = ref<string>('lastName');
    const sortOrder = ref<'asc' | 'desc' | null>('asc');
    
    // Grand totals state
    const grandTotal = ref({
      basicSalary: 0,
      deductionLate: 0,
      deductionUndertime: 0,
      deductionAbsent: 0,
      basicPay: 0,
      allowance: 0,
      holiday: 0,
      overtime: 0,
      nightDiff: 0,
      restDay: 0,
      manualEarnings: 0,
      grossPay: 0,
      sss: 0,
      philhealth: 0,
      pagibig: 0,
      tax: 0,
      loans: 0,
      manualDeductions: 0,
      netPay: 0,
      totalEmployees: 0,
    });
    const isLoadingGrandTotal = ref(false);
    
    const initializeDialog = () => {
      // Reset pagination and search state when dialog opens
      currentPage.value = 1;
      searchQuery.value = '';
      // Reset filters
      selectedBranchIds.value = [];
      selectedEmploymentStatus.value = null;
      selectedDepartment.value = null;
      selectedRole.value = null;
      // Load filter options
      loadFilterOptions();
      getEmployeeSalaryComputation(true);
      fetchGrandTotal();
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
          departmentOptions.value = [{ label: 'All Department', value: null }, ...departments];
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
        roleOptions.value = [{ label: 'All Role', value: null }];
        return;
      }
      
      try {
        const roleResponse = await api.get(`/select-box/role-list?roleGroupId=${departmentId}`);
        // API returns { list: [...] }
        if (roleResponse.data && roleResponse.data.list) {
          const roles = roleResponse.data.list.map((item: any) => ({
            label: item.label,
            value: item.key
          }));
          roleOptions.value = [{ label: 'All Role', value: null }, ...roles];
        }
      } catch (error) {
        console.error('Error loading role options:', error);
        if (error instanceof AxiosError) {
          handleAxiosError($q, error);
        }
        roleOptions.value = [{ label: 'All Role', value: null }];
      }
    };
    
    const onDepartmentChange = (value: string | null) => {
      selectedDepartment.value = value as any;
      selectedRole.value = null; // Clear role selection
      
      if (value) {
        loadRoleOptions(value);
      } else {
        roleOptions.value = [{ label: 'All Role', value: null }];
      }
      
      handleFilterChange();
    };
    
    const handleFilterChange = () => {
      currentPage.value = 1; // Reset to first page when filters change
      getEmployeeSalaryComputation();
      fetchGrandTotal();
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

    const showEmployeeInformation = async (data: SalaryInformationListResponse) => {
      // Show loading while fetching full data
      $q.loading.show({
        message: 'Loading employee details...',
      });
      
      try {
        // Fetch full employee salary details
        const response = await api.get('/hr-processing/get-employee-salary-detail', {
          params: {
            timekeepingCutoffId: data.salaryComputation.timekeepingCutoffId,
            needRecompute: false,
          },
        });
        
        if (response.status === 200) {
          // Set full data and open dialog
          employeeSalaryComputationData.value = {
            employeeInformation: data.employeeInformation,
            salaryComputation: response.data,
          };
          openEmployeeInfo.value = true;
        }
      } catch (error) {
        handleAxiosError($q, error as AxiosError);
      } finally {
        $q.loading.hide();
      }
    };

    const recomputeSalary = () => {
      $q.loading.show({
        message: 'Recomputing Salary',
      });

      api
        .post('hr-processing/recompute-salary', {
          cutoffDateRangeId: props.selectedPayroll.key,
        })
        .then(() => {
          emit('reload');

          setTimeout(() => {
            dialog.value?.hide();
            $q.loading.hide();
          }, 1000);
        })
        .catch((error) => {
          console.error('Error recomputing salary:', error);
        });
    };

    const getEmployeeSalaryComputation = async (resetPage = false) => {
      isLoading.value = true;

      // Reset to page 1 when opening dialog or when explicitly requested
      if (resetPage) {
        currentPage.value = 1;
      }

      // Add cache-busting timestamp to ensure fresh data
      const timestamp = new Date().getTime();

      // Build params object, only including filters with values
      const params: any = {
        cutoffDateRangeId: props.selectedPayroll.key,
        page: currentPage.value,
        limit: pageSize.value,
        search: searchQuery.value,
        sortBy: sortOrder.value ? sortColumn.value : 'lastName',
        sortOrder: sortOrder.value || 'asc',
        _t: timestamp, // Cache buster
      };
      
      // Only add filter params if they have values (not null)
      if (selectedBranchIds.value.length > 0) {
        // Send comma-separated branch IDs - backend will need to be updated to support this
        params.branchIds = selectedBranchIds.value.join(',');
      }
      if (selectedEmploymentStatus.value !== null) {
        params.employmentStatusId = selectedEmploymentStatus.value;
      }
      if (selectedDepartment.value !== null) {
        params.departmentId = selectedDepartment.value;
      }
      if (selectedRole.value !== null) {
        params.roleId = selectedRole.value;
      }
      
      
      api
        .get('/hr-processing/get-payroll-summary-optimized', {
          params,
        })
        .then((response) => {
          if (response.status === 200) {
            // Transform the optimized response to match the existing structure
            payrollProcessingList.value = response.data.data.map((item: PayrollSummaryListItem) => ({
              employeeInformation: {
                accountDetails: {
                  id: item.employee.accountId,
                  fullName: item.employee.fullName,
                  firstName: item.employee.firstName,
                  lastName: item.employee.lastName,
                },
                employeeCode: item.employee.employeeCode,
                branch: {
                  name: item.employee.branchName,
                },
                payrollGroup: {
                  payrollGroupCode: item.employee.payrollGroupCode,
                },
              },
              salaryComputation: {
                timekeepingCutoffId: item.salary.timekeepingCutoffId,
                summary: {
                  basicSalary: item.salary.basicSalary,
                  basicPay: item.salary.basicPay,
                  basicPayBeforeAdjustment: item.salary.basicPay,
                  totalDeduction: item.salary.totalDeduction,
                  totalAllowance: item.salary.allowance,
                  additionalEarnings: {
                    regularHoliday: item.salary.earningRegularHoliday,
                    specialHoliday: item.salary.earningSpecialHoliday,
                    overtime: item.salary.earningOvertime,
                    nightDifferential: item.salary.earningNightDifferential,
                    nightDifferentialOvertime: item.salary.earningNightDifferentialOvertime,
                    restDay: item.salary.earningRestDay,
                    total: item.salary.earningRegularHoliday + item.salary.earningSpecialHoliday + 
                            item.salary.earningOvertime + item.salary.earningNightDifferential + 
                            item.salary.earningNightDifferentialOvertime + item.salary.earningRestDay,
                  },
                  deductions: {
                    late: item.salary.deductionLate,
                    undertime: item.salary.deductionUndertime,
                    absent: item.salary.deductionAbsent,
                    total: item.salary.deductionLate + item.salary.deductionUndertime + item.salary.deductionAbsent,
                  },
                  salaryAdjustmentEarnings: item.salary.earningSalaryAdjustment,
                  salaryAdjustmentDeductions: 0, // Not included in optimized response
                  grossPay: item.salary.grossPay,
                  contributions: {
                    sss: item.salary.governmentContributionSSS,
                    philhealth: item.salary.governmentContributionPhilhealth,
                    pagibig: item.salary.governmentContributionPagibig,
                    withholdingTax: item.salary.governmentContributionTax,
                  },
                  totalLoan: item.salary.loans,
                  netPay: item.salary.netPay,
                },
              },
            }));
            pagination.value = response.data.pagination;
            
            // Scroll to top after data loads
            scrollToTop();
          }

          isLoading.value = false;
        })
        .catch((error) => {
          handleAxiosError($q, error);
          isLoading.value = false;
        });
    };

    const scrollToTop = () => {
      if (tableWrapper.value) {
        tableWrapper.value.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      }
    };

    const rejectPayroll = () => {
      $q.dialog({
        title: 'Confirmation',
        message: 'Are you sure you want to reject this payroll computation? Please make sure you state the reason in the remarks section.',
        ok: 'Yes',
        cancel: 'No',
        html: true,
      }).onOk(() => {
        handleRejectConfirmation();
      });
    };
    const handleRejectConfirmation = () => {
      $q.loading.show({
        message: 'Rejecting Payroll',
      });

      api
        .post('hr-processing/return-to-timekeeping', {
          cutoffDateRangeId: props.selectedPayroll.key,
        })
        .then(() => {
          emit('reload');
          setTimeout(() => {
            dialog.value?.hide();
            $q.loading.hide();
          }, 1000);
        })
        .catch((error) => {
          console.error('Error rejecting payroll:', error);
        });
    };

    const submitForApproval = () => {
      let message = 'Are you sure you want to submit this payroll computation for approval?';

      if (props.selectedPayroll.status === 'PROCESSED') {
        message = 'Are you sure you want to submit this payroll computation for approve?';
      } else if (props.selectedPayroll.status === 'APPROVED') {
        message = 'Are you sure you want to submit this payroll computation for posted?';
      }

      $q.dialog({
        title: 'Confirmation',
        message: message,
        ok: 'Yes',
        cancel: 'No',
      }).onOk(() => {
        handleSubmitForApproval();
      });
    };

    const handleSubmitForApproval = () => {
      $q.loading.show({
        message: 'Submitting Payroll for Approval',
      });

      $q.loading.show({
        message: 'Submitting Payroll for Approval',
      });

      api
        .post('hr-processing/submit-next-status', {
          cutoffDateRangeId: props.selectedPayroll.key,
        })
        .then(() => {
          $q.notify({
            message: 'Payroll submitted for approval',
            color: 'primary',
          });

          dialog.value?.hide();
        })
        .catch((error) => {
          handleAxiosError($q, error);
        })
        .finally(() => {
          $q.loading.hide();
        });
    };

    const handleSalaryUpdate = async () => {
      console.log('handleSalaryUpdate called in PayrollSummaryDialog');

      // Update the currently selected employee's data
      if (employeeSalaryComputationData.value) {
        try {
          $q.loading.show({
            message: 'Refreshing employee data...',
          });

          const accountId = employeeSalaryComputationData.value.employeeInformation.accountDetails.id;

          // Use the new single employee endpoint with cache-busting
          const timestamp = new Date().getTime();
          const response = await api.get(`/hr-processing/employee-computation/${accountId}/${props.selectedPayroll.key}`, {
            params: {
              _t: timestamp, // Cache buster
            },
          });

          if (response.data) {
            console.log('Updated employee data received');
            console.log('Old total allowance:', employeeSalaryComputationData.value.salaryComputation.summary.totalAllowance);
            console.log('New total allowance:', response.data.salaryComputation.summary.totalAllowance);
            console.log('Old salary adjustment earnings:', employeeSalaryComputationData.value.salaryComputation.summary.salaryAdjustmentEarnings);
            console.log('New salary adjustment earnings:', response.data.salaryComputation.summary.salaryAdjustmentEarnings);

            // Force Vue to recognize the change by creating a new object
            employeeSalaryComputationData.value = { ...response.data };

            // Also update the item in the main list
            const index = payrollProcessingList.value.findIndex(
              (emp) => emp.employeeInformation.accountDetails.id === accountId
            );
            if (index !== -1) {
              payrollProcessingList.value[index] = { ...response.data };
            }

            // Fetch updated cutoff totals
            const totalsResponse = await api.get(`/hr-processing/cutoff-totals/${props.selectedPayroll.key}`, {
              params: {
                _t: timestamp, // Cache buster
              },
            });

            if (totalsResponse.data) {
              console.log('Updated cutoff totals received');
              console.log('Old total allowance:', props.selectedPayroll.totalAllowance.raw);
              console.log('New total allowance:', totalsResponse.data.totalAllowance.raw);

              // Update the selectedPayroll totals
              Object.assign(props.selectedPayroll, totalsResponse.data);
            }
          }

          $q.loading.hide();
        } catch (error) {
          console.error('Error fetching updated employee data:', error);
          if (error instanceof AxiosError) {
            handleAxiosError($q, error);
          }
          $q.loading.hide();

          // Fallback to refreshing the entire list
          await getEmployeeSalaryComputation();
        }
      }
    };

    const returnToTimekeeping = () => {
      $q.dialog({
        title: 'Confirmation',
        message: 'Are you sure you want to return this payroll to timekeeping? This will reset the payroll status.',
        ok: 'Yes',
        cancel: 'No',
      }).onOk(() => {
        handleReturnToTimekeeping();
      });
    };

    const handleReturnToTimekeeping = () => {
      $q.loading.show({
        message: 'Returning to Timekeeping',
      });

      api
        .post('hr-processing/return-to-timekeeping', {
          cutoffDateRangeId: props.selectedPayroll.key,
        })
        .then(() => {
          $q.notify({
            message: 'Payroll returned to timekeeping',
            color: 'primary',
          });
          emit('reload');
          setTimeout(() => {
            dialog.value?.hide();
            $q.loading.hide();
          }, 1000);
        })
        .catch((error) => {
          handleAxiosError($q, error);
          $q.loading.hide();
        });
    };

    const resubmitForApproval = () => {
      $q.dialog({
        title: 'Confirmation',
        message: 'Are you sure you want to resubmit this payroll for approval?',
        ok: 'Yes',
        cancel: 'No',
      }).onOk(() => {
        handleResubmitForApproval();
      });
    };

    const handleResubmitForApproval = () => {
      $q.loading.show({
        message: 'Resubmitting for Approval',
      });

      api
        .post('hr-processing/resubmit-for-approval', {
          cutoffDateRangeId: props.selectedPayroll.key,
        })
        .then(() => {
          $q.notify({
            message: 'Payroll resubmitted for approval',
            color: 'primary',
          });
          emit('reload');
          setTimeout(() => {
            dialog.value?.hide();
            $q.loading.hide();
          }, 1000);
        })
        .catch((error) => {
          handleAxiosError($q, error);
          $q.loading.hide();
        });
    };

    const returnToApproved = () => {
      $q.dialog({
        title: 'Confirmation',
        message: 'Are you sure you want to return this payroll to Approved status? This action is only available in development and staging environments.',
        ok: 'Yes',
        cancel: 'No',
      }).onOk(() => {
        $q.loading.show({
          message: 'Returning to Approved status',
        });

        api
          .post('hr-processing/update-cutoff-date-range-status', {
            cutoffDateRangeId: props.selectedPayroll.key,
            status: 'APPROVED'
          })
          .then(() => {
            $q.notify({
              message: 'Payroll returned to Approved status',
              color: 'positive',
            });
            emit('reload');
            dialog.value?.hide();
          })
          .catch((error) => {
            handleAxiosError($q, error);
          })
          .finally(() => {
            $q.loading.hide();
          });
      });
    };

    // Pagination and search handlers
    const handlePageChange = (page: number) => {
      currentPage.value = page;
      getEmployeeSalaryComputation();
    };

    const handlePageSizeChange = (size: number) => {
      pageSize.value = size;
      currentPage.value = 1; // Reset to first page when changing page size
      getEmployeeSalaryComputation();
    };

    const fetchGrandTotal = async () => {
      isLoadingGrandTotal.value = true;
      
      try {
        // Build params object, only including filters with values
        const params: any = {
          cutoffDateRangeId: props.selectedPayroll.key,
          search: searchQuery.value,
        };
        
        // Only add filter params if they have values (not null)
        if (selectedBranchIds.value.length > 0) {
          // Send comma-separated branch IDs - backend will need to be updated to support this
          params.branchIds = selectedBranchIds.value.join(',');
        }
        if (selectedEmploymentStatus.value !== null) {
          params.employmentStatusId = selectedEmploymentStatus.value;
        }
        if (selectedDepartment.value !== null) {
          params.departmentId = selectedDepartment.value;
        }
        if (selectedRole.value !== null) {
          params.roleId = selectedRole.value;
        }
        
        
        const response = await api.get('/hr-processing/get-payroll-summary-totals', {
          params,
        });
        
        if (response.status === 200) {
          grandTotal.value = response.data;
        }
      } catch (error) {
        console.error('Error fetching grand total:', error);
      } finally {
        isLoadingGrandTotal.value = false;
      }
    };

    const handleSearch = (query: string | number | null) => {
      searchQuery.value = query ? String(query) : '';
      currentPage.value = 1; // Reset to first page when searching
      getEmployeeSalaryComputation();
      fetchGrandTotal(); // Update grand total when search changes
    };
    
    // Debounced search function
    let searchTimeout: NodeJS.Timeout;
    const debouncedSearch = () => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        handleSearch(searchQuery.value);
      }, 300);
    };

    // Handle column sorting with three states: asc -> desc -> null
    const handleSort = (column: string) => {
      if (sortColumn.value === column) {
        // Same column clicked - cycle through states
        if (sortOrder.value === 'asc') {
          sortOrder.value = 'desc';
        } else if (sortOrder.value === 'desc') {
          sortOrder.value = null;
          sortColumn.value = 'lastName'; // Reset to default column
        } else {
          sortOrder.value = 'asc';
        }
      } else {
        // Different column clicked - start with ascending
        sortColumn.value = column;
        sortOrder.value = 'asc';
      }
      
      // Reset to first page when sorting changes
      currentPage.value = 1;
      getEmployeeSalaryComputation();
    };
    
    // Helper function to get sort icon
    const getSortIcon = (column: string) => {
      if (sortColumn.value !== column || sortOrder.value === null) {
        return '';
      }
      return sortOrder.value === 'asc' ? 'arrow_upward' : 'arrow_downward';
    };
    
    // Helper function to check if column is currently sorted
    const isSorted = (column: string) => {
      return sortColumn.value === column && sortOrder.value !== null;
    };

    // Computed property for visible page numbers
    const visiblePages = computed(() => {
      const pages: (number | string)[] = [];
      const total = pagination.value.totalPages;
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


    const exportPayrollSummary = async (format: 'csv' | 'excel' = 'csv') => {
      try {
        $q.loading.show({
          message: 'Exporting payroll summary...',
        });

        // Prepare parameters - only send non-null values
        const params: any = {
          cutoffDateRangeId: props.selectedPayroll.key,
          search: searchQuery.value,
          sortBy: sortColumn.value,
          sortOrder: sortOrder.value,
          format: format,
        };

        if (selectedBranchIds.value.length > 0) {
          // Send comma-separated branch IDs - backend will need to be updated to support this
          params.branchIds = selectedBranchIds.value.join(',');
        }
        if (selectedEmploymentStatus.value !== null) {
          params.employmentStatusId = selectedEmploymentStatus.value;
        }
        if (selectedDepartment.value !== null) {
          params.departmentId = selectedDepartment.value;
        }
        if (selectedRole.value !== null) {
          params.roleId = selectedRole.value;
        }

        // Fetch export data
        const response = await api.get('/hr-processing/export-payroll-summary', { 
          params,
          responseType: format === 'excel' ? 'blob' : 'json'
        });

        if (response.status === 200 && response.data) {
          if (format === 'excel') {
            // Handle Excel download
            const blob = new Blob([response.data], { 
              type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
            });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            
            // Format filename with dates
            const startDate = props.selectedPayroll?.startDate?.date || 'start';
            const endDate = props.selectedPayroll?.endDate?.date || 'end';
            const filename = `payroll-summary-${startDate}-${endDate}.xlsx`;
            
            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            $q.notify({
              type: 'positive',
              message: 'Export completed successfully',
            });
          } else if (response.data.length > 0) {
          // Generate CSV content
          const headers = [
            'Employee Name',
            'Employee Code',
            'Branch',
            'Payroll Group',
            'Basic Salary',
            'Late',
            'Undertime',
            'Absent',
            'Basic Pay',
            'Allowance Pay',
            'Holiday Pay',
            'Overtime Pay',
            'Night Differential Pay',
            'Rest Day Pay',
            'Manual Earnings',
            'Gross Pay',
            'SSS',
            'PhilHealth',
            'Pag-IBIG',
            'Tax',
            'Manual Deductions',
            'Net Pay'
          ];

          const rows = response.data.map((row: any) => [
            row.employeeName,
            row.employeeCode,
            row.branch,
            row.payrollGroup,
            row.basicSalary.toFixed(2),
            row.late.toFixed(2),
            row.undertime.toFixed(2),
            row.absent.toFixed(2),
            row.basicPay.toFixed(2),
            row.allowancePay.toFixed(2),
            row.holidayPay.toFixed(2),
            row.overtimePay.toFixed(2),
            row.nightDifferentialPay.toFixed(2),
            row.restDayPay.toFixed(2),
            row.manualEarnings.toFixed(2),
            row.grossPay.toFixed(2),
            row.sss.toFixed(2),
            row.philhealth.toFixed(2),
            row.pagibig.toFixed(2),
            row.tax.toFixed(2),
            row.manualDeductions.toFixed(2),
            row.netPay.toFixed(2)
          ]);

          // Build CSV content
          const csvContent = [
            headers.join(','),
            ...rows.map((row: any[]) => 
              row.map((cell: any) => {
                // Escape quotes and wrap in quotes if contains comma
                const cellStr = String(cell);
                if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
                  return `"${cellStr.replace(/"/g, '""')}"`;
                }
                return cellStr;
              }).join(',')
            )
          ].join('\n');

          // Create and download file
          const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
          const link = document.createElement('a');
          const url = URL.createObjectURL(blob);
          
          // Format filename with dates
          const startDate = props.selectedPayroll?.startDate?.date || 'start';
          const endDate = props.selectedPayroll?.endDate?.date || 'end';
          const filename = `payroll-summary-${startDate}-${endDate}.csv`;
          
          link.setAttribute('href', url);
          link.setAttribute('download', filename);
          link.style.visibility = 'hidden';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          $q.notify({
            type: 'positive',
            message: 'Export completed successfully',
          });
          } else {
            $q.notify({
              type: 'warning',
              message: 'No data to export',
            });
          }
        }
      } catch (error) {
        handleAxiosError($q, error as AxiosError);
      } finally {
        $q.loading.hide();
      }
    };

    // Format employee name as "Last Name, First Name Middle Name"
    const formatEmployeeName = (employee: any) => {
      const firstName = employee.firstName || '';
      const lastName = employee.lastName || '';
      
      if (!firstName && !lastName) {
        return employee.fullName || '';
      }
      
      // Extract potential middle name from fullName
      const fullName = employee.fullName || '';
      const nameParts = fullName.trim().split(/\s+/);
      
      // Try to determine middle name by comparing with first and last names
      let middleName = '';
      if (nameParts.length > 2) {
        // Remove first and last name from the full name to get middle name(s)
        const remainingParts = nameParts.filter((part: string) => 
          part.toLowerCase() !== firstName.toLowerCase() && 
          part.toLowerCase() !== lastName.toLowerCase()
        );
        middleName = remainingParts.join(' ');
      }
      
      // Format as "Last Name, First Name Middle Name"
      if (middleName) {
        return `${lastName}, ${firstName} ${middleName}`;
      } else {
        return `${lastName}, ${firstName}`;
      }
    };

    // Manual override functionality
    const showManualApprovalButtons = ref(true); // TODO: Add permission check later
    const showOverrideDialog = ref(false);
    const overrideAction = ref<'approve' | 'reject'>('approve');
    const overrideRemarks = ref('');
    const pendingApprovalTasks = ref<Array<{id: string, approverName: string, level: number}>>([]);

    const showManualApprovalDialog = async (action: 'approve' | 'reject') => {
      overrideAction.value = action;
      overrideRemarks.value = '';
      
      // Fetch pending approval tasks
      try {
        const response = await api.get(`/payroll-approval/tasks/${props.selectedPayroll.key}`);
        pendingApprovalTasks.value = response.data;
      } catch (error) {
        pendingApprovalTasks.value = [];
      }
      
      showOverrideDialog.value = true;
    };

    const confirmManualOverride = async () => {
      const status = overrideAction.value === 'approve' ? 'APPROVED' : 'REJECTED';
      
      try {
        isLoading.value = true;
        
        // Include remarks in the request
        await api.post('/hr-processing/update-cutoff-date-range-status', {
          cutoffDateRangeId: props.selectedPayroll.key,
          status: status,
          remarks: overrideRemarks.value
        });
        
        $q.notify({
          type: overrideAction.value === 'approve' ? 'positive' : 'warning',
          message: `Payroll has been manually ${status.toLowerCase()}`,
          caption: `${pendingApprovalTasks.value.length} approvers have been notified`
        });
        
        closeOverrideDialog();
        emit('reload');
        dialog.value?.hide();
      } catch (error) {
        handleAxiosError($q, error as AxiosError);
      } finally {
        isLoading.value = false;
      }
    };

    const closeOverrideDialog = () => {
      showOverrideDialog.value = false;
      overrideRemarks.value = '';
      pendingApprovalTasks.value = [];
    };

    const showBankFileWritersDialog = ref(false);
    
    const handleBankFileWriters = () => {
      showBankFileWritersDialog.value = true;
    };
    
    const handleBankExportComplete = (data: { bankKey: string; filename: string }) => {
      console.log('Bank export completed:', data);
    };

    return {
      openEmployeeInfo,
      selectAll,
      text,
      selectRange,
      initializeDialog,
      showEmployeeInformation,
      getEmployeeSalaryComputation,
      employeeSalaryComputationData,
      payrollProcessingList,
      recomputeSalary,
      isLoading,
      dialog,
      tableWrapper,
      rejectPayroll,
      submitForApproval,
      DiscussionModule,
      handleSalaryUpdate,
      returnToTimekeeping,
      resubmitForApproval,
      authStore,
      returnToApproved,
      exportPayrollSummary,
      // Pagination and search
      currentPage,
      pageSize,
      pageSizeOptions,
      searchQuery,
      pagination,
      handlePageChange,
      handlePageSizeChange,
      handleSearch,
      debouncedSearch,
      visiblePages,
      // Sorting
      sortColumn,
      sortOrder,
      handleSort,
      getSortIcon,
      isSorted,
      // Grand totals
      grandTotal,
      isLoadingGrandTotal,
      fetchGrandTotal,
      // Filters
      selectedBranchIds,
      selectedEmploymentStatus,
      selectedDepartment,
      selectedRole,
      employmentStatusOptions,
      departmentOptions,
      roleOptions,
      loadFilterOptions,
      loadRoleOptions,
      onDepartmentChange,
      handleFilterChange,
      handleBranchChange,
      formatEmployeeName,
      // Manual override
      showManualApprovalButtons,
      showOverrideDialog,
      overrideAction,
      overrideRemarks,
      pendingApprovalTasks,
      showManualApprovalDialog,
      confirmManualOverride,
      closeOverrideDialog,
      handleBankFileWriters,
      showBankFileWritersDialog,
      handleBankExportComplete,
    };
  },
};
</script>
