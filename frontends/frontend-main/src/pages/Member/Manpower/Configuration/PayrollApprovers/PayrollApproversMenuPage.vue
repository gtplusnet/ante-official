<template>
  <expanded-nav-page-container>
    <div class="q-pb-md">
      <div class="row justify-between items-center">
        <div>
          <span class="text-title-large">Payroll Approvers</span>
          <div class="bread-crumbs">
            <q-breadcrumbs class="text-body-small">
              <q-breadcrumbs-el label="Manpower" :to="{ name: 'member_manpower' }" />
              <q-breadcrumbs-el label="Configuration" />
              <q-breadcrumbs-el label="Payroll Approvers" />
            </q-breadcrumbs>
          </div>
        </div>
        <div class="row q-gutter-sm">
          <q-select
            v-model="selectedLevel"
            :options="levelOptions"
            label="Approval Level"
            style="min-width: 150px"
            class="text-label-large"
            filled
            dense
            emit-value
            map-options
          />
          <GButton
            @click="selectMultipleEmployee()"
            icon="add"
            label="Add Payroll Approver"
            color="primary"
            class="text-label-large"
          />
        </div>
      </div>
    </div>
    <div>
      <div class="q-pb-sm">
        <div class="text-title-small">
          List of Approvers <span>({{ approvers.length }})</span>
        </div>
      </div>

      <!-- Tab for different approval levels -->
      <q-tabs
        v-model="currentLevelTab"
        class="text-grey"
        active-color="primary"
        indicator-color="primary"
        align="left"
        narrow-indicator
      >
        <q-tab
          v-for="level in uniqueLevels"
          class="text-label-large"
          :key="level"
          :name="level"
          :label="`Level ${level}`"
        />
      </q-tabs>

      <q-separator />

      <q-tab-panels v-model="currentLevelTab" animated>
        <q-tab-panel v-for="level in uniqueLevels" :key="level" :name="level">
          <table class="global-table">
            <thead class="text-left text-title-small">
              <tr>
                <th>Name</th>
                <th>Position</th>
                <th class="text-center">Status</th>
                <th class="text-center">Actions</th>
              </tr>
            </thead>
            <tbody class="text-body-small">
              <tr v-for="approver in getApproversByLevel(level)" :key="approver.id">
                <td>{{ approver.account.fullName }}</td>
                <td>{{ approver.account.role.name }}</td>
                <td class="text-center">
                  <q-chip
                    :color="approver.isActive ? 'positive' : 'negative'"
                    text-color="white"
                    size="sm"
                    class="text-label-medium"
                  >
                    {{ approver.isActive ? 'Active' : 'Inactive' }}
                  </q-chip>
                </td>
                <td class="text-center">
                  <GButton
                    @click="toggleApproverStatus(approver)"
                    :icon="approver.isActive ? 'pause' : 'play_arrow'"
                    :label="approver.isActive ? 'Deactivate' : 'Activate'"
                    :color="approver.isActive ? 'warning' : 'positive'"
                    variant="outline"
                    size="sm"
                    class="q-mr-sm"
                  />
                  <GButton
                    @click="removeApprover(approver)"
                    icon="delete"
                    label="Remove"
                    color="negative"
                    variant="outline"
                    size="sm"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </q-tab-panel>
      </q-tab-panels>
    </div>

    <!-- Select Approver -->
    <SelectMultipleEmployeeDialog v-model="isSelectMultipleDialogOpen" @add-selected-employees="addSelectedEmployees" :selectMultipleEmployee="{ url: 'hr-configuration/payroll-approvers/employee-select', name: 'Payroll Approvers' }" />
  </expanded-nav-page-container>
</template>

<script lang="ts">
import { useQuasar } from 'quasar';
import { api } from 'src/boot/axios';
import ExpandedNavPageContainer from '../../../../../components/shared/ExpandedNavPageContainer.vue';
import { handleAxiosError } from '../../../../../utility/axios.error.handler';
import { AxiosError } from 'axios';
import { onMounted, ref, computed } from 'vue';
import { PayrollApproverDataResponse } from '@shared/response/payroll-approvers.response';
import SelectMultipleEmployeeDialog from '../../dialogs/configuration/ManpowerSelectMultipleEmployeeDialog.vue';
import { DeletePayrollApproverRequest } from '@shared/request';
import GButton from 'src/components/shared/buttons/GButton.vue';

