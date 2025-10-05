<template>
  <div class="member-profile-mobile-page">
    <!-- Profile Header -->
    <div class="profile-header">
      <!-- Multiple Accounts Section -->
      <div class="accounts-section">
        <!-- Active Account -->
        <div
          class="account-item active-account"
          @click="multiAccountStore.accountCount > 1 ? null : void 0"
        >
          <q-avatar size="48px" class="account-avatar">
            <img
              :src="authStore.accountInformation?.image || 'https://cdn.quasar.dev/img/avatar.png'"
            />
          </q-avatar>
          <div class="account-info">
            <div class="account-name text-title-medium-w-[600] text-dark">
              {{ authStore.accountInformation?.fullName }}
              <span class="logged-in-badge text-dark">Logged In</span>
            </div>
            <div class="account-role text-body-medium">
              {{ authStore.accountInformation?.role?.name || 'Role' }} •
              {{ authStore.accountInformation?.company?.companyName || 'Company' }}
            </div>
          </div>
        </div>

        <q-separator />

        <!-- Other Accounts -->
        <div v-if="multiAccountStore.accountCount > 1">
          <div
            v-for="account in otherAccounts"
            :key="account.accountInformation.id"
            class="account-item"
            @click="switchToAccount(account.accountInformation.id)"
          >
            <q-avatar size="32px" class="account-avatar">
              <img
                :src="account.accountInformation.image || 'https://cdn.quasar.dev/img/avatar.png'"
              />
            </q-avatar>
            <div class="account-info">
              <div class="account-name text-title-small-w-[600] text-dark">{{ account.accountInformation.fullName }}</div>
              <div class="account-role text-body-small">
                {{ account.accountInformation?.role?.name || 'Role' }} •
                {{ account.accountInformation?.company?.companyName || 'Company' }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="action-buttons">
        <div class="action-button" @click="manageAccount">
          <div class="action-button-icon">
            <q-icon name="o_settings" size="20px" class="text-grey-light" />
          </div>
          <span class="text-label-large">Manage Account</span>
        </div>
        <div class="action-button" @click="showAddAccountDialog = true">
          <div class="action-button-icon">
            <q-icon name="add" size="20px" class="text-grey-light" />
          </div>
          <span class="text-label-large">Add Another Account</span>
        </div>
      </div>
    </div>

    <!-- My Employee Information Widget -->
    <MyEmployeeInformationWidget />

    <div class="">
      <div class="logout-container text-body-medium text-negative" @click="handleLogout()">
        Logout
      </div>

      <div
        v-if="multiAccountStore.hasMultipleAccounts"
        class="logout-container q-mt-sm text-body-medium text-grey-7"
        @click="handleLogoutAll()"
      >
        Sign Out all Accounts
      </div>
    </div>

    <!-- Add Account Dialog -->
    <AddAccountDialog v-model="showAddAccountDialog" @account-added="handleAccountAdded" />
    
    <!-- Manage Account Dialog -->
    <ManageAccountDialog v-model="showManageAccountDialog" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { defineAsyncComponent } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from 'src/stores/auth';
import { useMultiAccountStore } from 'src/stores/multiAccount';
import { useQuasar } from 'quasar';
import MyEmployeeInformationWidget from 'src/pages/Member/Dashboard/MyEmploymentInformationWidget/MyEmploymentInformationWidget.vue';

// Lazy-loaded dialogs (ALL dialogs must be lazy loaded - CLAUDE.md)
const AddAccountDialog = defineAsyncComponent(() =>
  import('src/components/auth/AddAccountDialog.vue')
);
const ManageAccountDialog = defineAsyncComponent(() =>
  import('src/components/profile/ManageAccountDialog.vue')
);

// Composables
const router = useRouter();
const authStore = useAuthStore();
const multiAccountStore = useMultiAccountStore();
const $q = useQuasar();
const showAddAccountDialog = ref(false);
const showManageAccountDialog = ref(false);

const otherAccounts = computed(() => {
  return multiAccountStore.allAccounts.filter(
    (account) => account.accountInformation.id !== multiAccountStore.activeAccountId
  );
});

// Action methods
const manageAccount = () => {
  showManageAccountDialog.value = true;
};

const switchToAccount = async (accountId: string) => {
  if (accountId === multiAccountStore.activeAccountId) {
    return;
  }

  $q.loading.show({
    message: 'Switching account...',
  });

  try {
    const success = multiAccountStore.switchAccount(accountId);
    if (success) {
      await router.push({ name: 'member_dashboard' });
      router.go(0);
    } else {
      $q.notify({
        type: 'negative',
        message: 'Failed to switch account',
        position: 'top',
      });
    }
  } catch (error) {
    console.error('Error switching account:', error);
    $q.notify({
      type: 'negative',
      message: 'An error occurred while switching accounts',
      position: 'top',
    });
  } finally {
    $q.loading.hide();
  }
};

const handleAccountAdded = () => {
  showAddAccountDialog.value = false;
  $q.notify({
    type: 'positive',
    message: 'Account added successfully',
    position: 'top',
  });
  router.go(0);
};

// Logout single account method
const handleLogout = () => {
  $q.dialog({
    title: 'Logout',
    message: 'Are you sure you want to logout?',
    cancel: true,
    persistent: true,
  }).onOk(() => {
    // Get current account ID
    const currentAccountId = authStore.accountInformation?.id;

    if (currentAccountId) {
      // Remove current account from multi-account store
      multiAccountStore.removeAccount(currentAccountId);

      // If there are other accounts, it will automatically switch to one
      // If no accounts left, it will clear auth and redirect
      if (multiAccountStore.accountCount === 0) {
        // Clear all auth data
        authStore.clearLoginData();

        // Redirect to login page
        router.push('/login');
      }
    } else {
      // Fallback: clear all auth data
      authStore.clearLoginData();
      router.push('/login');
    }

    $q.notify({
      type: 'positive',
      message: 'Logged out successfully',
      position: 'top',
    });
  });
};

// Logout all accounts method
const handleLogoutAll = () => {
  $q.dialog({
    title: 'Sign out of all accounts?',
    message: 'Are you sure you want to sign out of all accounts?',
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    try {
      // Remove all accounts from multi-account store
      multiAccountStore.removeAllAccounts();

      // Clear auth store
      authStore.clearLoginData();

      // Redirect to login page
      await router.push('/login');

      $q.notify({
        type: 'positive',
        message: 'Signed out of all accounts successfully',
        position: 'top',
      });
    } catch (error) {
      console.error('Logout all error:', error);
      $q.notify({
        type: 'negative',
        message: 'An error occurred while signing out',
        position: 'top',
      });
    }
  });
};
</script>

<style lang="scss" scoped>
.member-profile-mobile-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-bottom: 26px;
}

