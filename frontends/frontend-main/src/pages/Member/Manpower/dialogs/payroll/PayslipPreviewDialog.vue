<template>
  <q-dialog 
    ref="dialog" 
    v-model="isOpen"
    transition-show="slide-up"
    transition-hide="slide-down"
  >
    <q-card class="payslip-dialog" style="width: 900px; max-width: 90vw">
      <q-card-section class="row items-center q-pb-none print-hide">
        <div class="text-h6">Payslip Preview</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section class="payslip-container">
        <q-inner-loading :showing="isLoading">
          <q-spinner-gears size="50px" color="primary" />
        </q-inner-loading>
        <div class="payslip-content" id="payslip-print-area" v-if="!isLoading">
          <!-- Company Header -->
          <div class="company-header">
            <div class="company-logo">
              <img :src="companyLogoUrl || '/geer-erp-logo-s.ico'" alt="Company Logo" width="60" height="60" />
            </div>
            <div class="company-info">
              <div class="company-name">{{ companyName }}</div>
              <div class="company-address">{{ companyAddress }}</div>
              <div class="company-contact">{{ companyContact }}</div>
            </div>
            <div class="payslip-title">PAYSLIP</div>
          </div>

          <!-- Payroll Period Info -->
          <div class="period-info">
            <div class="period-row">
              <span class="label">Payroll Period:</span>
              <span class="value">{{ payrollPeriod }}</span>
            </div>
            <div class="period-row">
              <span class="label">Transaction Date:</span>
              <span class="value">{{ transactionDate }}</span>
            </div>
          </div>

          <!-- Employee Information -->
          <div class="employee-section">
            <div class="info-grid">
              <div class="info-item">
                <span class="label">Employee Name:</span>
                <span class="value">{{ employeeName }}</span>
              </div>
              <div class="info-item">
                <span class="label">Approver (Immediate Supervisor):</span>
                <span class="value">{{ approverName }}</span>
              </div>
              <div class="info-item">
                <span class="label">Employee's TIN:</span>
                <span class="value">{{ employeeTIN || '' }}</span>
              </div>
              <div class="info-item">
                <span class="label">Employee Type:</span>
                <span class="value">{{ employeeType }}</span>
              </div>
              <div class="info-item">
                <span class="label">Employee's SSS No:</span>
                <span class="value">{{ employeeSSS || '' }}</span>
              </div>
              <div class="info-item">
                <span class="label">Payroll Frequency:</span>
                <span class="value">{{ payrollFrequency }}</span>
              </div>
              <div class="info-item">
                <span class="label">Employee's Philhealth No:</span>
                <span class="value">{{ employeePhilhealth || '' }}</span>
              </div>
              <div class="info-item">
                <span class="label">Department:</span>
                <span class="value">{{ department }}</span>
              </div>
              <div class="info-item">
                <span class="label">Employee's HDMF:</span>
                <span class="value">{{ employeeHDMF || '' }}</span>
              </div>
              <div class="info-item">
                <span class="label">Position:</span>
                <span class="value">{{ position }}</span>
              </div>
            </div>
          </div>

          <!-- Earnings and Deductions Table -->
          <div class="payslip-table">
            <table>
              <thead>
                <tr>
                  <th class="earnings-header" colspan="2">Earnings</th>
                  <th class="deductions-header" colspan="2">Deductions</th>
                </tr>
                <tr>
                  <th class="sub-header"></th>
                  <th class="sub-header amount">Amount</th>
                  <th class="sub-header"></th>
                  <th class="sub-header amount">Amount</th>
                </tr>
              </thead>
              <tbody>
                <!-- Basic Salary Row -->
                <tr>
                  <td>Basic Salary</td>
                  <td class="amount">{{ formatAmount(basicSalary) }}</td>
                  <td>Absent</td>
                  <td class="amount">{{ formatAmount(absent) }}</td>
                </tr>
                <!-- Overtime Row -->
                <tr>
                  <td>Overtime</td>
                  <td class="amount">{{ formatAmount(overtime) }}</td>
                  <td>Late</td>
                  <td class="amount">{{ formatAmount(late) }}</td>
                </tr>
                <!-- Night Differential Row -->
                <tr>
                  <td>Night Differential</td>
                  <td class="amount">{{ formatAmount(nightDifferential) }}</td>
                  <td>Undertime</td>
                  <td class="amount">{{ formatAmount(undertime) }}</td>
                </tr>
                <!-- Night Differential OT Row -->
                <tr>
                  <td>Night Differential - Overtime</td>
                  <td class="amount">{{ formatAmount(nightDifferentialOvertime) }}</td>
                  <td>Philhealth</td>
                  <td class="amount">{{ formatAmount(philhealth) }}</td>
                </tr>
                <!-- Holiday Row -->
                <tr>
                  <td>Holiday</td>
                  <td class="amount">{{ formatAmount(holiday) }}</td>
                  <td>SSS</td>
                  <td class="amount">{{ formatAmount(sss) }}</td>
                </tr>
                <!-- Empty rows for spacing -->
                <tr>
                  <td></td>
                  <td class="amount"></td>
                  <td>HDMF</td>
                  <td class="amount">{{ formatAmount(hdmf) }}</td>
                </tr>
                <tr>
                  <td></td>
                  <td class="amount"></td>
                  <td>Tax</td>
                  <td class="amount">{{ formatAmount(tax) }}</td>
                </tr>
                <!-- Allowances -->
                <tr v-for="(allowance, index) in allowances" :key="`allowance-${index}`">
                  <td>{{ allowance.name }}</td>
                  <td class="amount">{{ formatAmount(allowance.amount) }}</td>
                  <td v-if="index === 0">{{ loans[0]?.name || '' }}</td>
                  <td v-if="index === 0" class="amount">{{ loans[0] ? formatAmount(loans[0].amount) : '' }}</td>
                  <td v-if="index !== 0 && loans[index]">{{ loans[index].name }}</td>
                  <td v-if="index !== 0 && loans[index]" class="amount">{{ formatAmount(loans[index].amount) }}</td>
                  <td v-if="index !== 0 && !loans[index]"></td>
                  <td v-if="index !== 0 && !loans[index]" class="amount"></td>
                </tr>
                <!-- Additional deductions if any -->
                <tr v-for="(deduction, index) in additionalDeductions" :key="`deduction-${index}`">
                  <td></td>
                  <td class="amount"></td>
                  <td>{{ deduction.name }}</td>
                  <td class="amount">{{ formatAmount(deduction.amount) }}</td>
                </tr>
                <!-- Total Row -->
                <tr class="total-row">
                  <td><strong>Total Gross Pay</strong></td>
                  <td class="amount"><strong>{{ formatAmount(totalGrossPay) }}</strong></td>
                  <td><strong>Total Deduction</strong></td>
                  <td class="amount"><strong>{{ formatAmount(totalDeduction) }}</strong></td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Net Pay -->
          <div class="net-pay-section">
            <div class="net-pay-label">NETPAY (ROUNDED)</div>
            <div class="net-pay-amount">{{ formatAmount(netPay) }}</div>
          </div>

          <!-- Leave Credits and Year to Date -->
          <div class="bottom-section">
            <div class="leave-section">
              <h4>Leaves</h4>
              <div class="leave-row">
                <span>Remaining Vacation Leave:</span>
                <span>{{ remainingVacationLeave || '0.00' }}</span>
              </div>
              <div class="leave-row">
                <span>Leave Credit:</span>
                <span>{{ leaveCredit || '0.00' }}</span>
              </div>
            </div>
            <div class="ytd-section">
              <h4>Year to Date</h4>
              <div class="ytd-row">
                <span>Gross Salary:</span>
                <span>{{ formatAmount(ytdGrossSalary) }}</span>
              </div>
              <div class="ytd-row">
                <span>Tax Withheld:</span>
                <span>{{ formatAmount(ytdTaxWithheld) }}</span>
              </div>
              <div class="ytd-row">
                <span>Gov't Deduction:</span>
                <span></span>
              </div>
              <div class="ytd-sub-row">
                <span>Philhealth:</span>
                <span>{{ formatAmount(ytdPhilhealth) }}</span>
              </div>
              <div class="ytd-sub-row">
                <span>SSS:</span>
                <span>{{ formatAmount(ytdSSS) }}</span>
              </div>
              <div class="ytd-sub-row">
                <span>HDMF:</span>
                <span>{{ formatAmount(ytdHDMF) }}</span>
              </div>
            </div>
          </div>
        </div>
      </q-card-section>

      <q-card-actions align="right" class="print-hide">
        <q-btn 
          flat 
          label="CLOSE" 
          color="grey" 
          v-close-popup 
        />
        <q-btn 
          unelevated 
          label="PRINT" 
          color="primary" 
          @click="printPayslip" 
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script lang="ts">
import { defineComponent, computed, ref, watch } from 'vue';
import { date } from 'quasar';
import { api } from 'src/boot/axios';
import type { SalaryInformationListResponse } from '@shared/response';

