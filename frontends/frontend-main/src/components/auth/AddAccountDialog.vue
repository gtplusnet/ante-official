<template>
  <q-dialog v-model="dialogVisible" persistent>
    <q-card class="add-account-card">
      <q-card-section class="dialog-header">
        <div class="row items-center">
          <q-avatar size="40px" color="primary" text-color="white">
            <q-icon name="person_add" size="24px" />
          </q-avatar>
          <div class="col q-ml-md">
            <div class="text-h6">Add another account</div>
            <div class="text-caption text-grey-7">Sign in to switch between accounts easily</div>
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
      </q-card-section>

      <q-separator />

      <q-card-section class="q-pt-lg">
        <!-- Use UnifiedLoginForm -->
        <UnifiedLoginForm
          mode="add-account"
          :show-oauth="true"
          :show-manual="true"
          :show-title="false"
          :show-cancel="true"
          :existing-accounts="multiAccountStore.allAccounts"
          @login-success="handleLoginSuccess"
          @cancel="closeDialog"
        />
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<style scoped>
.add-account-card {
  min-width: 420px;
  max-width: 480px;
  border-radius: 12px;
}

.dialog-header {
  background-color: #f8f9fa;
}

@media (max-width: 600px) {
  .add-account-card {
    min-width: 320px;
  }
}
</style>

<script lang="ts">
import { defineComponent, ref, computed } from 'vue';
import { useMultiAccountStore } from '../../stores/multiAccount';
import { useRouter } from 'vue-router';
import UnifiedLoginForm from './UnifiedLoginForm.vue';

export default defineComponent({
  name: 'AddAccountDialog',
  
  components: {
    UnifiedLoginForm
  },

  props: {
    modelValue: {
      type: Boolean,
      required: true
    }
  },

  emits: ['update:modelValue', 'account-added'],

  setup(props, { emit }) {
    const router = useRouter();
    const multiAccountStore = useMultiAccountStore();
    const loading = ref(false);

    const dialogVisible = computed({
      get: () => props.modelValue,
      set: (value) => emit('update:modelValue', value)
    });

    const handleLoginSuccess = (response: any) => {
      const { accountInformation } = response;
      
      // Check if this account is already logged in
      const existingAccount = multiAccountStore.allAccounts.find(
        acc => acc.accountInformation.id === accountInformation.id
      );
      
      if (existingAccount) {
        // Switch to existing account (already handled by UnifiedLoginForm)
        multiAccountStore.switchAccount(accountInformation.id);
      }
      
      // Close dialog
      dialogVisible.value = false;
      
      // Emit event
      emit('account-added', accountInformation);
      
      // Reload the page to apply the new account
      router.go(0);
    };

    const closeDialog = () => {
      dialogVisible.value = false;
    };

    return {
      multiAccountStore,
      dialogVisible,
      loading,
      handleLoginSuccess,
      closeDialog
    };
  }
});
</script>