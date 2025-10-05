<template>
  <div>
    <div class="page-head">
      <div class="title text-title-large">User Invites</div>
      <div class="actions">
        <q-btn class="text-label-large" color="primary" @click="handleAdd" unelevated rounded>
          <q-icon name="send" class="q-mr-xs" size="14px"></q-icon>
          Invite User
        </q-btn>
      </div>
    </div>
    
    <div class="page-content q-mt-md">
      <SettingsPendingInvitesTable ref="pendingInvitesTableRef" @resendInvite="handleResendInvite" @cancelInvite="handleCancelInvite" />
      <SettingsUserCreateEditDialog
        v-model="openAddEditDialog"
        :id="selectedUserId"
        variant="invite"
        @close="handleCloseAddEdit"
      />
    </div>
  </div>
</template>

<style scoped></style>

<script lang="ts">
import { defineComponent, ref, defineAsyncComponent } from 'vue';
import { useQuasar } from 'quasar';
import { getCurrentInstance } from 'vue';
import SettingsPendingInvitesTable from './components/tables/SettingsPendingInvitesTable.vue';

// Lazy-loaded dialogs (ALL dialogs must be lazy loaded - CLAUDE.md)
const SettingsUserCreateEditDialog = defineAsyncComponent(() =>
  import('./dialogs/SettingsUserCreateEditDialog.vue')
);

export default defineComponent({
  name: 'SettingsUserInvite',
  components: {
    SettingsUserCreateEditDialog,
    SettingsPendingInvitesTable,
  },
  setup() {
    const $q = useQuasar();
    const instance = getCurrentInstance();
    const $api = instance?.proxy?.$api;

    const openAddEditDialog = ref(false);
    const selectedUserId = ref<string | null>(null);

    const handleAdd = () => {
      selectedUserId.value = null;
      openAddEditDialog.value = true;
    };

    const handleCloseAddEdit = () => {
      openAddEditDialog.value = false;
    };

    const handleResendInvite = async (invite: any) => {
      if (!$api) return;
      try {
        await $api.post('/auth/invite/resend', { inviteId: invite.id });
        $q.notify({
          type: 'positive',
          message: 'Invitation resent successfully',
        });
      } catch (error) {
        $q.notify({
          type: 'negative',
          message: 'Failed to resend invitation',
        });
      }
    };

    const handleCancelInvite = async (invite: any) => {
      if (!$api) return;
      $q.dialog({
        title: 'Cancel Invitation',
        message: `Are you sure you want to cancel the invitation for ${invite.email}?`,
        cancel: true,
        persistent: true,
      }).onOk(async () => {
        try {
          await $api.post('/auth/invite/cancel', { inviteId: invite.id });
          $q.notify({
            type: 'positive',
            message: 'Invitation cancelled successfully',
          });
        } catch (error) {
          $q.notify({
            type: 'negative',
            message: 'Failed to cancel invitation',
          });
        }
      });
    };

    return {
      openAddEditDialog,
      selectedUserId,
      handleAdd,
      handleCloseAddEdit,
      handleResendInvite,
      handleCancelInvite,
    };
  },
});
</script>