export default defineComponent({
  name: 'PayslipPreviewDialog',
  props: {
    modelValue: {
      type: Boolean,
      default: false,
    },
    employeeData: {
      type: Object as () => SalaryInformationListResponse | null,
      default: null,
    },
    cutoffData: {
      type: Object,
      required: false,
    },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const dialog = ref();
    
    const isOpen = computed({
      get: () => props.modelValue,
      set: (value) => emit('update:modelValue', value),
    });

    // Loading state
    const isLoading = ref(false);
    const payslipData = ref<any>(null);

    // Company Information (will be replaced by API data)
    const companyName = ref('');
    const companyAddress = ref('');
    const companyContact = ref('');
    const companyLogoUrl = ref('');

    // Employee Information
    const employeeName = computed(() => 
      props.employeeData?.employeeInformation?.accountDetails?.fullName || ''
    );
    
    const employeeTIN = computed(() => 
      props.employeeData?.employeeInformation?.governmentDetails?.tinNumber || ''
    );
    
    const employeeSSS = computed(() => 
      props.employeeData?.employeeInformation?.governmentDetails?.sssNumber || ''
    );
    
    const employeePhilhealth = computed(() => 
      props.employeeData?.employeeInformation?.governmentDetails?.phicNumber || ''
    );
    
    const employeeHDMF = computed(() => 
      props.employeeData?.employeeInformation?.governmentDetails?.hdmfNumber || ''
    );
    
    const department = computed(() => 
      props.employeeData?.employeeInformation?.branch?.name || ''
    );
    
    const position = computed(() => 
      (props.employeeData?.employeeInformation?.jobDetails as any)?.position || ''
    );
    
    const employeeType = computed(() => 
      (props.employeeData?.employeeInformation?.contractDetails as any)?.employmentType || ''
    );
    
    const payrollFrequency = computed(() => {
      const cutoffType = (props.employeeData?.salaryComputation?.summary?.cutoffType as any)?.name;
      return cutoffType || '';
    });

    // Dynamic approver name from backend
    const approverName = ref('');

    // Payroll Period
    const payrollPeriod = computed(() => {
      if (props.cutoffData?.startDate && props.cutoffData?.endDate) {
        const start = date.formatDate(props.cutoffData.startDate.raw, 'MMMM DD, YYYY');
        const end = date.formatDate(props.cutoffData.endDate.raw, 'MMMM DD, YYYY');
        return `${start} to ${end}`;
      }
      return '';
    });

    const transactionDate = computed(() => {
      if (payslipData.value?.transactionDate) {
        // Handle DateFormat object from backend
        const dateObj = payslipData.value.transactionDate.raw || payslipData.value.transactionDate;
        return date.formatDate(dateObj, 'MMMM DD, YYYY');
      }
      return date.formatDate(new Date(), 'MMMM DD, YYYY');
    });

    // Earnings
    const basicSalary = computed(() => 
      props.employeeData?.salaryComputation?.summary?.basicPay || 0
    );
    
    const overtime = computed(() => 
      props.employeeData?.salaryComputation?.summary?.additionalEarnings?.overtime || 0
    );
    
    const nightDifferential = computed(() => 
      props.employeeData?.salaryComputation?.summary?.additionalEarnings?.nightDifferential || 0
    );
    
    const nightDifferentialOvertime = computed(() => 
      props.employeeData?.salaryComputation?.summary?.additionalEarnings?.nightDifferentialOvertime || 0
    );
    
    const holiday = computed(() => {
      const regular = props.employeeData?.salaryComputation?.summary?.additionalEarnings?.regularHoliday || 0;
      const special = props.employeeData?.salaryComputation?.summary?.additionalEarnings?.specialHoliday || 0;
      return regular + special;
    });

    // Deductions
    const absent = computed(() => 
      props.employeeData?.salaryComputation?.summary?.deductions?.absent || 0
    );
    
    const late = computed(() => 
      props.employeeData?.salaryComputation?.summary?.deductions?.late || 0
    );
    
    const undertime = computed(() => 
      props.employeeData?.salaryComputation?.summary?.deductions?.undertime || 0
    );
    
    const philhealth = computed(() => 
      props.employeeData?.salaryComputation?.summary?.contributions?.philhealth || 0
    );
    
    const sss = computed(() => 
      props.employeeData?.salaryComputation?.summary?.contributions?.sss || 0
    );
    
    const hdmf = computed(() => 
      props.employeeData?.salaryComputation?.summary?.contributions?.pagibig || 0
    );
    
    const tax = computed(() => 
      props.employeeData?.salaryComputation?.summary?.contributions?.withholdingTax || 0
    );

    // Allowances - now from API data
    const allowances = computed(() => {
      if (!payslipData.value) return [] as Array<{ name: string; amount: number }>;
      
      const regularAllowances = payslipData.value.allowances || [];
      const manualAllowances = payslipData.value.manualAdjustments?.allowances || [];
      
      return [...regularAllowances, ...manualAllowances];
    });
    
    // Loans - now from API data
    const loans = computed(() => {
      if (!payslipData.value) return [] as Array<{ name: string; amount: number }>;
      return payslipData.value.loans || [];
    });
    
    // Additional deductions - now from API data
    const additionalDeductions = computed(() => {
      if (!payslipData.value) return [] as Array<{ name: string; amount: number }>;
      
      const regularDeductions = payslipData.value.additionalDeductions || [];
      const manualDeductions = payslipData.value.manualAdjustments?.deductions || [];
      
      return [...regularDeductions, ...manualDeductions];
    });

    // Totals
    const totalGrossPay = computed(() => 
      props.employeeData?.salaryComputation?.summary?.grossPay || 0
    );
    
    const totalDeduction = computed(() => {
      const govContributions = props.employeeData?.salaryComputation?.summary?.totalGovernmentContribution || 0;
      const loanDeductions = props.employeeData?.salaryComputation?.summary?.totalLoan || 0;
      const timeDeductions = props.employeeData?.salaryComputation?.summary?.totalDeduction || 0;
      return govContributions + loanDeductions + timeDeductions;
    });
    
    const netPay = computed(() => 
      Math.round(props.employeeData?.salaryComputation?.summary?.netPay || 0)
    );

    // Leave credits - placeholder values
    const remainingVacationLeave = ref('0.00');
    const leaveCredit = ref('0.00');

    // Year to date - placeholder values (should be fetched from backend)
    const ytdGrossSalary = ref(0);
    const ytdTaxWithheld = ref(0);
    const ytdPhilhealth = ref(0);
    const ytdSSS = ref(0);
    const ytdHDMF = ref(0);

    const formatAmount = (amount: number) => {
      return '₱ ' + amount.toLocaleString('en-US', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
      });
    };

    const printPayslip = () => {
      window.print();
    };

    // Fetch payslip info from backend
    const fetchPayslipInfo = async () => {
      if (!props.employeeData || !props.cutoffData) return;
      
      isLoading.value = true;
      try {
        const timekeepingCutoffId = props.employeeData.salaryComputation.timekeepingCutoffId;
        const cutoffDateRangeId = props.cutoffData.key || props.cutoffData.id;
        
        const response = await api.get('/hr-processing/payslip-info', {
          params: {
            employeeTimekeepingCutoffId: timekeepingCutoffId,
            cutoffDateRangeId: cutoffDateRangeId,
          },
        });
        
        if (response.data) {
          payslipData.value = response.data;
          
          // Update company information
          companyName.value = response.data.company?.name || '';
          companyAddress.value = response.data.company?.address || response.data.staticData?.companyAddress || '';
          companyContact.value = response.data.company?.phone || '';
          companyLogoUrl.value = response.data.company?.logoUrl || '';
          
          // Update transaction date if available
          if (response.data.transactionDate) {
            // Transaction date will be formatted when displayed
          }
          
          // Update leave credits from actual data
          if (response.data.leaveCredits) {
            // Use vacation leave data if available
            if (response.data.leaveCredits.vacation) {
              remainingVacationLeave.value = response.data.leaveCredits.vacation.remaining;
              leaveCredit.value = response.data.leaveCredits.vacation.total;
            } else {
              // Fallback to static data if no vacation leave found
              remainingVacationLeave.value = '0.00';
              leaveCredit.value = '0.00';
            }
          }
          
          // Update approver
          if (response.data.staticData?.approverName) {
            approverName.value = response.data.staticData.approverName;
          } else {
            // Show appropriate text based on payroll status
            const status = response.data.payrollStatus;
            if (status === 'PENDING' || status === 'PROCESSED' || status === 'TIMEKEEPING') {
              approverName.value = '';
            } else {
              approverName.value = '';
            }
          }
          
          // Update YTD values
          if (response.data.staticData?.yearToDate) {
            ytdGrossSalary.value = response.data.staticData.yearToDate.grossSalary;
            ytdTaxWithheld.value = response.data.staticData.yearToDate.taxWithheld;
            ytdPhilhealth.value = response.data.staticData.yearToDate.philhealth;
            ytdSSS.value = response.data.staticData.yearToDate.sss;
            ytdHDMF.value = response.data.staticData.yearToDate.hdmf;
          }
        }
      } catch (error) {
        console.error('Error fetching payslip info:', error);
      } finally {
        isLoading.value = false;
      }
    };

    // Watch for dialog open and fetch data
    watch(isOpen, (newValue) => {
      if (newValue) {
        fetchPayslipInfo();
      }
    });

    return {
      dialog,
      isOpen,
      isLoading,
      companyName,
      companyAddress,
      companyContact,
      companyLogoUrl,
      employeeName,
      employeeTIN,
      employeeSSS,
      employeePhilhealth,
      employeeHDMF,
      department,
      position,
      employeeType,
      payrollFrequency,
      approverName,
      payrollPeriod,
      transactionDate,
      basicSalary,
      overtime,
      nightDifferential,
      nightDifferentialOvertime,
      holiday,
      absent,
      late,
      undertime,
      philhealth,
      sss,
      hdmf,
      tax,
      allowances,
      loans,
      additionalDeductions,
      totalGrossPay,
      totalDeduction,
      netPay,
      remainingVacationLeave,
      leaveCredit,
      ytdGrossSalary,
      ytdTaxWithheld,
      ytdPhilhealth,
      ytdSSS,
      ytdHDMF,
      formatAmount,
      printPayslip,
    };
  },
});
</script>