export default {
  name: 'PayrollApproversMenuPage',
  components: {
    ExpandedNavPageContainer,
    SelectMultipleEmployeeDialog,
    GButton,
    },
  props: {},

  setup() {
    const q = useQuasar();
    const approvers = ref<PayrollApproverDataResponse[]>([]);
    const isSelectMultipleDialogOpen = ref(false);
    const selectedLevel = ref(1);
    const currentLevelTab = ref(1);

    const levelOptions = [
      { label: 'Level 1', value: 1 },
      { label: 'Level 2', value: 2 },
      { label: 'Level 3', value: 3 },
    ];

    onMounted(() => {
      fetchApproversTableData();
    });

    const fetchApproversTableData = () => {
      q.loading.show();

      const params = {
        page: 1,
        perPage: 100, // Get all approvers
        searchKeyword: '',
        filters: [],
      };

      api
        .put('hr-configuration/payroll-approvers/table', params)
        .then((response) => {
          approvers.value = response.data.list || [];
          // Initialize the current tab to the first level if any approvers exist
          if (approvers.value.length > 0 && uniqueLevels.value.length > 0) {
            currentLevelTab.value = uniqueLevels.value[0];
          }
        })
        .catch((error) => {
          handleAxiosError(q, error);
        })
        .finally(() => {
          q.loading.hide();
        });
    };

    const selectMultipleEmployee = () => {
      isSelectMultipleDialogOpen.value = true;
    };

    const addSelectedEmployees = (selectedEmployees: string[]) => {
      if (selectedEmployees.length === 0) {
        q.notify({
          type: 'warning',
          message: 'Please select at least one employee',
        });
        return;
      }

      q.loading.show();

      const params = {
        accountIds: selectedEmployees,
        approvalLevel: selectedLevel.value,
      };

      api
        .post('hr-configuration/payroll-approvers/bulk-add', params)
        .then((response) => {
          q.notify({
            type: 'positive',
            message: `Successfully added ${response.data.length} approver(s)`,
          });
          fetchApproversTableData();
        })
        .catch((error) => {
          handleAxiosError(q, error);
        })
        .finally(() => {
          q.loading.hide();
        });
    };

    const removeApprover = (data: PayrollApproverDataResponse) => {
      q.dialog({
        title: 'Remove Approver',
        message: `Are you sure you want to remove <b>${data.account.fullName}</b> Approver?`,
        ok: 'Yes',
        cancel: 'No',
        html: true,
      }).onOk(() => {
        remove({ accountId: data.account.id });
      });
    };

    const remove = (accountId: DeletePayrollApproverRequest) => {
      q.loading.show();
      api
        .delete('hr-configuration/payroll-approvers/delete', { data: accountId })
        .then(() => {
          fetchApproversTableData();
        })
        .catch((error) => {
          handleAxiosError(q, error);
        })
        .finally(() => {
          q.loading.hide();
        });
    };

    const uniqueLevels = computed(() => {
      const levels = new Set(approvers.value.map(a => a.approvalLevel || 1));
      return Array.from(levels).sort((a, b) => a - b);
    });

    const getApproversByLevel = (level: number) => {
      return approvers.value.filter(a => (a.approvalLevel || 1) === level);
    };

    const toggleApproverStatus = async (approver: PayrollApproverDataResponse) => {
      q.loading.show();
      try {
        const response = await api.put('hr-configuration/payroll-approvers/toggle-status', {
          accountId: approver.account.id,
        });

        // Update the local data with the response
        const updatedApprover = response.data;
        const index = approvers.value.findIndex(a => a.id === approver.id);
        if (index !== -1) {
          approvers.value[index] = updatedApprover;
        }

        q.notify({
          type: 'positive',
          message: `Approver ${updatedApprover.isActive ? 'activated' : 'deactivated'} successfully`,
        });
      } catch (error) {
        if (error instanceof Error) {
          handleAxiosError(q, error as AxiosError);
        }
      } finally {
        q.loading.hide();
      }
    };

    return {
      q,
      approvers,
      isSelectMultipleDialogOpen,
      selectedLevel,
      currentLevelTab,
      levelOptions,
      uniqueLevels,
      selectMultipleEmployee,
      addSelectedEmployees,
      removeApprover,
      getApproversByLevel,
      toggleApproverStatus,
    };
  },
};
</script>
