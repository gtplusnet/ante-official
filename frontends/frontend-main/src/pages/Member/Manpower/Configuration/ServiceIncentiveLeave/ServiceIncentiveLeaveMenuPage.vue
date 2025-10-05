<template>
  <expanded-nav-page-container>
    <!-- Page Header -->
    <div class="page-head q-pb-md">
      <div class="row items-center justify-between full-width">
        <div>
          <div class="title text-title-large">Service Incentive Leave</div>
          <div>
            <q-breadcrumbs class="text-body-small">
              <q-breadcrumbs-el label="Manpower" />
              <q-breadcrumbs-el label="Configuration" />
              <q-breadcrumbs-el label="Service Incentive Leave" />
            </q-breadcrumbs>
          </div>
        </div>
        <div class="text-right">
          <g-button icon="add" label="Create Leave Type" @click="openDialog" />
        </div>
      </div>
    </div>

    <!-- Main Content Card -->
    <GCard class="service-incentive-leave">
      <q-card-section class="full-height">
        <!-- Header Row -->
        <div class="row justify-between q-pb-md">
          <div class="q-px-sm text-body-small">Leave Type</div>
          <div class="q-px-sm text-body-small">Action</div>
        </div>

        <!-- Data List -->
        <template v-if="leaveTypes.length">
          <div v-for="(leaveType, index) in leaveTypes" :key="leaveType.id" class="leave-item">
            <!-- Leave Type Row -->
            <div class="row justify-between items-center q-py-xs" @click="leaveType.leavePlans?.length && toggleExpand(index)">
              <div class="q-px-md text-label-medium">
                <span class="clickable-label no-underline-hover">{{ leaveType.name }}</span>
                <span class="text-grey-7 q-pl-xs"> ({{ leaveType.leavePlans?.length || 0 }}) </span>
                <q-icon v-if="leaveType.leavePlans?.length" name="keyboard_arrow_down" color="grey-7" size="24px" class="transition-rotate" :class="{ rotated: expandedIndex === index }" />
              </div>
              <div class="q-px-xs">
                <g-button color="grey" variant="icon" icon="more_horiz" size="md" icon-size="md" round @click.stop>
                  <q-menu anchor="bottom right" self="top right" auto-close>
                    <div class="q-pa-sm">
                      <div class="row q-pa-xs cursor-pointer items-center" @click="editLeaveType(leaveType)">
                        <q-icon name="edit" color="gray" size="20px" />
                        <span class="text-primary q-pl-xs text-label-medium">Edit</span>
                      </div>
                      <div class="row q-pa-xs cursor-pointer items-center" @click="createPlan(leaveType)">
                        <q-icon name="add" color="gray" size="20px" />
                        <span class="text-primary q-pl-xs text-label-medium">Add Plan</span>
                      </div>
                      <div class="row q-pa-xs cursor-pointer items-center" @click="archiveLeaveType(leaveType)">
                        <q-icon name="archive" color="negative" size="20px" />
                        <span class="text-negative q-pl-xs text-label-medium">Archive</span>
                      </div>
                    </div>
                  </q-menu>
                </g-button>
              </div>
            </div>

            <!-- Expandable Plans -->
            <q-slide-transition>
              <div v-show="expandedIndex === index" class="q-ml-lg q-mb-sm">
                <div v-for="plan in leaveType.leavePlans" :key="plan.id" class="row items-center justify-between q-pr-sm q-pl-lg">
                  <span @click="handleSelectedPlan(plan)" class="clickable-sub-label text-body-small">{{ plan.planName }}</span>
                  <div>
                    <g-button color="grey" variant="icon" icon="more_horiz" size="sm" icon-size="sm" round @click.stop>
                      <q-menu anchor="bottom right" self="top right" auto-close>
                        <div class="q-pa-sm">
                          <div class="row q-pa-xs cursor-pointer items-center" @click="viewPlanDetails(plan)">
                            <q-icon name="visibility" color="gray" size="20px" />
                            <span class="text-primary q-pl-xs text-label-medium">View Plan Details</span>
                          </div>
                          <div class="row q-pa-xs cursor-pointer items-center" @click="editPlan(plan)">
                            <q-icon name="edit" color="gray" size="20px" />
                            <span class="text-primary q-pl-xs text-label-medium">Edit</span>
                          </div>
                          <div class="row q-pa-xs cursor-pointer items-center" @click="archivePlan(plan)">
                            <q-icon name="archive" color="negative" size="20px" />
                            <span class="text-negative q-pl-xs text-label-medium">Archive</span>
                          </div>
                        </div>
                      </q-menu>
                    </g-button>
                  </div>
                </div>
              </div>
            </q-slide-transition>
          </div>
        </template>

        <!-- Empty State -->
        <div v-else class="q-py-lg q-mt-md">
          <div class="text-center q-pa-md text-grey">This page is empty</div>
        </div>
      </q-card-section>
    </GCard>

    <!-- Dialogs -->
    <AddEditLeaveTypeDialog
      v-model="isLeaveTypeDialogOpen"
      @saveDone="getLeaveTypeList()"
      :leaveTypeInformation="selectedLeaveType"
    />
    <!-- Create Leave Plan Dialog -->
    <AddEditLeavePlanDialog
      v-model="isCreatePlanDialogOpen"
      @saveDone="handlePlanSaved()"
      :leaveTypeInformation="selectedLeaveTypeForPlan"
      :planInformation="selectedPlanForEdit"
    />

    <!-- View Plan Details Dialog -->
    <ManpowerViewPlanDetailsDialog
      v-model="isViewPlanDetailsDialogOpen"
      :planInformation="selectedPlanForView"
    />
  </expanded-nav-page-container>
