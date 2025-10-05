<template>
  <expanded-nav-page-container>
    <div class="page-head q-pb-md">
      <div class="row items-center justify-between full-width">
        <div>
          <div class="title">Guardian Management</div>
          <div>
            <q-breadcrumbs>
              <q-breadcrumbs-el label="School Management" :to="{ name: 'member_school_guardian_management' }" />
              <q-breadcrumbs-el label="People Management" />
              <q-breadcrumbs-el label="Guardians" />
            </q-breadcrumbs>
          </div>
        </div>
        <div class="text-right">
          <q-btn @click="openAddGuardianDialog()" no-caps color="primary" unelevated>
            <q-icon name="add"></q-icon>
            Add Guardian
          </q-btn>
        </div>
      </div>
    </div>

    <g-card class="q-pa-md">
      <g-table 
        :isRowActionEnabled="true" 
        tableKey="guardianTable" 
        apiUrl="school/guardian/table" 
        ref="table"
      >
        <!-- Name Slot -->
        <template v-slot:name="props">
          <div class="text-weight-medium">
            {{ props.data.name }}
          </div>
        </template>

        <!-- Contact Number Slot -->
        <template v-slot:contactNumber="props">
          <div>
            {{ props.data.contactNumber }}
          </div>
        </template>

        <!-- Student Count Slot -->
        <template v-slot:studentCount="props">
          <q-badge color="primary" text-color="white">
            {{ props.data.studentCount }} {{ props.data.studentCount === 1 ? 'student' : 'students' }}
          </q-badge>
        </template>

        <!-- Status Slot -->
        <template v-slot:status="props">
          <q-badge :color="props.data.isActive ? 'green' : 'grey'" text-color="white">
            {{ props.data.isActive ? 'Active' : 'Inactive' }}
          </q-badge>
        </template>

        <!-- Last Login Slot -->
        <template v-slot:lastLogin="props">
          <span v-if="props.data.lastLogin">{{ props.data.lastLogin }}</span>
          <span v-else class="text-grey-6">Never</span>
        </template>

        <!-- Row Actions -->
        <template v-slot:row-actions="props">
          <q-btn color="grey-7" round flat icon="more_horiz">
            <q-menu auto-close>
              <div class="q-pa-sm">
                <div clickable @click="viewGuardian(props)" class="row q-pa-xs cursor-pointer">
                  <div><q-icon name="visibility" color="grey" size="20px" /></div>
                  <div class="text-blue q-pa-xs">View</div>
                </div>
                <div clickable @click="editGuardian(props)" class="row q-pa-xs cursor-pointer">
                  <div><q-icon name="edit" color="grey" size="20px" /></div>
                  <div class="text-blue q-pa-xs">Edit</div>
                </div>
                <div clickable @click="resetPassword(props.data)" class="row q-pa-xs cursor-pointer">
                  <div><q-icon name="lock_reset" color="grey" size="20px" /></div>
                  <div class="text-blue q-pa-xs">Reset Password</div>
                </div>
                <div clickable @click="deleteGuardian(props.data)" class="row q-pa-xs cursor-pointer">
                  <div><q-icon name="delete" color="grey" size="20px" /></div>
                  <div class="text-blue q-pa-xs">Delete</div>
                </div>
              </div>
            </q-menu>
          </q-btn>
        </template>
      </g-table>
    </g-card>

    <!-- Dialogs -->
    <ViewGuardianDialog 
      @close="openViewDialog = false" 
      @edit="openEditGuardian" 
      :guardianData="guardianData" 
      v-model="openViewDialog" 
    />

    <AddEditGuardianDialog 
      @saveDone="handleTableRefetch" 
      @close="openAddEditDialog = false" 
      :guardianData="guardianData" 
      v-model="openAddEditDialog" 
    />
  </expanded-nav-page-container>
</template>

<script lang="ts">
import { defineComponent, ref, defineAsyncComponent } from 'vue';
import GTable from 'src/components/shared/display/GTable.vue';
import GCard from 'src/components/shared/display/GCard.vue';
import { api } from 'src/boot/axios';
import { useQuasar } from 'quasar';
import { AxiosError } from 'axios';
import type { GuardianResponse } from '@shared/response';
import ExpandedNavPageContainer from '../../../components/shared/ExpandedNavPageContainer.vue';

// Lazy-loaded dialogs (ALL dialogs must be lazy loaded - CLAUDE.md)
const ViewGuardianDialog = defineAsyncComponent(() =>
  import('./dialogs/ViewGuardianDialog.vue')
);
const AddEditGuardianDialog = defineAsyncComponent(() =>
  import('./dialogs/AddEditGuardianDialog.vue')
);