<style lang="scss" scoped>
.payslip-dialog {
  background: #f5f5f5;
}

.payslip-container {
  overflow-y: auto;
  max-height: 70vh;
  padding: 20px;
}

.payslip-content {
  background: white;
  max-width: 800px;
  margin: 0 auto;
  padding: 40px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  font-family: Arial, sans-serif;
  font-size: 12px;
  line-height: 1.5;
}

.company-header {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  border-bottom: 2px solid #333;
  padding-bottom: 10px;
}

.company-logo {
  margin-right: 20px;
}

.company-info {
  flex: 1;
  
  .company-name {
    font-weight: bold;
    font-size: 16px;
  }
  
  .company-address,
  .company-contact {
    font-size: 11px;
    color: #666;
  }
}

.payslip-title {
  font-size: 24px;
  font-weight: bold;
  color: #2c5aa0;
}

.period-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
  padding: 10px;
  background: #f8f8f8;
  
  .period-row {
    .label {
      font-weight: bold;
      margin-right: 10px;
    }
  }
}

.employee-section {
  margin-bottom: 20px;
  
  .info-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    
    .info-item {
      display: flex;
      align-items: center;
      
      .label {
        font-weight: bold;
        min-width: 180px;
        margin-right: 10px;
      }
      
      .value {
        flex: 1;
      }
    }
  }
}

