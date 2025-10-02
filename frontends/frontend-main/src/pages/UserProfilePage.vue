<template>
  <q-page class="md3-profile-page">
    <!-- Page Header -->
    <div class="md3-page-header">
      <h1 class="md3-headline-large">My Profile</h1>
      <q-breadcrumbs class="md3-breadcrumbs" separator="›">
        <q-breadcrumbs-el label="Home" to="/" />
        <q-breadcrumbs-el label="Profile" />
      </q-breadcrumbs>
    </div>

    <!-- Profile Content Card -->
    <div class="md3-surface-container">
      <!-- Tab Navigation -->
      <div class="md3-tab-container">
        <q-tabs
          v-model="tab"
          class="md3-tabs"
          active-color="primary"
          indicator-color="primary"
          align="left"
          no-caps
        >
          <q-tab name="account" class="md3-tab">
            <q-icon name="person_outline" size="20px" class="q-mr-sm" />
            <span class="md3-label-large">Account Info</span>
          </q-tab>
          <q-tab name="password" class="md3-tab">
            <q-icon name="lock_outline" size="20px" class="q-mr-sm" />
            <span class="md3-label-large">Security</span>
          </q-tab>
          <q-tab name="avatar" class="md3-tab">
            <q-icon name="account_circle" size="20px" class="q-mr-sm" />
            <span class="md3-label-large">Profile Picture</span>
          </q-tab>
          <q-tab name="auth-methods" class="md3-tab">
            <q-icon name="security" size="20px" class="q-mr-sm" />
            <span class="md3-label-large">Login Methods</span>
          </q-tab>
        </q-tabs>
      </div>

      <!-- Tab Content -->
      <q-tab-panels v-model="tab" animated class="md3-tab-panels">
        <!-- Account Info Tab -->
        <q-tab-panel name="account" class="md3-tab-panel">
          <account-info-form :loading="loading" :initial-data="userData" @submit="updateProfile" />
        </q-tab-panel>

        <!-- Change Password Tab -->
        <q-tab-panel name="password" class="md3-tab-panel">
          <change-password-form :loading="loading" :has-password="hasPassword" @submit="changePassword" />
        </q-tab-panel>

        <!-- Profile Picture Tab -->
        <q-tab-panel name="avatar" class="md3-tab-panel">
          <profile-picture-upload :loading="loading" :current-image="userData?.image" @upload="uploadProfilePicture" @remove="removeProfilePicture" />
        </q-tab-panel>

        <!-- Auth Methods Tab -->
        <q-tab-panel name="auth-methods" class="md3-tab-panel">
          <auth-methods-manager />
        </q-tab-panel>
      </q-tab-panels>
    </div>
  </q-page>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { useAuthStore } from '../stores/auth';
import { AccountDataResponse } from '@shared/response/account.response';
import { api } from '../boot/axios';
import AccountInfoForm from '../components/profile/AccountInfoForm.vue';
import ChangePasswordForm from '../components/profile/ChangePasswordForm.vue';
import ProfilePictureUpload from '../components/profile/ProfilePictureUpload.vue';
import AuthMethodsManager from '../components/AuthMethodsManager.vue';