</template>

<style scoped src="./ServiceIncentiveLeaveMenuPage.scss"></style>

<script lang="ts">
import { useQuasar } from 'quasar';
import { api } from 'src/boot/axios';
import GCard from 'src/components/shared/display/GCard.vue';
import { handleAxiosError } from 'src/utility/axios.error.handler';
import { onMounted, ref, defineAsyncComponent } from 'vue';
import { useRouter } from 'vue-router';
import ExpandedNavPageContainer from 'src/components/shared/ExpandedNavPageContainer.vue';
import GButton from 'src/components/shared/buttons/GButton.vue';

// Lazy-loaded dialogs (ALL dialogs must be lazy loaded - CLAUDE.md)
const AddEditLeaveTypeDialog = defineAsyncComponent(() =>
  import('../../dialogs/configuration/ManpowerAddEditLeaveTypeDialog.vue')
);
const AddEditLeavePlanDialog = defineAsyncComponent(() =>
  import('../../dialogs/configuration/ManpowerAddEditLeavePlanDialog.vue')
);
const ManpowerViewPlanDetailsDialog = defineAsyncComponent(() =>
  import('../../dialogs/configuration/ManpowerViewPlanDetailsDialog.vue')
);

interface LeavePlan {
  id: number;
  planName: string;
  isActive: boolean;
  _count?: {
    employeeLeavePlans: number;
  };
}

interface LeaveTypeItem {
  id: number;
  name: string;
  code: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  leavePlans?: LeavePlan[];
  _count?: {
    leavePlans: number;
  };
}

