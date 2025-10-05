<template>
  <expanded-nav-page-container>
    <div class="q-pb-md">
      <div class="row justify-between items-center">
        <div>
          <span class="text-title-large">Leave Plan Summary</span>
          <div class="bread-crumbs">
            <q-breadcrumbs class="text-body-small">
              <q-breadcrumbs-el label="Manpower" :to="{ name: 'member_manpower' }" />
              <q-breadcrumbs-el label="Configuration" />
              <q-breadcrumbs-el label="Service Incentive Leave" :to="{ name: 'member_manpower_service_incentive_leave' }" />
              <q-breadcrumbs-el :label="leavePlanInformation?.planName" class="text-dark" />
            </q-breadcrumbs>
          </div>
        </div>
        <div class="q-gutter-sm">
          <!-- <GButton
            icon="download"
            label="Mass Import"
            color="gray"
            variant="outline"
            class="text-label-large"
          /> -->
          <GButton
            icon="add"
            @click="leavePlanInformation && openDialog()"
            label="Add Employee"
            color="primary"
            class="text-label-large"
          />
        </div>
      </div>
    </div>

    <div class="row justify-between items-center q-pb-sm">
      <div class="leave-tabs">
        <div v-for="tab in tabList" :key="tab.key" class="tab text-label-medium" :class="tab.key == activeTab ? 'active' : ''" @click="activeTab = tab.key">
          {{ tab.name }}
        </div>
      </div>
    </div>
    <GCard>
      <q-card-section>
        <!-- Active Table -->
        <LeaveActiveTable
          ref="activeTableRef"
          v-if="activeTab === 'active_table' && leavePlanInformation"
          :leavePlanInformation="leavePlanInformation"
        />
        <!-- Inactive Table -->
        <LeaveInactiveTable
          ref="inactiveTableRef"
          v-if="activeTab === 'inactive_table' && leavePlanInformation"
          :leavePlanInformation="leavePlanInformation"
        />
      </q-card-section>
    </GCard>
    <!-- Create Employee Leave Plan Tag Dialog -->
    <ManpowerCreateEmployeeLeavePlanTagDialog v-model="isCreateEmployeeLeavePlanTagDialogOpen" :leavePlanInformation="leavePlanInformation" @saveDone="handleSaveDone" />
  </expanded-nav-page-container>
</template>

<style scoped src="./ServiceIncentiveLeaveMenuPage.scss"></style>

<script lang="ts">
import { onMounted, ref, defineAsyncComponent } from 'vue';
import ExpandedNavPageContainer from 'src/components/shared/ExpandedNavPageContainer.vue';
import GCard from 'src/components/shared/display/GCard.vue';
import { useQuasar } from 'quasar';
import { api } from 'src/boot/axios';
import { handleAxiosError } from 'src/utility/axios.error.handler';
import { useRoute } from 'vue-router';
import { LeavePlanResponse } from '@shared/response/leave-plan-response.interface';
import LeaveActiveTable from 'src/pages/Member/Manpower/components/tables/ManpowerLeaveActiveTable.vue';
import LeaveInactiveTable from 'src/pages/Member/Manpower/components/tables/ManpowerLeaveInactiveTable.vue';
import GButton from 'src/components/shared/buttons/GButton.vue';

// Lazy-loaded dialogs (ALL dialogs must be lazy loaded - CLAUDE.md)
const ManpowerCreateEmployeeLeavePlanTagDialog = defineAsyncComponent(() =>
  import('../../dialogs/configuration/ManpowerCreateEmployeeLeavePlanTagDialog.vue')
);

export default {
  name: 'ServiceIncentiveLeaveMenuPagePlan',
  components: {
    ManpowerCreateEmployeeLeavePlanTagDialog,
    ExpandedNavPageContainer,
    LeaveActiveTable,
    LeaveInactiveTable,
    GCard,
    GButton,
  },
  props: {},
  setup() {
    const $q = useQuasar();
    const route = useRoute();
    const isCreateEmployeeLeavePlanTagDialogOpen = ref(false);
    const planId = route.params.planId;
    const leavePlanInformation = ref<LeavePlanResponse | null>(null);
    const activeTableRef = ref<(InstanceType<typeof LeaveActiveTable> & { $refs: { table: { refetch: () => void } } }) | null>(null);
    const inactiveTableRef = ref<(InstanceType<typeof LeaveInactiveTable> & { $refs: { table: { refetch: () => void } } }) | null>(null);
    const activeTab = ref('active_table');
    const tabList = ref([
      { name: 'Active', key: 'active_table' },
      { name: 'Inactive', key: 'inactive_table' },
    ]);

    onMounted(() => {
      getLeaveTypeData();
    });

    const getLeaveTypeData = async () => {
      $q.loading.show();
      api
        .get(`/hr-configuration/leave/plan/${planId}`)
        .then((response) => {
          leavePlanInformation.value = response.data;
        })
        .catch((error) => {
          handleAxiosError($q, error);
        })
        .finally(() => {
          $q.loading.hide();
        });
    };

    const openDialog = () => {
      isCreateEmployeeLeavePlanTagDialogOpen.value = true;
    };

    const handleSaveDone = () => {
      if (activeTableRef.value?.$refs.table) {
        activeTableRef.value.$refs.table.refetch();
      }
      if (inactiveTableRef.value?.$refs.table) {
        inactiveTableRef.value.$refs.table.refetch();
      }
    };

    return {
      $q,
      planId,
      activeTab,
      tabList,
      leavePlanInformation,
      isCreateEmployeeLeavePlanTagDialogOpen,
      activeTableRef,
      inactiveTableRef,
      openDialog,
      handleSaveDone,
    };
  },
};
</script>
