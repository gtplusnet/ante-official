<template>
  <GlobalWidgetCard class="request-panel-container">
    <!-- Title -->
    <template #title>Request Center</template>
    <!-- Actions -->
    <template #actions>
      <GButton color="light-grey" size="sm" round variant="text" icon="add">
        <q-menu auto-close anchor="bottom end" self="top end">
          <q-list>
            <div class="q-item cursor-pointer" clickable @click="isLeaveFormDialogOpen = true">
              <div class="row items-center">
                <q-icon name="event_busy" :style="{ color: '#00897B', fontSize: '20px' }" />
                <div class="q-ml-sm text-label-medium">Leave</div>
              </div>
            </div>
            <div class="q-item cursor-pointer" clickable @click="isOvertimeApplicationFormDialogOpen = true">
              <div class="row items-center">
                <q-icon name="alarm_add" :style="{ color: '#FB8C00', fontSize: '20px' }" />
                <div class="q-ml-sm text-label-medium">Overtime</div>
              </div>
            </div>
            <div class="q-item cursor-pointer" clickable @click="openOBandCADialog('OFFICIAL_BUSINESS_FORM')">
              <div class="row items-center">
                <q-icon name="work_history" :style="{ color: '#1E88E5', fontSize: '20px' }" />
                <div class="q-ml-sm text-label-medium">Official Business</div>
              </div>
            </div>
            <div class="q-item cursor-pointer" clickable @click="openOBandCADialog('CERTIFICATE_OF_ATTENDANCE')">
              <div class="row items-center">
                <q-icon name="event_available" :style="{ color: '#43A047', fontSize: '20px' }" />
                <div class="q-ml-sm text-label-medium">Certificate of Attendance</div>
              </div>
            </div>
            <div class="q-item cursor-pointer" clickable @click="isAddViewScheduleAdjustmentDialogOpen = true">
              <div class="row items-center">
                <q-icon name="brightness_6" :style="{ color: '#8E24AA', fontSize: '20px' }" />
                <div class="q-ml-sm text-label-medium">Schedule Adjustment</div>
              </div>
            </div>
          </q-list>
        </q-menu>
      </GButton>
    </template>

    <!-- Content -->
    <template #content>
      <div class="request-wrapper">
        <q-inner-loading :showing="isLoading">
          <q-spinner-gears size="50px" color="primary" />
        </q-inner-loading>
        <global-widget-card-empty-content
          v-if="filings.length === 0"
          image="/images/empty-content-requst-panel.webp"
        >
          <template #title>No Pending Requests.</template>
          <template #description>Start one when needed.</template>
        </global-widget-card-empty-content>
        <RequestCard v-else v-for="filing in filings" :key="filing.id" :filing="filing" @click="openFilingDialog(filing)" />
      </div>
    </template>

    <!-- Footer -->
    <template #footer>
      <global-widget-pagination
        :pagination="{
          currentPage: currentPage,
          totalItems: totalFilings,
          itemsPerPage: pageSize,
        }"
        @update:page="handlePageChange"
      />
    </template>

    <!-- Overtime Application Form Dialog -->
    <AddViewOvertimeApplicationFormDialog v-model="isOvertimeApplicationFormDialogOpen" :filing="currentSelectedFiling" @hide="currentSelectedFiling = null" />
    <!-- Official Business Form Dialog and Certificate of Attendance Form Dialog -->
    <AddViewOfficialBusinessAndCertificateOfAttendanceDialog
      :officialBusinessAndCertificateOfAttendanceData="officialBusinessAndCertificateOfAttendanceData"
      :filing="currentSelectedFiling"
      v-model="isOfficialBusinessAndCertificateOfAttendanceFormDialogOpen"
      @hide="currentSelectedFiling = null"
    />
    <!-- Leave Form Dialog -->
    <AddViewLeaveFormDialog v-model="isLeaveFormDialogOpen" :filing="currentSelectedFiling" @hide="currentSelectedFiling = null" />
    <!-- Add View Schedule Adjustment Dialog -->
    <AddViewScheduleAdjustmentDialog v-model="isAddViewScheduleAdjustmentDialogOpen" :filing="currentSelectedFiling" @hide="currentSelectedFiling = null" />
  </GlobalWidgetCard>
</template>

<script lang="ts">
import { defineAsyncComponent, ref, onMounted } from 'vue';
import RequestCard from 'src/pages/Member/Dashboard/RequestPanelWidget/Partial/cards/RequestCard.vue';
import GlobalWidgetCard from 'src/components/shared/global/GlobalWidgetCard.vue';
import GlobalWidgetPagination from 'src/components/shared/global/GlobalWidgetPagination.vue';
import GButton from 'src/components/shared/buttons/GButton.vue';

// Lazy-loaded dialogs (ALL dialogs must be lazy loaded - CLAUDE.md)
const AddViewOvertimeApplicationFormDialog = defineAsyncComponent(() =>
  import('../../dialogs/ManpowerRequestPanelAddViewOvertimeApplicationFormDialog.vue')
);
const AddViewOfficialBusinessAndCertificateOfAttendanceDialog = defineAsyncComponent(() =>
  import('../../dialogs/ManpowerRequestPanelAddViewOfficialBusinessAndCertificateOfAttendanceDialog.vue')
);
const AddViewLeaveFormDialog = defineAsyncComponent(() =>
  import('../../dialogs/ManpowerRequestPanelAddViewLeaveFormDialog.vue')
);
const AddViewScheduleAdjustmentDialog = defineAsyncComponent(() =>
  import('../../dialogs/ManpowerRequestPanelAddViewScheduleAdjustmentDialog.vue')
);
import { api } from 'src/boot/axios';
import { handleAxiosError } from 'src/utility/axios.error.handler';
import { AxiosError } from 'axios';
import { useQuasar } from 'quasar';
import type { Filing } from 'src/pages/Member/Dashboard/RequestPanelWidget/types/filing.types';
import { useFilings } from 'src/pages/Member/Dashboard/RequestPanelWidget/composables/useFilings';
import type { FilingsResponse } from 'src/pages/Member/Dashboard/RequestPanelWidget/types/filing.types';
import GlobalWidgetCardEmptyContent from 'src/components/shared/global/GlobalWidgetCardEmptyContent.vue';

