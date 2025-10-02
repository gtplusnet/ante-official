<template>
  <q-dialog
    v-model="dialogVisible"
    @before-show="fetchUserData"
    :maximized="isTabletOrMobile"
    transition-show="slide-up"
    transition-hide="slide-down"
  >
    <q-card :class="cardClass">
      <!-- Header -->
      <div class="dialog-header">
        <div class="row items-center">
          <div class="col">
            <div class="text-h6 text-dark">Manage Account</div>
          </div>
          <q-btn
            flat
            round
            dense
            icon="close"
            @click="closeDialog"
            :disable="loading"
          />
        </div>
      </div>

      <q-separator />

      <!-- Tab Navigation -->
      <div class="tab-container">
        <q-tabs v-model="tab" class="account-tabs" no-caps>
          <q-tab name="account" class="account-tab" icon="o_account_circle">
            <span class="tab-label">Account Info</span>
          </q-tab>
          <q-tab
            name="password"
            class="account-tab"
            icon="o_admin_panel_settings"
          >
            <span class="tab-label">Security</span>
          </q-tab>
          <q-tab name="avatar" class="account-tab" icon="o_add_a_photo">
            <span class="tab-label">Profile Picture</span>
          </q-tab>
          <q-tab name="auth-methods" class="account-tab" icon="o_lock_person">
            <span class="tab-label">Login Methods</span>
          </q-tab>
        </q-tabs>
      </div>

      <!-- Tab Content -->
      <q-card-section class="tab-content-section">
        <q-tab-panels v-model="tab" animated class="account-tab-panels">
          <!-- Account Info Tab -->
          <q-tab-panel name="account" class="account-tab-panel">
            <account-info-form
              :loading="loading"
              :initial-data="userData"
              @submit="updateProfile"
            />
          </q-tab-panel>

          <!-- Change Password Tab -->
          <q-tab-panel name="password" class="account-tab-panel">
            <change-password-form
              :loading="loading"
              :has-password="hasPassword"
              @submit="changePassword"
            />
          </q-tab-panel>

          <!-- Profile Picture Tab -->
          <q-tab-panel name="avatar" class="account-tab-panel">
            <profile-picture-upload
              :loading="loading"
              :current-image="userData?.image"
              @upload="uploadProfilePicture"
              @remove="removeProfilePicture"
            />
          </q-tab-panel>

          <!-- Auth Methods Tab -->
          <q-tab-panel name="auth-methods" class="account-tab-panel">
            <auth-methods-manager />
          </q-tab-panel>
        </q-tab-panels>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted } from "vue";
import { useQuasar } from "quasar";
import { useAuthStore } from "src/stores/auth";
import { AccountDataResponse } from "src/shared/response/account.response";
import { api } from "src/boot/axios";
import AccountInfoForm from "./AccountInfoForm.vue";
import ChangePasswordForm from "./ChangePasswordForm.vue";
import ProfilePictureUpload from "./ProfilePictureUpload.vue";
import AuthMethodsManager from "../AuthMethodsManager.vue";

