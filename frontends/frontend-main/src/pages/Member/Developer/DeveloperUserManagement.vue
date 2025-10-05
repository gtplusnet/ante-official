<template>
  <div class="page">
    <div class="flex justify-between items-center q-mb-md">
      <div class="text-title-large">User Management</div>
    </div>
    <div>
      <q-card>
        <GTable
          ref="tableRef"
          tableKey="developerAccount"
          apiUrl="/developer-account"
          :isRowActionEnabled="true"
        >
          <template #row-actions="{ data }">
            <div class="action-buttons">
              <q-btn-group spread flat>
                <q-btn
                  @click="openEditDialog(data)"
                  flat
                  color="grey-8"
                  icon="edit"
                  size="sm"
                  padding="xs sm"
                  class="action-btn"
                >
                  <q-tooltip>Edit User</q-tooltip>
                </q-btn>
                <q-separator vertical />
                <q-btn
                  @click="archiveUser(data)"
                  flat
                  color="grey-8"
                  icon="archive"
                  size="sm"
                  padding="xs sm"
                  class="action-btn"
                >
                  <q-tooltip>Archive User</q-tooltip>
                </q-btn>
                <q-separator vertical />
                <q-btn
                  @click="loginAsUser(data)"
                  flat
                  color="grey-8"
                  icon="login"
                  size="sm"
                  padding="xs sm"
                  class="action-btn"
                >
                  <q-tooltip>Login as User</q-tooltip>
                </q-btn>
              </q-btn-group>
            </div>
          </template>
          <template #developer="{ data }">
            <q-chip
              :color="data.isDeveloper ? 'primary' : 'grey-5'"
              text-color="white"
              size="sm"
              dense
              class="q-px-sm"
            >
              <q-icon 
                :name="data.isDeveloper ? 'check_circle' : 'cancel'" 
                size="16px" 
                class="q-mr-xs" 
              />
              {{ data.isDeveloper ? 'Yes' : 'No' }}
            </q-chip>
          </template>
          <template #status="{ data }">
            <q-chip
              :color="data.status === 'DEPLOYED' ? 'positive' : data.status === 'FLOATING' ? 'info' : 'warning'"
              text-color="white"
              size="sm"
              dense
              class="q-px-sm status-chip"
            >
              <q-icon 
                :name="data.status === 'DEPLOYED' ? 'deployed_code' : data.status === 'FLOATING' ? 'cloud' : 'pending'" 
                size="16px" 
                class="q-mr-xs" 
              />
              {{ data.status }}
            </q-chip>
          </template>
        </GTable>
      </q-card>
    </div>

    <DeveloperUserManagementDialog
      v-if="dialogState.open"
      :open="dialogState.open"
      :mode="dialogState.mode"
      :user="dialogState.user"
      @close="closeDialog"
      @success="onDialogSuccess"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, reactive, getCurrentInstance, defineAsyncComponent } from 'vue';
import { useQuasar } from 'quasar';
import { useAuthStore } from '../../../stores/auth';
import { useMultiAccountStore } from '../../../stores/multiAccount';
import { useRouter } from 'vue-router';
import GTable from '../../../components/shared/display/GTable.vue';

// Lazy-loaded dialogs (ALL dialogs must be lazy loaded - CLAUDE.md)
const DeveloperUserManagementDialog = defineAsyncComponent(() =>
  import('./DeveloperUserManagementDialog.vue')
);