interface GTableInstance {
  refetch: () => void;
  reload: () => void;
  refresh: () => void;
}

export default defineComponent({
  name: 'GuardianManagement',
  components: {
    ExpandedNavPageContainer,
GTable,
    GCard,
    ViewGuardianDialog,
    AddEditGuardianDialog,
  },
  setup() {
    const $q = useQuasar();
    const table = ref<GTableInstance | null>(null);
    const openViewDialog = ref(false);
    const openAddEditDialog = ref(false);
    const guardianData = ref<{ data: GuardianResponse } | null>(null);
    
    const handleTableRefetch = () => {
      if (table.value) {
        table.value.refetch();
      }
    };

    const openAddGuardianDialog = () => {
      guardianData.value = null;
      openAddEditDialog.value = true;
    };

    const viewGuardian = async (props: { data: GuardianResponse }) => {
      // Fetch full guardian details to ensure we have all data including dateOfBirth
      $q.loading.show({
        message: 'Loading guardian details...',
      });
      
      try {
        const response = await api.get(`school/guardian/info?id=${props.data.id}`);
        guardianData.value = { data: response.data };
        openViewDialog.value = true;
      } catch (error) {
        const axiosError = error as AxiosError<{ message: string }>;
        $q.notify({
          type: 'negative',
          message: axiosError.response?.data?.message || 'Failed to fetch guardian details',
        });
      } finally {
        $q.loading.hide();
      }
    };

    const editGuardian = async (props: { data: GuardianResponse }) => {
      // Fetch full guardian details since table data doesn't include all fields
      $q.loading.show({
        message: 'Loading guardian details...',
      });
      
      try {
        const response = await api.get(`school/guardian/info?id=${props.data.id}`);
        guardianData.value = { data: response.data };
        openAddEditDialog.value = true;
      } catch (error) {
        const axiosError = error as AxiosError<{ message: string }>;
        $q.notify({
          type: 'negative',
          message: axiosError.response?.data?.message || 'Failed to fetch guardian details',
        });
      } finally {
        $q.loading.hide();
      }
    };

    const openEditGuardian = async (data: { data: GuardianResponse }) => {
      // If coming from view dialog, we already have full data
      if (data.data.dateOfBirth) {
        guardianData.value = data;
        openAddEditDialog.value = true;
      } else {
        // Otherwise fetch full details
        try {
          const response = await api.get(`school/guardian/info?id=${data.data.id}`);
          guardianData.value = { data: response.data };
          openAddEditDialog.value = true;
        } catch (error) {
          const axiosError = error as AxiosError<{ message: string }>;
          $q.notify({
            type: 'negative',
            message: axiosError.response?.data?.message || 'Failed to fetch guardian details',
          });
        }
      }
    };

    const resetPassword = (data: GuardianResponse) => {
      $q.dialog({
        title: 'Reset Password',
        message: `Reset password for ${data.name}?`,
        prompt: {
          model: '',
          type: 'password',
          label: 'New Password (min 8 characters)',
          isValid: (val: string) => val.length >= 8,
        },
        cancel: true,
        persistent: true,
      }).onOk(async (newPassword: string) => {
        $q.loading.show({
          message: 'Resetting password...',
        });

        try {
          await api.post('school/guardian/reset-password', {
            guardianId: data.id,
            newPassword,
          });
          $q.notify({
            type: 'positive',
            message: 'Password reset successfully',
          });
        } catch (error) {
          const axiosError = error as AxiosError<{ message: string }>;
          $q.notify({
            type: 'negative',
            message: axiosError.response?.data?.message || 'Failed to reset password',
          });
        } finally {
          $q.loading.hide();
        }
      });
    };

    const deleteGuardian = (data: GuardianResponse) => {
      $q.dialog({
        title: 'Delete Guardian',
        message: `Are you sure you want to delete ${data.name}?`,
        cancel: true,
        persistent: true,
      }).onOk(async () => {
        $q.loading.show({
          message: 'Deleting guardian...',
        });

        try {
          await api.delete(`school/guardian/delete?id=${data.id}`);
          $q.notify({
            type: 'positive',
            message: 'Guardian deleted successfully',
          });
          handleTableRefetch();
        } catch (error) {
          const axiosError = error as AxiosError<{ message: string }>;
          $q.notify({
            type: 'negative',
            message: axiosError.response?.data?.message || 'Failed to delete guardian',
          });
        } finally {
          $q.loading.hide();
        }
      });
    };

    return {
      table,
      openViewDialog,
      openAddEditDialog,
      guardianData,
      openAddGuardianDialog,
      viewGuardian,
      editGuardian,
      openEditGuardian,
      resetPassword,
      deleteGuardian,
      handleTableRefetch,
    };
  },
});
</script>