export default {
  name: 'ManpowerRequestPanel',
  components: {
    AddViewOvertimeApplicationFormDialog,
    AddViewOfficialBusinessAndCertificateOfAttendanceDialog,
    AddViewLeaveFormDialog,
    AddViewScheduleAdjustmentDialog,
    RequestCard,
    GlobalWidgetCard,
    GlobalWidgetPagination,
    GButton,
    GlobalWidgetCardEmptyContent,
  },
  setup() {
    const isOvertimeApplicationFormDialogOpen = ref(false);
    const isOfficialBusinessAndCertificateOfAttendanceFormDialogOpen = ref(false);
    const isLeaveFormDialogOpen = ref(false);
    const isAddViewScheduleAdjustmentDialogOpen = ref(false);
    const currentSelectedFiling = ref<Filing | null>(null);
    const filings = ref<Filing[]>([]);
    const officialBusinessAndCertificateOfAttendanceData = ref('');
    const { isLoading } = useFilings();
    const q = useQuasar();

    // Pagination state
    const currentPage = ref(1);
    const pageSize = 4;
    const totalFilings = ref(0);


    onMounted(() => {
      loadData();
    });

    const loadData = async () => {
      const offset = (currentPage.value - 1) * pageSize;
      const result = await fetchRequestFilings('PENDING', offset, pageSize);
      filings.value = result.data;
      totalFilings.value = result.total;
    };

    const fetchRequestFilings = async (status: string, offset: number, limit: number): Promise<FilingsResponse> => {
      isLoading.value = true;
      try {
        // Fetch ALL items matching the status (not paginated)
        const response = await api.get<FilingsResponse>('hr-filing/filings', {
          params: {
            status: status.toUpperCase(),
            // Do not send page/limit if backend does not support it correctly
          },
        });
        const allItems = response.data.data;
        return {
          data: allItems.slice(offset, offset + limit),
          total: allItems.length,
          page: Math.floor(offset / limit) + 1,
          limit,
        };
      } catch (error) {
        handleAxiosError(q, error as AxiosError);
        return { data: [], total: 0, page: Math.floor(offset / limit) + 1, limit };
      } finally {
        isLoading.value = false;
      }
    };

    const handlePageChange = (newPage: number) => {
      currentPage.value = newPage;
      loadData();
    };

    const openFilingDialog = (filing: Filing) => {
      currentSelectedFiling.value = filing;

      // Open appropriate dialog based on filing type
      switch (filing.filingType.key) {
        case 'OVERTIME':
          isOvertimeApplicationFormDialogOpen.value = true;
          break;
        case 'OFFICIAL_BUSINESS_FORM':
          officialBusinessAndCertificateOfAttendanceData.value = 'OFFICIAL_BUSINESS_FORM';
          isOfficialBusinessAndCertificateOfAttendanceFormDialogOpen.value = true;
          break;
        case 'CERTIFICATE_OF_ATTENDANCE':
          officialBusinessAndCertificateOfAttendanceData.value = 'CERTIFICATE_OF_ATTENDANCE';
          isOfficialBusinessAndCertificateOfAttendanceFormDialogOpen.value = true;
          break;
        case 'SCHEDULE_ADJUSTMENT':
          isAddViewScheduleAdjustmentDialogOpen.value = true;
          break;
        case 'LEAVE':
          isLeaveFormDialogOpen.value = true;
          break;
      }
    };

    const openOBandCADialog = (type: string) => {
      officialBusinessAndCertificateOfAttendanceData.value = type;
      isOfficialBusinessAndCertificateOfAttendanceFormDialogOpen.value = true;
    };

    return {
      q,
      isOvertimeApplicationFormDialogOpen,
      isOfficialBusinessAndCertificateOfAttendanceFormDialogOpen,
      isLeaveFormDialogOpen,
      isAddViewScheduleAdjustmentDialogOpen,
      officialBusinessAndCertificateOfAttendanceData,
      currentSelectedFiling,
      isLoading,
      filings,
      fetchRequestFilings,
      openOBandCADialog,
      openFilingDialog,
      // Pagination
      currentPage,
      pageSize,
      totalFilings,
      handlePageChange,
    };
  },
};
</script>

<style scoped lang="scss">
.request-panel-container {
margin-bottom: 12px;
  max-width: 400px;
}

.request-wrapper {
  min-height: calc(350px - 41px);
}

.request-item {
  cursor: pointer;
  margin: 0 0 8px 0;
  background-color: #f6f8fb;
  padding: 10px;
  border-radius: 8px;
  transition: transform 0.2s ease-in-out;

  &:hover {
    box-shadow: 0px 1px 4px 0px rgba(133, 146, 173, 0.2);
    background: linear-gradient(180deg, #f6f8fb 10%, #e3eaf5 100%);
  }
}
</style>