export default defineComponent({
  name: 'DeveloperUserManagement',
  components: {
    GTable,
    DeveloperUserManagementDialog,
  },
  setup() {
    const $q = useQuasar();
    const authStore = useAuthStore();
    const multiAccountStore = useMultiAccountStore();
    const router = useRouter();
    const tableRef = ref<any>(null);
    const instance = getCurrentInstance();

    const dialogState = reactive({
      open: false,
      mode: 'create' as 'create' | 'edit',
      user: null as any,
    });


    const openEditDialog = (user: any) => {
      dialogState.mode = 'edit';
      dialogState.user = user;
      dialogState.open = true;
    };

    const closeDialog = () => {
      dialogState.open = false;
      dialogState.user = null;
    };

    const onDialogSuccess = () => {
      closeDialog();
      if (tableRef.value) {
        tableRef.value.refetch();
      }
    };


    const archiveUser = async (user: any) => {
      $q.dialog({
        title: 'Archive User',
        message: `Are you sure you want to archive user "${user.username}"?`,
        cancel: true,
        persistent: true,
      }).onOk(async () => {
        try {
          // For now, this is static - actual implementation would call an archive endpoint
          $q.notify({
            type: 'info',
            message: `Archive functionality for user "${user.username}" will be implemented soon`,
          });
        } catch (error) {
          $q.notify({
            type: 'negative',
            message: 'Failed to archive user',
          });
        }
      });
    };

    const loginAsUser = async (user: any) => {
      // Check if current user is a developer
      if (!authStore.isDeveloper) {
        $q.notify({
          type: 'negative',
          message: 'Only developer accounts can use this feature',
          position: 'top'
        });
        return;
      }

      $q.dialog({
        title: 'Login as User',
        message: `Are you sure you want to login as user "${user.username}"?`,
        html: true,
        cancel: true,
        persistent: true,
      }).onOk(async () => {
        $q.loading.show({
          message: `Logging in as ${user.username}...`
        });

        try {
          // Make API call to get token for the target user
          const response = await instance?.appContext.config.globalProperties.$api.post('/developer-account/login-as', {
            targetUserId: user.id
          });

          if (response?.data && response.data.token && response.data.accountInformation) {
            const { token, accountInformation, supabaseToken, supabaseRefreshToken } = response.data;

            // Add the impersonated account to multi-account store with impersonation flag and Supabase tokens
            multiAccountStore.addAccount(token, accountInformation, true, supabaseToken, supabaseRefreshToken);

            // Initialize Supabase session if tokens are provided
            if (supabaseToken && supabaseRefreshToken) {
              console.log('🔐 Login as User - Initializing Supabase session...');
              await authStore.storeSupabaseTokens(supabaseToken, supabaseRefreshToken);
            }

            $q.notify({
              type: 'positive',
              message: `Successfully logged in as ${user.username}`,
              position: 'top'
            });

            // Reload the page to refresh with the new account
            setTimeout(() => {
              router.go(0);
            }, 500);
          } else {
            throw new Error('Invalid response from server');
          }
        } catch (error: any) {
          console.error('Login as user error:', error);
          $q.notify({
            type: 'negative',
            message: error.response?.data?.message || 'Failed to login as user',
            position: 'top'
          });
        } finally {
          $q.loading.hide();
        }
      });
    };

    return {
      tableRef,
      dialogState,
      openEditDialog,
      closeDialog,
      onDialogSuccess,
      archiveUser,
      loginAsUser,
    };
  },
});
</script>

<style lang="scss" scoped>
.page {
  padding: 16px;
}

.gap-1 {
  gap: 4px;
}

.gap-2 {
  gap: 8px;
}

.action-buttons {
  display: flex;
  align-items: center;
  justify-content: center;
  
  :deep(.q-btn-group) {
    border: 1px solid rgba(0, 0, 0, 0.08);
    border-radius: 4px;
    
    .q-separator {
      margin: 4px 0;
      background: rgba(0, 0, 0, 0.08);
    }
  }
  
  .action-btn {
    transition: all 0.2s ease;
    
    &:hover {
      background: rgba(0, 0, 0, 0.04);
    }
    
    &:first-child {
      border-radius: 4px 0 0 4px;
    }
    
    &:last-child {
      border-radius: 0 4px 4px 0;
    }
  }
}

:deep(.q-table) {
  td {
    white-space: nowrap;
  }
  
  th {
    font-weight: 600;
    color: rgba(0, 0, 0, 0.87);
    background: rgba(0, 0, 0, 0.03);
  }
}

.status-chip {
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

:deep(.q-chip) {
  .q-icon {
    opacity: 0.9;
  }
}
</style>