.payslip-table {
  margin-bottom: 20px;
  
  table {
    width: 100%;
    border-collapse: collapse;
    
    th, td {
      padding: 8px;
      text-align: left;
      border: 1px solid #ddd;
    }
    
    thead {
      tr:first-child {
        th {
          background: #4a4a4a;
          color: white;
          font-weight: bold;
          text-align: center;
          
          &.earnings-header {
            background: #4a4a4a;
          }
          
          &.deductions-header {
            background: #4a4a4a;
          }
        }
      }
      
      tr:nth-child(2) {
        th {
          background: #f0f0f0;
          font-weight: normal;
          
          &.amount {
            text-align: right;
          }
        }
      }
    }
    
    tbody {
      td {
        &.amount {
          text-align: right;
        }
      }
      
      .total-row {
        td {
          background: #f0f0f0;
          font-weight: bold;
        }
      }
    }
  }
}

.net-pay-section {
  background: #2c5aa0;
  color: white;
  padding: 15px;
  text-align: center;
  margin-bottom: 20px;
  
  .net-pay-label {
    font-size: 14px;
    margin-bottom: 5px;
  }
  
  .net-pay-amount {
    font-size: 24px;
    font-weight: bold;
  }
}

.bottom-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
  
  h4 {
    margin: 0 0 10px 0;
    font-size: 14px;
    font-weight: bold;
    border-bottom: 1px solid #333;
    padding-bottom: 5px;
  }
  
  .leave-row,
  .ytd-row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 5px;
  }
  
  .ytd-sub-row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 5px;
    padding-left: 20px;
  }
}

