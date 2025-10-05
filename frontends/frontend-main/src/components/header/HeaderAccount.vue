<template>
  <div>
    <!-- Account Dropdown -->
    <q-btn-dropdown
      no-caps
      flat
      square
      :ripple="false"
      dropdown-icon="none"
      class="header-account-btn"
    >
    <q-list class="account-nav-list">
      <!-- User Info Header -->
      <div class="account-header q-pa-md">
        <div class="row items-center q-gutter-sm">
          <q-avatar size="56px">
            <img :src="accountImage" />
          </q-avatar>
          <div class="col">
            <div class="text-subtitle1 text-weight-medium">{{ authStore.accountInformation?.fullName || 'User' }}</div>
            <div class="text-caption text-grey-7">{{ authStore.accountInformation?.role?.name || 'Role' }}</div>
            <div class="text-caption text-grey-6">{{ authStore.accountInformation?.company?.companyName || 'No Company' }}</div>
            <div v-if="multiAccountStore.isImpersonating" class="impersonation-badge q-mt-xs">
              <q-icon name="supervisor_account" size="14px" class="q-mr-xs" />
              <span>Logged in as this user</span>
            </div>
          </div>
        </div>

        <!-- Manage Account Button -->
        <q-btn
          flat
          no-caps
          color="primary"
          label="Manage your account"
          class="full-width q-mt-sm"
          size="sm"
          @click="navigateToProfile"
          v-close-popup
        />
      </div>

      <q-separator />

      <!-- Multiple Accounts Section -->
      <div v-if="multiAccountStore.accountCount > 1" class="q-py-xs accounts-section">
        <!-- List all accounts -->
        <q-item
          v-for="account in multiAccountStore.allAccounts"
          :key="account.accountInformation.id"
          clickable
          v-close-popup
          @click="switchToAccount(account.accountInformation.id)"
          class="account-item"
          :class="{ 'active-account': account.accountInformation.id === multiAccountStore.activeAccountId }"
        >
          <q-item-section avatar>
            <q-avatar size="36px">
              <img :src="account.accountInformation.image || 'https://cdn.quasar.dev/img/avatar.png'" />
            </q-avatar>
          </q-item-section>
          <q-item-section>
            <q-item-label class="text-body2">
              {{ account.accountInformation.fullName }}
              <q-icon v-if="account.isImpersonating" name="supervisor_account" size="16px" color="warning" class="q-ml-xs">
                <q-tooltip>Logged in via developer access</q-tooltip>
              </q-icon>
            </q-item-label>
            <q-item-label class="text-weight-medium" caption lines="1">{{ account.accountInformation?.company?.companyName || 'No Company' }}</q-item-label>
            <q-item-label caption lines="1">{{ account.accountInformation?.role?.name || 'Role' }}</q-item-label>
          </q-item-section>
          <q-item-section side v-if="account.accountInformation.id === multiAccountStore.activeAccountId">
            <q-icon name="check_circle" color="primary" size="20px" />
          </q-item-section>
        </q-item>
        <q-separator inset />
      </div>

      <!-- Add Another Account -->
      <q-item
        clickable
        v-close-popup
        @click="addAnotherAccount"
        class="add-account-item"
      >
        <q-item-section avatar>
          <q-avatar size="36px" color="grey-3" text-color="grey-7">
            <q-icon name="add" size="20px" />
          </q-avatar>
        </q-item-section>
        <q-item-section>
          <q-item-label class="text-body2">Add another account</q-item-label>
        </q-item-section>
      </q-item>

      <q-separator />

      <!-- Footer Actions -->
      <div class="q-pa-sm">
        <q-item
          clickable
          dense
          @click.stop="handleLogout($event)"
          class="rounded-borders"
        >
          <q-item-section>
            <q-item-label class="text-center text-body2">
              Sign out of {{ authStore.accountInformation?.fullName || 'Account' }}
            </q-item-label>
          </q-item-section>
        </q-item>

        <q-item
          v-if="multiAccountStore.hasMultipleAccounts"
          clickable
          dense
          @click="logoutAll"
          class="rounded-borders q-mt-xs"
        >
          <q-item-section>
            <q-item-label class="text-center text-body2 text-grey-7">
              Sign out of all accounts
            </q-item-label>
          </q-item-section>
        </q-item>
      </div>
    </q-list>

    <template v-slot:label>
      <div class="header-account-trigger">
        <q-avatar size="36px" class="q-mr-sm">
          <img :src="accountImage" />
        </q-avatar>
        <div class="profile-info">
          <div class="text-body2 text-weight-medium">{{ displayName }}</div>
          <div class="text-caption text-grey-6">{{ authStore.accountInformation?.role?.name || '' }}</div>
        </div>
        <q-icon name="expand_more" size="18px" class="q-ml-xs dropdown-icon" />
      </div>
    </template>
  </q-btn-dropdown>

    <!-- Add Account Dialog -->
    <AddAccountDialog
      v-model="showAddAccountDialog"
      @account-added="handleAccountAdded"
    />
  </div>
