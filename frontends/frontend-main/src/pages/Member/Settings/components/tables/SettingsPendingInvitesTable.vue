<template>
  <div>
    <g-table 
      :isRowActionEnabled="true" 
      tableKey="accountInvite" 
      apiUrl="/account/pending-invites" 
      ref="table"
    >
      <template v-slot:status="props">
        <q-chip 
          :color="props.data.status === 'Expired' ? 'negative' : 'warning'" 
          text-color="white" 
          size="sm"
          dense
        >
          {{ props.data.status }}
        </q-chip>
      </template>

      <template v-slot:row-actions="props">
        <q-btn color="grey-7" round flat icon="more_horiz" @click.stop>
          <q-menu auto-close>
            <q-list style="min-width: 180px">
              <q-item 
                clickable 
                @click="resendInvite(props.data)"
                :disable="props.data.isExpired"
              >
                <q-item-section avatar>
                  <q-icon name="send" color="grey-7" />
                </q-item-section>
                <q-item-section>
                  <q-item-label class="text-label-medium">Resend Invite</q-item-label>
                </q-item-section>
              </q-item>
              
              <q-separator />
              
              <q-item clickable @click="cancelInvite(props.data)">
                <q-item-section avatar>
                  <q-icon name="cancel" color="negative" />
                </q-item-section>
                <q-item-section>
                  <q-item-label class="text-label-medium">Cancel Invite</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
      </template>
    </g-table>

    <!-- Create/Edit User Dialog with invite flow -->
    <user-create-edit-dialog 
      :userId="userId" 
      @saveDone="saveDone" 
      v-model="isFormDialogOpen" 
      :variant="'invite'"
      @close="closeInviteDialog" 
    />
  </div>
</template>

<script>
import GTable from "../../../../../components/shared/display/GTable.vue";
import UserCreateEditDialog from "../../../../../pages/Member/Settings/dialogs/SettingsUserCreateEditDialog.vue";

export default {
  name: 'PendingInvitesTable',
  components: {
    GTable,
    UserCreateEditDialog,
  },
  data: () => ({
    userId: null,
    isFormDialogOpen: false,
  }),
  methods: {
    openInviteDialog() {
      this.userId = null;
      this.isFormDialogOpen = true;
    },
    closeInviteDialog() {
      this.isFormDialogOpen = false;
      this.$refs.table.refetch();
    },
    saveDone() {
      this.closeInviteDialog();
    },
    async resendInvite(invite) {
      this.$q.dialog({
        title: 'Resend Invitation',
        message: `Are you sure you want to resend the invitation to ${invite.email}?`,
        ok: true,
        cancel: true,
      }).onOk(async () => {
        this.$q.loading.show();
        try {
          await this.$api.post('/auth/invite/resend', { inviteId: invite.id });
          this.$q.notify({
            type: 'positive',
            message: 'Invitation resent successfully',
          });
          this.$refs.table.refetch();
        } catch (error) {
          this.handleAxiosError(error);
        } finally {
          this.$q.loading.hide();
        }
      });
    },
    async cancelInvite(invite) {
      this.$q.dialog({
        title: 'Cancel Invitation',
        message: `Are you sure you want to cancel the invitation to ${invite.email}? This action cannot be undone.`,
        ok: {
          label: 'Cancel Invite',
          color: 'negative',
        },
        cancel: true,
      }).onOk(async () => {
        this.$q.loading.show();
        try {
          await this.$api.delete(`/auth/invite/${invite.id}`);
          this.$q.notify({
            type: 'positive',
            message: 'Invitation cancelled successfully',
          });
          this.$refs.table.refetch();
        } catch (error) {
          this.handleAxiosError(error);
        } finally {
          this.$q.loading.hide();
        }
      });
    },
  },
};
</script>