export default defineComponent({
  name: 'UserProfilePage',
  components: {
    AccountInfoForm,
    ChangePasswordForm,
    ProfilePictureUpload,
    AuthMethodsManager,
  },
  setup() {
    const $q = useQuasar();
    const authStore = useAuthStore();
    const tab = ref('account');
    const loading = ref(false);
    const hasPassword = ref(true); // Default to true, will be updated after fetching auth methods

    interface UserProfileFormData {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      image?: string;
    }

    const userData = ref<UserProfileFormData>({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      image: '',
    });

    const fetchAuthMethods = async () => {
      try {
        const { data } = await api.get('/account/auth-methods');
        hasPassword.value = data.hasPassword || false;
      } catch (error) {
        console.error('Failed to fetch auth methods:', error);
        // Default to true if there's an error
        hasPassword.value = true;
      }
    };

    const fetchUserData = () => {
      loading.value = true;

      // First, try to get data from the auth store if available
      if (authStore.accountInformation) {
        const { firstName, lastName, email, contactNumber, image } = authStore.accountInformation;
        userData.value = {
          firstName: firstName || '',
          lastName: lastName || '',
          email: email || '',
          phone: contactNumber || '',
          image: image || '',
        };
      }

      // Then fetch fresh data from the API
      api.get('/account/my_account')
        .then(({ data }) => {
          if (data) {
            const { firstName, lastName, email, contactNumber, image } = data;
            userData.value = {
              firstName: firstName || '',
              lastName: lastName || '',
              email: email || '',
              phone: contactNumber || '',
              image: image || '',
            };

            // Update auth store with fresh data
            authStore.storeAccountInformation({
              ...authStore.accountInformation,
              firstName,
              lastName,
              email,
              contactNumber,
              image,
            });
          }
        })
        .catch((error) => {
          console.error('Failed to fetch user data:', error);
          $q.notify({
            type: 'negative',
            message: 'Failed to load profile data',
            position: 'top',
          });
        })
        .finally(() => {
          loading.value = false;
        });
    };

    const updateProfile = (formData: { firstName: string; lastName: string; email: string; phone: string }) => {
      loading.value = true;

      api.patch('/account/profile', formData)
        .then(({ data }) => {
          if (data?.data) {
            const updatedData: AccountDataResponse = {
              ...authStore.accountInformation,
              firstName: formData.firstName,
              lastName: formData.lastName,
              email: formData.email,
              contactNumber: formData.phone,
            };

            // Update local user data
            userData.value = {
              ...userData.value,
              ...formData,
            };

            // Update auth store with complete data
            authStore.storeAccountInformation(updatedData);

            $q.notify({
              type: 'positive',
              message: 'Profile updated successfully',
              position: 'top',
              timeout: 2000,
            });
          }
        })
        .catch((error) => {
          console.error('Failed to update profile:', error);
          $q.notify({
            type: 'negative',
            message: 'Failed to update profile',
            position: 'top',
          });
        })
        .finally(() => {
          loading.value = false;
        });
    };

    interface ChangePasswordData {
      currentPassword: string;
      newPassword: string;
      confirmPassword: string;
    }

    const changePassword = (passwords: ChangePasswordData, callback: (success: boolean) => void) => {
      loading.value = true;

      // Determine which endpoint to use based on whether password exists
      const endpoint = hasPassword.value ? '/account/change-user-password' : '/account/set-password';
      const payload = hasPassword.value 
        ? {
            currentPassword: passwords.currentPassword,
            newPassword: passwords.newPassword,
            confirmPassword: passwords.confirmPassword,
          }
        : {
            password: passwords.newPassword,
          };

      api.post(endpoint, payload)
        .then(() => {
          $q.notify({
            type: 'positive',
            message: hasPassword.value ? 'Password changed successfully' : 'Password set successfully',
            position: 'top',
            timeout: 2000,
            actions: [{ icon: 'close', color: 'white' }],
          });
          // Update hasPassword after successful set/change
          if (!hasPassword.value) {
            hasPassword.value = true;
          }
          // Refresh auth methods
          fetchAuthMethods();
          callback(true);
        })
        .catch((error) => {
          console.error('Failed to change password:', error);
          const errorMessage = error?.response?.data?.message || 'Failed to change password';
          $q.notify({
            type: 'negative',
            message: errorMessage,
            position: 'top',
          });
          callback(false);
        })
        .finally(() => {
          loading.value = false;
        });
    };

    const uploadProfilePicture = (file: File): Promise<boolean> => {
      loading.value = true;
      const formData = new FormData();
      formData.append('file', file);

      return new Promise<boolean>((resolve) => {
        api.post('/account/change-profile-picture', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        })
          .then(({ data }) => {
            // The response might be directly in data.image (based on backend code)
            const imageUrl = data?.image || data?.data?.image;
            if (imageUrl) {
              // Update local user data
              userData.value.image = imageUrl;

              // Update auth store with the new image
              const updatedData = {
                ...authStore.accountInformation,
                image: imageUrl,
              };
              authStore.storeAccountInformation(updatedData);

              $q.notify({
                type: 'positive',
                message: 'Profile picture updated successfully',
                position: 'top',
                timeout: 2000,
                actions: [{ icon: 'close', color: 'white' }],
              });
              resolve(true);
            } else {
              resolve(false);
            }
          })
          .catch((error) => {
            console.error('Failed to upload profile picture:', error);
            $q.notify({
              type: 'negative',
              message: 'Failed to upload profile picture',
              position: 'top',
            });
            resolve(false);
          })
          .finally(() => {
            loading.value = false;
          });
      });
    };

    const removeProfilePicture = (): Promise<boolean> => {
      loading.value = true;

      return new Promise<boolean>((resolve) => {
        api.delete('/account/profile-picture')
          .then(() => {
            // Update local user data
            userData.value.image = '';

            // Update auth store
            if (authStore.accountInformation) {
              const updatedData = {
                ...authStore.accountInformation,
                image: '',
              };
              authStore.storeAccountInformation(updatedData);
            }

            $q.notify({
              type: 'positive',
              message: 'Profile picture removed',
              position: 'top',
              timeout: 2000,
              actions: [{ icon: 'close', color: 'white' }],
            });
            resolve(true);
          })
          .catch((error) => {
            console.error('Failed to remove profile picture:', error);
            $q.notify({
              type: 'negative',
              message: 'Failed to remove profile picture',
              position: 'top',
            });
            resolve(false);
          })
          .finally(() => {
            loading.value = false;
          });
      });
    };

    onMounted(() => {
      fetchUserData();
      fetchAuthMethods();
    });

    return {
      tab,
      loading,
      userData,
      hasPassword,
      updateProfile,
      changePassword,
      uploadProfilePicture,
      removeProfilePicture,
    };
  },
});
</script>