export default defineComponent({
  name: "ManageAccountDialog",

  components: {
    AccountInfoForm,
    ChangePasswordForm,
    ProfilePictureUpload,
    AuthMethodsManager,
  },

  props: {
    modelValue: {
      type: Boolean,
      required: true,
    },
  },

  emits: ["update:modelValue"],

  setup(props, { emit }) {
    const $q = useQuasar();
    const authStore = useAuthStore();
    const tab = ref("account");
    const loading = ref(false);
    const hasPassword = ref(true);

    const dialogVisible = computed({
      get: () => props.modelValue,
      set: (value) => emit("update:modelValue", value),
    });

    const isTabletOrMobile = computed(() => {
      return $q.screen.lt.lg;
    });

    const cardClass = computed(() => {
      return {
        "manage-account-card": !isTabletOrMobile.value,
        "fullscreen-card": isTabletOrMobile.value,
      };
    });

    interface UserProfileFormData {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      image?: string;
    }

    const userData = ref<UserProfileFormData>({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      image: "",
    });

    const closeDialog = () => {
      dialogVisible.value = false;
    };

    const fetchAuthMethods = async () => {
      try {
        const { data } = await api.get("/account/auth-methods");
        hasPassword.value = data.hasPassword || false;
      } catch (error) {
        console.error("Failed to fetch auth methods:", error);
        hasPassword.value = true;
      }
    };

    const fetchUserData = () => {
      loading.value = true;

      if (authStore.accountInformation) {
        const { firstName, lastName, email, contactNumber, image } =
          authStore.accountInformation;
        userData.value = {
          firstName: firstName || "",
          lastName: lastName || "",
          email: email || "",
          phone: contactNumber || "",
          image: image || "",
        };
      }

      api
        .get("/account/my_account")
        .then(({ data }) => {
          if (data) {
            const { firstName, lastName, email, contactNumber, image } = data;
            userData.value = {
              firstName: firstName || "",
              lastName: lastName || "",
              email: email || "",
              phone: contactNumber || "",
              image: image || "",
            };

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
          console.error("Failed to fetch user data:", error);
          $q.notify({
            type: "negative",
            message: "Failed to load profile data",
            position: "top",
          });
        })
        .finally(() => {
          loading.value = false;
        });
    };

    const updateProfile = (formData: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
    }) => {
      loading.value = true;

      api
        .patch("/account/profile", formData)
        .then(({ data }) => {
          if (data?.data) {
            const updatedData: AccountDataResponse = {
              ...authStore.accountInformation,
              firstName: formData.firstName,
              lastName: formData.lastName,
              email: formData.email,
              contactNumber: formData.phone,
            };

            userData.value = {
              ...userData.value,
              ...formData,
            };

            authStore.storeAccountInformation(updatedData);

            $q.notify({
              type: "positive",
              message: "Profile updated successfully",
              position: "top",
              timeout: 2000,
            });
          }
        })
        .catch((error) => {
          console.error("Failed to update profile:", error);
          $q.notify({
            type: "negative",
            message: "Failed to update profile",
            position: "top",
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

    const changePassword = (
      passwords: ChangePasswordData,
      callback: (success: boolean) => void
    ) => {
      loading.value = true;

      const endpoint = hasPassword.value
        ? "/account/change-user-password"
        : "/account/set-password";
      const payload = hasPassword.value
        ? {
            currentPassword: passwords.currentPassword,
            newPassword: passwords.newPassword,
            confirmPassword: passwords.confirmPassword,
          }
        : {
            password: passwords.newPassword,
          };

      api
        .post(endpoint, payload)
        .then(() => {
          $q.notify({
            type: "positive",
            message: hasPassword.value
              ? "Password changed successfully"
              : "Password set successfully",
            position: "top",
            timeout: 2000,
            actions: [{ icon: "close", color: "white" }],
          });
          if (!hasPassword.value) {
            hasPassword.value = true;
          }
          fetchAuthMethods();
          callback(true);
        })
        .catch((error) => {
          console.error("Failed to change password:", error);
          const errorMessage =
            error?.response?.data?.message || "Failed to change password";
          $q.notify({
            type: "negative",
            message: errorMessage,
            position: "top",
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
      formData.append("file", file);

      return new Promise<boolean>((resolve) => {
        api
          .post("/account/change-profile-picture", formData, {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          })
          .then(({ data }) => {
            const imageUrl = data?.image || data?.data?.image;
            if (imageUrl) {
              userData.value.image = imageUrl;

              const updatedData = {
                ...authStore.accountInformation,
                image: imageUrl,
              };
              authStore.storeAccountInformation(updatedData);

              $q.notify({
                type: "positive",
                message: "Profile picture updated successfully",
                position: "top",
                timeout: 2000,
                actions: [{ icon: "close", color: "white" }],
              });
              resolve(true);
            } else {
              resolve(false);
            }
          })
          .catch((error) => {
            console.error("Failed to upload profile picture:", error);
            $q.notify({
              type: "negative",
              message: "Failed to upload profile picture",
              position: "top",
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
        api
          .delete("/account/profile-picture")
          .then(() => {
            userData.value.image = "";

            if (authStore.accountInformation) {
              const updatedData = {
                ...authStore.accountInformation,
                image: "",
              };
              authStore.storeAccountInformation(updatedData);
            }

            $q.notify({
              type: "positive",
              message: "Profile picture removed",
              position: "top",
              timeout: 2000,
              actions: [{ icon: "close", color: "white" }],
            });
            resolve(true);
          })
          .catch((error) => {
            console.error("Failed to remove profile picture:", error);
            $q.notify({
              type: "negative",
              message: "Failed to remove profile picture",
              position: "top",
            });
            resolve(false);
          })
          .finally(() => {
            loading.value = false;
          });
      });
    };

    onMounted(() => {
      if (dialogVisible.value) {
        fetchAuthMethods();
      }
    });

    return {
      tab,
      loading,
      userData,
      hasPassword,
      fetchUserData,
      dialogVisible,
      isTabletOrMobile,
      cardClass,
      closeDialog,
      updateProfile,
      changePassword,
      uploadProfilePicture,
      removeProfilePicture,
    };
  },
});
</script>

<style lang="scss" scoped>
.manage-account-card {
  width: 90vw;
  max-width: 900px;
  max-height: 85vh;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
}

.fullscreen-card {
  width: 100vw;
  height: 100dvh;
  max-width: 100vw;
  max-height: 100vh;
  border-radius: 0;
  display: flex;
  flex-direction: column;
}

.dialog-header {
  background-color: #f8f9fa;
  padding: 16px 20px;
}

.tab-container {
  flex-shrink: 0;
}

.account-tabs {
  margin: 10px;
  padding: 2px;
  border: 1px solid var(--q-light);
  background-color: var(--q-extra-lighter);
  border-radius: 12px;

  :deep(.q-tab__indicator) {
    opacity: 0;
  }

  :deep(.q-tab) {
    min-width: 90px;
    padding: 8px 0;
    border-radius: 12px;

    .q-icon {
      font-size: 20px;
    }

    &.q-tab--active {
      background-color: var(--q-light);

      .q-icon {
        color: var(--q-dark);
      }
      .tab-label {
        font-weight: 500;
        color: var(--q-dark);
      }
    }

    &:not(.q-tab--active) {
      .q-icon {
        color: var(--q-gray-light);
      }
      .tab-label {
        color: var(--q-gray-light);
        font-weight: 400;
      }
    }
  }
}

.tab-content-section {
  flex: 1;
  overflow: auto;
  padding: 0;

  :deep(.q-tab-panel) {
    padding: 0;
  }
}

.account-tab-panels {
  background-color: transparent;
  height: 100%;
}

.account-tab-panel {
  background-color: #ffffff;
}
</style>