export default {
  name: 'ServiceIncentiveLeaveMenuPage',
  props: {},
  components: {
    ExpandedNavPageContainer,
    AddEditLeaveTypeDialog,
    AddEditLeavePlanDialog,
    ManpowerViewPlanDetailsDialog,
    GCard,
    GButton,
  },

  setup() {
    const $q = useQuasar();
    const router = useRouter();
    const leaveTypes = ref<LeaveTypeItem[]>([]);
    const expandedIndex = ref<null | number>(null);
    const isLeaveTypeDialogOpen = ref(false);
    const selectedLeaveType = ref<LeaveTypeItem | null>(null);
    const isCreatePlanDialogOpen = ref(false);
    const selectedLeaveTypeForPlan = ref<LeaveTypeItem | null>(null);
    const selectedPlanForEdit = ref(null);
    const isViewPlanDetailsDialogOpen = ref(false);
    const selectedPlanForView = ref(null);

    const toggleExpand = (index: number) => {
      expandedIndex.value = expandedIndex.value === index ? null : index;
    };

    const onSelectedLeavePlan = (payload: { plan: LeavePlan }) => {
      router.push({
        name: 'member_manpower_service_incentive_leave_plan',
        params: { planId: payload.plan.id },
      });
    };

    onMounted(() => {
      getLeaveTypeList();
    });

    const getLeaveTypeList = () => {
      $q.loading.show();
      api
        .get('hr-configuration/leave/tree')
        .then((response) => {
          leaveTypes.value = Array.isArray(response.data) ? response.data : [];
        })
        .catch((error) => {
          handleAxiosError($q, error);
        })
        .finally(() => {
          $q.loading.hide();
        });
    };

    const handleSelectedPlan = (plan: LeavePlan) => {
      onSelectedLeavePlan({ plan: plan });
    };

    const openDialog = () => {
      selectedLeaveType.value = null;
      isLeaveTypeDialogOpen.value = true;
    };

    const editLeaveType = (data: LeaveTypeItem) => {
      selectedLeaveType.value = data;
      isLeaveTypeDialogOpen.value = true;
    };

    const archiveLeaveType = (data: LeaveTypeItem) => {
      $q.dialog({
        title: 'Archive Leave Type',
        message: `Are you sure you want to archive <b>${data.name}</b>?`,
        ok: 'Yes',
        cancel: 'No',
        html: true,
      }).onOk(() => {
        archiveLeaveTypeData(data.id);
      });
    };

    const archiveLeaveTypeData = (id: number) => {
      $q.loading.show();
      api
        .delete(`hr-configuration/leave/type/${id}`)
        .then(() => {
          getLeaveTypeList();
        })
        .catch((error) => {
          handleAxiosError($q, error);
        })
        .finally(() => {
          $q.loading.hide();
        });
    };

    const archivePlan = (data: LeavePlan) => {
      $q.dialog({
        title: 'Archive Leave Plan',
        message: `Are you sure you want to archive <b>${data.planName}</b>?`,
        ok: 'Yes',
        cancel: 'No',
        html: true,
      }).onOk(() => {
        archivePlanData(data.id);
      });
    };

    const archivePlanData = (id: number) => {
      $q.loading.show();
      api
        .delete(`hr-configuration/leave/plan/${id}`)
        .then(() => {
          getLeaveTypeList();
        })
        .catch((error) => {
          handleAxiosError($q, error);
        })
        .finally(() => {
          $q.loading.hide();
        });
    };

    const createPlan = (leaveType: LeaveTypeItem) => {
      selectedLeaveTypeForPlan.value = leaveType;
      selectedPlanForEdit.value = null;
      isCreatePlanDialogOpen.value = true;
    };

    const editPlan = (plan: LeavePlan) => {
      // Find the leave type that contains this plan
      const leaveType = leaveTypes.value.find(lt =>
        lt.leavePlans?.some(p => p.id === plan.id)
      );

      if (!leaveType) {
        $q.notify({
          type: 'negative',
          message: 'Could not find leave type for this plan',
        });
        return;
      }

      $q.loading.show();
      api
        .get(`hr-configuration/leave/plan/${plan.id}`)
        .then((response) => {
          selectedPlanForEdit.value = response.data;
          isCreatePlanDialogOpen.value = true;
        })
        .catch((error) => {
          handleAxiosError($q, error);
        })
        .finally(() => {
          $q.loading.hide();
        });
    };

    const viewPlanDetails = (plan: LeavePlan) => {
      // Find the leave type that contains this plan
      const leaveType = leaveTypes.value.find(lt =>
        lt.leavePlans?.some(p => p.id === plan.id)
      );

      if (!leaveType) {
        $q.notify({
          type: 'negative',
          message: 'Could not find leave type for this plan',
        });
        return;
      }

      $q.loading.show();
      api
        .get(`hr-configuration/leave/plan/${plan.id}`)
        .then((response) => {
          selectedPlanForView.value = response.data;
          isViewPlanDetailsDialogOpen.value = true;
        })
        .catch((error) => {
          handleAxiosError($q, error);
        })
        .finally(() => {
          $q.loading.hide();
        });
    };


    const handlePlanSaved = () => {
      getLeaveTypeList();
      // Expand the section that was updated
      if (selectedLeaveTypeForPlan.value) {
        const index = leaveTypes.value.findIndex(lt => lt.id === selectedLeaveTypeForPlan.value?.id);
        if (index !== -1) {
          expandedIndex.value = index;
        }
      }
    };

    return {
      leaveTypes,
      expandedIndex,
      isLeaveTypeDialogOpen,
      isViewPlanDetailsDialogOpen,
      selectedPlanForView,
      selectedLeaveType,
      selectedPlanForEdit,
      isCreatePlanDialogOpen,
      selectedLeaveTypeForPlan,
      getLeaveTypeList,
      toggleExpand,
      openDialog,
      editLeaveType,
      archiveLeaveType,
      createPlan,
      editPlan,
      viewPlanDetails,
      archivePlan,
      handlePlanSaved,
      handleSelectedPlan,
    };
  },
};
</script>