<style lang="scss" scoped>
.md3-profile-page {
  background-color: #f8f9fa;
  min-height: 100vh;
  padding: 24px;

  @media (max-width: 768px) {
    padding: 0;
  }
}

.md3-page-header {
  margin-bottom: 32px;
}

.md3-headline-large {
  font-size: 32px;
  line-height: 40px;
  font-weight: 400;
  letter-spacing: 0;
  color: #1f1f1f;
  margin: 0 0 8px 0;
}

.md3-breadcrumbs {
  :deep(.q-breadcrumbs__el) {
    font-size: 14px;
    line-height: 20px;
    color: #5f6368;

    &:last-child {
      color: #1f1f1f;
    }
  }

  :deep(.q-breadcrumbs__separator) {
    color: #5f6368;
    margin: 0 8px;
  }
}

.md3-surface-container {
  background-color: #ffffff;
  border-radius: 12px;
  border: 1px solid #e8eaed;
  overflow: hidden;
  box-shadow: none;
}

.md3-tab-container {
  background-color: #ffffff;
  border-bottom: 1px solid #e8eaed;
}

.md3-tabs {
  :deep(.q-tabs__content) {
    padding: 0 16px;
  }

  :deep(.q-tab) {
    min-height: 48px;
    padding: 0 24px;
    text-transform: none;
    font-weight: 500;

    &.q-tab--active {
      .q-icon {
        color: var(--q-primary);
      }
      .md3-label-large {
        color: var(--q-primary);
      }
    }

    &:not(.q-tab--active) {
      .q-icon {
        color: #5f6368;
      }
      .md3-label-large {
        color: #5f6368;
      }
    }
  }

  :deep(.q-tab__indicator) {
    height: 3px;
    border-radius: 3px 3px 0 0;
  }
}

.md3-label-large {
  font-size: 14px;
  line-height: 20px;
  font-weight: 500;
  letter-spacing: 0.1px;
}

.md3-tab-panels {
  background-color: transparent;

  :deep(.q-tab-panel) {
    padding: 0;
  }
}

.md3-tab-panel {
  background-color: #ffffff;
}

/* Responsive Design */
@media (max-width: 599px) {
  .md3-profile-page {
    padding: 0;
  }

  .md3-headline-large {
    font-size: 24px;
    line-height: 32px;
  }

  .md3-tab-container {
    :deep(.q-tabs__content) {
      padding: 0 8px;
    }
  }

  .md3-tabs {
    :deep(.q-tab) {
      padding: 0 16px;

      .q-icon {
        display: none;
      }
    }
  }
}
</style>
