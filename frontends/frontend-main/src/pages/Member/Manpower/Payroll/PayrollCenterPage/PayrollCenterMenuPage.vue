<template>
  <expanded-nav-page-container>
    <div class="page-head q-pb-md">
      <div class="row items-center justify-between full-width">
        <div>
          <div class="text-title-large">Payroll Center</div>
          <div>
            <q-breadcrumbs class="text-body-small">
              <q-breadcrumbs-el label="Manpower" :to="{ name: 'member_manpower' }" />
              <q-breadcrumbs-el label="Payroll" />
              <q-breadcrumbs-el label="Payroll Center" />
            </q-breadcrumbs>
          </div>
        </div>
        <div class="text-right">
        </div>
      </div>
    </div>
    <div class="top-tabs q-pb-md">
      <div class="row item items-center">
        <template v-for="(tab, index) in topTabs" :key="tab.key">
          <div class="tab" :class="{ active: activeTabs === tab.key }" @click="activeTabs = tab.key">
            <div>
              <q-icon :name="tab.icon" size="28px" class="tab-icon q-mr-xs" />
              <span class="text-label-large">{{ tab.name }}</span>
              <span v-if="tab.key === 'pending' && countCutoffListByStatus.pending > 0" class="tab-badge text-label-large">
                {{ countCutoffListByStatus.pending }}
              </span>
              <span v-else-if="tab.key === 'rejected' && countCutoffListByStatus.rejected > 0" class="tab-badge text-label-large">
                {{ countCutoffListByStatus.rejected }}
              </span>
              <span v-else-if="tab.key === 'process' && countCutoffListByStatus.processed > 0" class="tab-badge text-label-large">
                {{ countCutoffListByStatus.processed }}
              </span>
              <span v-else-if="tab.key === 'approve' && countCutoffListByStatus.approved > 0" class="tab-badge text-label-large">
                {{ countCutoffListByStatus.approved }}
              </span>
            </div>
          </div>

          <div v-if="index < topTabs.length - 1">
            <q-icon class="q-mx-md" name="east" size="20px" />
          </div>
        </template>
      </div>
    </div>
    <div class="card-container">
      <div v-if="activeTabs == 'pending'">
        <!-- Pending Tab -->
        <PayrollCenterCards status="PENDING" />
      </div>
      <div v-if="activeTabs == 'rejected'">
        <!-- Rejected Tab -->
        <PayrollCenterCards status="REJECTED" />
      </div>
      <div v-if="activeTabs == 'process'">
        <PayrollCenterCards status="PROCESSED" />
      </div>
      <div v-if="activeTabs == 'approve'">
        <PayrollCenterCards status="APPROVED" />
      </div>
      <div v-if="activeTabs == 'posted'">
        <PayrollCenterCards status="POSTED" />
      </div>
    </div>
  </expanded-nav-page-container>
</template>

<style src="./PayrollCenterPage.scss" scope></style>

<script lang="ts">
import { computed, onMounted, Ref, ref } from 'vue';
import ExpandedNavPageContainer from '../../../../../components/shared/ExpandedNavPageContainer.vue';
import PayrollCenterCards from './PayrollCenterTabMenu/PayrollCenterCards.vue';
import { CutoffListCountResponse } from "@shared/response";
import { api } from 'src/boot/axios';
import bus from 'src/bus';

export default {
  name: 'PayrollCenterMenuPage',
  components: {
    ExpandedNavPageContainer,
    PayrollCenterCards,
  },
  setup() {
    const openPayrollSetupDialog: Ref<boolean> = ref(false);
    const countCutoffListByStatus = ref<CutoffListCountResponse>({
      pending: 0,
      processed: 0,
      approved: 0,
      rejected: 0,
    });

    const activeTabs = ref('pending');
    const topTabs = computed(() => {
      const tabs = [
        {
          name: 'For Review',
          key: 'pending',
          icon: 'history',
          count: countCutoffListByStatus.value.pending,
        },
      ];

      // Only add Rejected tab if there are rejected items
      if (countCutoffListByStatus.value.rejected > 0) {
        tabs.push({
          name: 'Rejected',
          key: 'rejected',
          icon: 'cancel',
          count: countCutoffListByStatus.value.rejected,
        });
      }

      tabs.push(
        {
          name: 'For Approval',
          key: 'process',
          icon: 'settings',
          count: countCutoffListByStatus.value.processed,
        },
        {
          name: 'Approved',
          key: 'approve',
          icon: 'verified',
          count: countCutoffListByStatus.value.approved,
        },
        {
          name: 'Posted',
          key: 'posted',
          icon: 'fact_check',
          count: 0,
        }
      );

      return tabs;
    });

    const selectCutOff = ref('Select Cut-off');
    const cutoffSelect = ['Select Cut-off'];
    const selectedDateRange = ref(null);

    bus.on('cutoff-date-range-status-updated', () => {
      getCountCutoffListByStatus();
    });

    onMounted(() => {
      getCountCutoffListByStatus();
    });

    const getCountCutoffListByStatus = async () => {
      const response = await api.get('/hr-processing/count-cutoff-list-by-status');
      countCutoffListByStatus.value = response.data;
    };

    const openPayrollSetup = () => {
      openPayrollSetupDialog.value = true;
    };

    const handleSelectedDateRange = (cutoffData: typeof selectedDateRange.value) => {
      selectedDateRange.value = cutoffData;
    };

    return {
      openPayrollSetupDialog,
      activeTabs,
      topTabs,
      selectCutOff,
      cutoffSelect,
      selectedDateRange,
      openPayrollSetup,
      handleSelectedDateRange,
      countCutoffListByStatus,
    };
  },
};
</script>