</template>

<style scoped>
.header-account-btn {
  padding: 6px 12px 6px 6px;
  border-radius: 28px;
  transition: all 0.2s;
  border: 1px solid transparent;
}

.header-account-btn:hover {
  background-color: rgba(0, 0, 0, 0.05);
  border-color: rgba(0, 0, 0, 0.1);
}

.header-account-trigger {
  display: flex;
  align-items: center;
}

.profile-info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  line-height: 1.2;
  margin-right: 4px;
}

.dropdown-icon {
  color: #666;
  transition: transform 0.2s;
}

.header-account-btn[aria-expanded="true"] .dropdown-icon {
  transform: rotate(180deg);
}

.account-nav-list {
  min-width: 320px;
  max-width: 360px;
  padding: 0;
  max-height: 70vh;
  overflow: hidden;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
}

.accounts-section {
  max-height: 300px;
  overflow-y: auto;
  overflow-x: hidden;
}

.account-header {
  background-color: #f8f9fa;
  border-radius: 8px 8px 0 0;
}

.account-item {
  padding: 12px 16px;
  transition: background-color 0.2s;
}

.account-item:hover {
  background-color: #f5f5f5;
}

.account-item.active-account {
  background-color: #e3f2fd;
}

.account-item.active-account:hover {
  background-color: #bbdefb;
}

.add-account-item {
  padding: 12px 16px;
  transition: background-color 0.2s;
}

.add-account-item:hover {
  background-color: #f5f5f5;
}


/* Custom scrollbar for accounts section */
.accounts-section::-webkit-scrollbar {
  width: 6px;
}

.accounts-section::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.accounts-section::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 3px;
}

.accounts-section::-webkit-scrollbar-thumb:hover {
  background: #555;
}

/* Hover effects for footer actions */
.account-nav-list .q-pa-sm .q-item:hover {
  background-color: #f5f5f5;
}

/* Impersonation indicator */
.impersonation-badge {
  display: inline-flex;
  align-items: center;
  background-color: #fff3cd;
  color: #856404;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
  border: 1px solid #ffeeba;
}

/* Profile image styling for non-square images */
.q-avatar img {
  object-fit: cover;
  width: 100%;
  height: 100%;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .header-account-btn {
    padding: 4px 8px 4px 4px;
  }

  .account-nav-list {
    min-width: 90vw;
    max-width: 95vw;
    max-height: 80vh;
  }

  .header-account-trigger {
    .q-avatar {
      size: 32px !important;
    }
  }

  .profile-info {
    display: none;
  }

  .dropdown-icon {
    display: none;
  }
}

@media (max-width: 599px) {
  .header-account-btn {
    padding: 2px;
  }

  .header-account-trigger {
    .q-avatar {
      size: 28px !important;
      margin-right: 0 !important;
    }
  }
}
</style>

<script lang="ts">
import { defineComponent, computed, onMounted, ref, defineAsyncComponent } from 'vue';
import { useAuthStore } from "../../stores/auth";
import { useMultiAccountStore } from "../../stores/multiAccount";
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';

// Lazy-loaded dialogs (ALL dialogs must be lazy loaded - CLAUDE.md)
const AddAccountDialog = defineAsyncComponent(() =>
  import('../auth/AddAccountDialog.vue')
);