.profile-header {
  display: flex;
  flex-direction: column;
  border-radius: 16px;
  background-color: #fff;
  box-shadow: 0px 1px 4px 0px rgba(133, 146, 173, 0.2);

  .welcome-header {
    padding: 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid #dde1f0;

    .welcome-text {
      flex: 1;
      text-align: left;
      margin-left: 16px;
      font-size: 18px;
      font-weight: 500;
      color: #333;
    }

    .q-icon {
      cursor: pointer;
      &:hover {
        color: #1976d2 !important;
      }
    }
  }

  .accounts-section {

    .account-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      border-radius: 8px;
      cursor: pointer;
      transition: background-color 0.2s;

      &:hover {
        background-color: #f5f5f5;
      }

      &.active-account {
        cursor: default;

        &:hover {
          background-color: transparent;
        }
      }

      .account-avatar {
        flex-shrink: 0;
      }

      .account-info {
        flex: 1;

        .account-name {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 4px;

          .logged-in-badge {
            font-size: 12px;
            font-weight: normal;
            background-color: var(--q-light);
            padding: 3px 8px;
            border-radius: 50px;
          }
        }
      }
    }
  }

  .action-buttons {
    border-top: 1px solid #dde1f0;
    padding: 16px 8px;

    .action-button {
      min-width: 100%;
      display: flex;
      align-items: center;
      justify-content: start;
      padding: 8px;
      cursor: pointer;
      transition: background-color 0.2s;
      border-radius: 8px;

      &:hover {
        background-color: #f5f5f5;
      }
    }

    .action-button-icon {
      background-color: #dde1f0;
      width: 32px;
      height: 32px;
      border-radius: 50px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 16px;
    }
  }
}

.logout-container {
  background-color: #fff;
  box-shadow: 0px 1px 4px 0px rgba(133, 146, 173, 0.2);
  padding: 12px;
  display: flex;
  justify-content: center;
  border-radius: 16px;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #f5f5f5;
  }

  &:active {
    background-color: #e0e0e0;
  }
}
</style>
