<template>
  <div>
    <GlobalWidgetCard>
      <!-- Title -->
      <template #title>My Payslip Summary</template>

      <!-- Content -->
      <template #content>
        <div class="payslip-summary-container">
          <div class="date-section row items-center justify-between q-mb-sm">
            <div class="input-date col">
              <global-widget-date-picker v-model="dateFrom" label="Date From" />
            </div>
            <div class="input-date col">
              <global-widget-date-picker v-model="dateTo" label="Date To" />
            </div>
            <g-button label="Generate" :rounded="true" color="primary" @click="generateReport" />
          </div>

          <div class="summary-section">
            <!-- Loading state -->
            <div v-if="isLoading" class="text-center q-pa-lg">
              <q-spinner-gears size="50px" color="primary" />
              <div class="q-mt-md text-grey">Loading payslips...</div>
            </div>

            <!-- Empty state -->
            <div
              v-else-if="!isLoading && payslips.length === 0"
              class="text-center q-pa-lg text-grey"
            >
              No payslips available for the selected period.
            </div>

            <!-- Payslip cards -->
            <global-widget-card-box
              v-else
              v-for="payslip in paginatedPayslips"
              :key="payslip.id"
              class="q-mb-sm cursor-pointer"
              @click="openPayslipDialog(payslip)"
            >
              <div class="summary-content">
                <!-- Title -->
                <global-widget-card-box-title
                  :title="payslip.cutOffPeriod"
                  :icon="'forward_to_inbox'"
                  :iconColor="'#2F40C4'"
                />

                <div class="row items-center justify-between q-mt-sm">
                  <global-widget-card-box-subtitle
                    :label="'Payroll For'"
                    :value="payslip.payrollDate"
                  />
                  <span class="text-body-small text-grey">{{ payslip.timeAgo }}</span>
                </div>
              </div>
            </global-widget-card-box>
          </div>
        </div>
      </template>

      <!-- Footer -->
      <template #footer>
        <global-widget-pagination :pagination="pagination" @update:page="updatePage" />
      </template>
    </GlobalWidgetCard>

    <!-- Payslip Preview Dialog -->
    <payslip-preview-dialog
      v-model="showPayslipDialog"
      :employee-data="selectedEmployeeData"
      :cutoff-data="selectedCutoffData"
    />

    <!-- Global Loading Dialog -->
    <q-dialog v-model="isLoadingPayslip" persistent seamless>
      <q-spinner color="primary" size="3em" :thickness="2" />
    </q-dialog>
  </div>
</template>

<style scoped src="./PayslipSummaryWidget.scss"></style>

<script>
import { defineComponent, ref, computed, onMounted, getCurrentInstance, watch } from 'vue';
import { api } from 'src/boot/axios';
import { useAuthStore } from 'src/stores/auth';
import GlobalWidgetCard from '../../../../components/shared/global/GlobalWidgetCard.vue';
import GlobalWidgetCardBox from '../../../../components/shared/global/GlobalWidgetCardBox.vue';
import GlobalWidgetCardBoxTitle from '../../../../components/shared/global/GlobalWidgetCardBoxTitle.vue';
import GlobalWidgetCardBoxSubtitle from '../../../../components/shared/global/GlobalWidgetCardBoxSubtitle.vue';
import GlobalWidgetDatePicker from '../../../../components/shared/global/GlobalWidgetDatePicker.vue';
import GlobalWidgetPagination from '../../../../components/shared/global/GlobalWidgetPagination.vue';
import PayslipPreviewDialog from '../../Manpower/dialogs/payroll/PayslipPreviewDialog.vue';
import GButton from 'src/components/shared/buttons/GButton.vue';