export default defineComponent({
  name: 'HeaderAccount',

  components: {
    AddAccountDialog
  },

  setup() {
    const authStore = useAuthStore();
    const multiAccountStore = useMultiAccountStore();
    const router = useRouter();
    const $q = useQuasar();
    const showAddAccountDialog = ref(false);

    const accountImage = computed(() => {
      return authStore.accountInformation?.image || 'https://cdn.quasar.dev/img/avatar.png';
    });

    const displayName = computed(() => {
      const fullName = authStore.accountInformation?.fullName || '';
      // If the name is in "Lastname, Firstname" format, convert it
      if (fullName.includes(',')) {
        const [lastname, firstname] = fullName.split(',').map(s => s.trim());
        return `${firstname} ${lastname}`;
      }
      return fullName;
    });

    onMounted(async () => {
      // Load multi-account data on component mount
      multiAccountStore.loadFromLocalStorage();

      // Refresh current account data to ensure we have the latest info including image
      if (authStore.accountInformation?.id) {
        try {
          await authStore.refreshAccountInformation();
          // Update the multi-account store with fresh data
          if (authStore.accountInformation) {
            const accountIndex = multiAccountStore.accounts.findIndex(
              acc => acc.accountInformation.id === authStore.accountInformation.id
            );
            if (accountIndex !== -1) {
              multiAccountStore.accounts[accountIndex].accountInformation = authStore.accountInformation;
              multiAccountStore.saveToLocalStorage();
            }
          }
        } catch (error) {
          console.error('Failed to refresh account information:', error);
        }
      }
    });

    const switchToAccount = async (accountId: string): Promise<void> => {
      if (accountId === multiAccountStore.activeAccountId) {
        return; // Already active
      }

      $q.loading.show({
        message: 'Switching account...'
      });

      try {
        const success = multiAccountStore.switchAccount(accountId);
        if (success) {
          // Reload the page to refresh all components with new account
          await router.push({ name: 'member_dashboard' });
          router.go(0);
        } else {
          $q.notify({
            type: 'negative',
            message: 'Failed to switch account',
            position: 'top'
          });
        }
      } catch (error) {
        console.error('Account switch error:', error);
        $q.notify({
          type: 'negative',
          message: 'Error switching account',
          position: 'top'
        });
      } finally {
        $q.loading.hide();
      }
    };

    const addAnotherAccount = (): void => {
      showAddAccountDialog.value = true;
    };

    const handleAccountAdded = () => {
      // Reload the page to refresh all components with new account
      router.go(0);
    };

    const handleLogout = async (event?: Event): Promise<void> => {
      console.log('HeaderAccount logout called!');

      // Prevent any default behavior
      if (event) {
        event.preventDefault();
        event.stopPropagation();
      }

      try {
        const currentAccountId = authStore.accountInformation?.id;
        if (!currentAccountId) return;

        console.log('Current account ID:', currentAccountId);
        console.log('Total accounts before removal:', multiAccountStore.accountCount);

        // Check if there are other accounts
        const hasOtherAccounts = multiAccountStore.accountCount > 1;

        if (hasOtherAccounts) {
          console.log('Has other accounts, switching...');

          // Remove the current account
          // The removeAccount method will automatically switch to another account
          multiAccountStore.removeAccount(currentAccountId);

          console.log('Account removed, new active:', multiAccountStore.activeAccount?.accountInformation.email);

          // Small delay to ensure everything is synced
          await new Promise(resolve => setTimeout(resolve, 100));
          // Reload the page with the new active account
          window.location.reload();
        } else {
          console.log('No other accounts, logging out completely');
          // No other accounts, remove and go to login
          multiAccountStore.removeAccount(currentAccountId);
          await router.push('/login');
        }
      } catch (error) {
        console.error('Logout error:', error);
      }
    };

    const logoutAll = async (): Promise<void> => {
      $q.dialog({
        title: 'Sign out of all accounts?',
        message: 'Are you sure you want to sign out of all accounts?',
        cancel: true,
        persistent: true
      }).onOk(async () => {
        try {
          multiAccountStore.removeAllAccounts();
          await router.push('/login');
        } catch (error) {
          console.error('Logout all error:', error);
        }
      });
    };

    const navigateToProfile = () => {
      router.push('/profile');
    };

    return {
      authStore,
      multiAccountStore,
      accountImage,
      displayName,
      showAddAccountDialog,
      switchToAccount,
      addAnotherAccount,
      handleAccountAdded,
      handleLogout,
      logoutAll,
      navigateToProfile
    };
  }
});
</script>