@media print {
  @page {
    size: A4;
    margin: 10mm;
  }
  
  html, body {
    height: 100% !important;
    width: 100% !important;
    margin: 0 !important;
    padding: 0 !important;
    font-size: 10px !important;
  }
  
  .print-hide {
    display: none !important;
  }
  
  .q-dialog,
  .q-dialog__inner,
  .q-dialog__backdrop {
    display: none !important;
  }
  
  .payslip-dialog {
    display: block !important;
    background: white !important;
    width: 100% !important;
    max-width: 100% !important;
    position: static !important;
    box-shadow: none !important;
    border: none !important;
  }
  
  .payslip-container {
    display: block !important;
    padding: 0 !important;
    max-height: none !important;
    height: auto !important;
    position: static !important;
    width: 100% !important;
  }
  
  .payslip-content {
    display: block !important;
    box-shadow: none !important;
    padding: 10px !important;
    margin: 0 !important;
    max-width: 100% !important;
    width: 100% !important;
    position: static !important;
    font-size: 10px !important;
    line-height: 1.2 !important;
  }
  
  #payslip-print-area {
    height: auto !important;
    width: 100% !important;
    position: static !important;
    display: block !important;
  }
  
  /* Reduce font sizes for print */
  .company-header {
    margin-bottom: 10px !important;
    padding-bottom: 5px !important;
  }
  
  .company-info .company-name {
    font-size: 14px !important;
  }
  
  .company-info .company-address,
  .company-info .company-contact {
    font-size: 9px !important;
  }
  
  .payslip-title {
    font-size: 18px !important;
  }
  
  .period-info {
    padding: 5px !important;
    margin-bottom: 10px !important;
    font-size: 10px !important;
  }
  
  .employee-section {
    margin-bottom: 10px !important;
  }
  
  .info-grid {
    gap: 5px !important;
  }
  
  .info-item {
    font-size: 9px !important;
  }
  
  .info-item .label {
    min-width: 140px !important;
    font-size: 9px !important;
  }
  
  /* Reduce table sizes */
  .payslip-table {
    width: 100% !important;
    margin-bottom: 10px !important;
  }
  
  .payslip-table table {
    width: 100% !important;
    font-size: 9px !important;
    page-break-inside: avoid !important;
  }
  
  .payslip-table th,
  .payslip-table td {
    padding: 4px !important;
    font-size: 9px !important;
  }
  
  .payslip-table thead tr:first-child th {
    background: #4a4a4a !important;
    color: white !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    color-adjust: exact !important;
  }
  
  .payslip-table .total-row td {
    background: #f0f0f0 !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    color-adjust: exact !important;
  }
  
  /* Reduce net pay section */
  .net-pay-section {
    padding: 8px !important;
    margin-bottom: 10px !important;
    background: #2c5aa0 !important;
    color: white !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    color-adjust: exact !important;
  }
  
  .net-pay-label {
    font-size: 11px !important;
    color: white !important;
  }
  
  .net-pay-amount {
    font-size: 16px !important;
    color: white !important;
  }
  
  /* Reduce bottom section */
  .bottom-section {
    gap: 15px !important;
  }
  
  .bottom-section h4 {
    font-size: 11px !important;
    margin: 0 0 5px 0 !important;
    padding-bottom: 3px !important;
  }
  
  .leave-row,
  .ytd-row,
  .ytd-sub-row {
    font-size: 9px !important;
    margin-bottom: 3px !important;
  }
  
  .ytd-sub-row {
    padding-left: 15px !important;
  }
  
  /* Remove any Quasar dialog wrappers */
  .q-dialog__inner > div {
    position: static !important;
  }
}
</style>