export default defineComponent({
  name: 'PayslipSummaryWidget',
  components: {
    GlobalWidgetCard,
    GlobalWidgetCardBox,
    GlobalWidgetCardBoxTitle,
    GlobalWidgetCardBoxSubtitle,
    GlobalWidgetDatePicker,
    GlobalWidgetPagination,
    PayslipPreviewDialog,
    GButton,
  },
  setup() {
    const instance = getCurrentInstance();
    const $q = instance?.proxy?.$q;
    const authStore = useAuthStore();

    const dateFrom = ref('');
    const dateTo = ref('');
    const currentPage = ref(1);
    const itemsPerPage = ref(5);
    const isLoading = ref(false);
    const payslips = ref([]);
    const isLoadingPayslip = ref(false);

    // Dialog related
    const showPayslipDialog = ref(false);
    const selectedEmployeeData = ref(null);
    const selectedCutoffData = ref(null);

    // Pagination computed properties
    const pagination = computed(() => ({
      currentPage: currentPage.value,
      totalItems: payslips.value.length,
      itemsPerPage: itemsPerPage.value,
    }));

    const paginatedPayslips = computed(() => {
      const start = (currentPage.value - 1) * itemsPerPage.value;
      const end = start + itemsPerPage.value;
      return payslips.value.slice(start, end);
    });

    // Calculate time ago
    const calculateTimeAgo = (dateInput) => {
      const targetDate = new Date(dateInput);
      const now = new Date();
      const diffTime = Math.abs(now - targetDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 0) return 'Today';
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays} days ago`;
      if (diffDays < 14) return '1 week ago';
      if (diffDays < 21) return '2 weeks ago';
      if (diffDays < 28) return '3 weeks ago';
      if (diffDays < 60) return '1 month ago';
      if (diffDays < 90) return '2 months ago';
      return `${Math.floor(diffDays / 30)} months ago`;
    };

    // Fetch employee's payslips
    const fetchEmployeePayslips = async () => {
      isLoading.value = true;
      try {
        // Get current user's account ID
        const accountId = authStore.accountInformation?.id;
        if (!accountId) {
          console.log('Account information not loaded yet, waiting...');
          // Try again after a short delay if account info is not loaded
          setTimeout(() => {
            if (authStore.accountInformation?.id) {
              fetchEmployeePayslips();
            }
          }, 500);
          return;
        }

        // Fetch employee payslips from dashboard endpoint
        const response = await api.get('/dashboard/employee-payslips', {
          params: {
            page: 1,
            limit: 100, // Get all payslips for now
          },
        });

        if (response.data?.payslips) {
          // Transform the response to match widget format
          payslips.value = response.data.payslips.map((payslip) => ({
            id: payslip.id,
            cutOffPeriod: payslip.cutOffPeriod,
            payrollDate: payslip.payrollDate,
            timeAgo: calculateTimeAgo(payslip.processDate),
            employeeTimekeepingCutoffId: payslip.employeeTimekeepingCutoffId,
            cutoffDateRangeId: payslip.cutoffDateRangeId,
            grossPay: payslip.grossPay,
            netPay: payslip.netPay,
            totalDeductions: payslip.totalDeductions,
            cutoffData: {
              key: payslip.cutoffDateRangeId,
              id: payslip.cutoffDateRangeId,
              startDate: { raw: payslip.startDate },
              endDate: { raw: payslip.endDate },
              cutoffCode: payslip.cutoffCode,
            },
            // For the dialog, we'll need to fetch employee data when card is clicked
          }));
        }
      } catch (error) {
        console.error('Error fetching payslips:', error);
        $q?.notify({
          type: 'negative',
          message: 'Failed to load payslips. Please try again later.',
        });
      } finally {
        isLoading.value = false;
      }
    };

    // Generate report with date filter
    const generateReport = async () => {
      if (!dateFrom.value || !dateTo.value) {
        $q?.notify({
          type: 'warning',
          message: 'Please select both date from and date to.',
        });
        return;
      }

      isLoading.value = true;
      try {
        const accountId = authStore.accountInformation?.id;
        if (!accountId) {
          $q?.notify({
            type: 'warning',
            message: 'Account information not loaded. Please try again.',
          });
          isLoading.value = false;
          return;
        }

        // Fetch employee payslips with date filter
        const response = await api.get('/dashboard/employee-payslips', {
          params: {
            startDate: dateFrom.value,
            endDate: dateTo.value,
            page: 1,
            limit: 100,
          },
        });

        if (response.data?.payslips) {
          // Transform the response to match widget format
          payslips.value = response.data.payslips.map((payslip) => ({
            id: payslip.id,
            cutOffPeriod: payslip.cutOffPeriod,
            payrollDate: payslip.payrollDate,
            timeAgo: calculateTimeAgo(payslip.processDate),
            employeeTimekeepingCutoffId: payslip.employeeTimekeepingCutoffId,
            cutoffDateRangeId: payslip.cutoffDateRangeId,
            grossPay: payslip.grossPay,
            netPay: payslip.netPay,
            totalDeductions: payslip.totalDeductions,
            cutoffData: {
              key: payslip.cutoffDateRangeId,
              id: payslip.cutoffDateRangeId,
              startDate: { raw: payslip.startDate },
              endDate: { raw: payslip.endDate },
              cutoffCode: payslip.cutoffCode,
            },
          }));
          currentPage.value = 1; // Reset to first page
        }
      } catch (error) {
        console.error('Error generating report:', error);
        $q?.notify({
          type: 'negative',
          message: 'Failed to generate report. Please try again later.',
        });
      } finally {
        isLoading.value = false;
      }
    };

    // Open payslip dialog
    const openPayslipDialog = async (payslip) => {
      isLoadingPayslip.value = true;
      try {
        // If we don't have employee data yet, fetch it
        if (!payslip.employeeData) {
          const accountId = authStore.accountInformation?.id;
          const response = await api.get(
            `/hr-processing/employee-computation/${accountId}/${payslip.cutoffDateRangeId}`
          );

          if (response.data) {
            selectedEmployeeData.value = response.data;
          } else {
            $q?.notify({
              type: 'warning',
              message: 'Unable to load payslip details.',
            });
            return;
          }
        } else {
          selectedEmployeeData.value = payslip.employeeData;
        }

        selectedCutoffData.value = payslip.cutoffData;
        showPayslipDialog.value = true;
      } catch (error) {
        console.error('Error loading payslip details:', error);
        $q?.notify({
          type: 'negative',
          message: 'Failed to load payslip details. Please try again.',
        });
      } finally {
        isLoadingPayslip.value = false;
      }
    };

    const updatePage = (page) => {
      currentPage.value = page;
    };

    // Watch for account information changes
    watch(
      () => authStore.accountInformation?.id,
      (newId, oldId) => {
        if (newId && !oldId && payslips.value.length === 0) {
          // Account information just became available, fetch payslips
          fetchEmployeePayslips();
        }
      }
    );

    // Load payslips on component mount
    onMounted(() => {
      // Only fetch if account information is already available
      if (authStore.accountInformation?.id) {
        fetchEmployeePayslips();
      }
    });

    return {
      dateFrom,
      dateTo,
      payslips,
      paginatedPayslips,
      pagination,
      isLoading,
      isLoadingPayslip,
      showPayslipDialog,
      selectedEmployeeData,
      selectedCutoffData,
      generateReport,
      updatePage,
      openPayslipDialog,
    };
  },
});
</script>
