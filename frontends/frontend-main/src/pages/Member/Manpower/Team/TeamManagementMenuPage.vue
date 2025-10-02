<template>
  <expanded-nav-page-container>
    <div class="page-head q-pb-md">
      <div class="row items-center justify-between full-width">
        <div>
          <div class="text-title-large">Teams</div>
          <div>
            <q-breadcrumbs class="text-body-small">
              <q-breadcrumbs-el label="Manpower" :to="{ name: 'member_manpower' }" />
              <q-breadcrumbs-el label="Team Management" />
            </q-breadcrumbs>
          </div>
        </div>
        <div>
          <q-btn
            label="Add Team"
            color="primary"
            unelevated
            no-caps
            class="q-px-md"
            @click="onAddTeam"
          />
        </div>
      </div>
    </div>
    
    <div class="q-pa-md">
      <q-table
        :rows="teams"
        :columns="columns"
        row-key="id"
        flat
        bordered
        :pagination="pagination"
        hide-bottom
        class="team-table"
        :loading="loading"
      >
        <template v-slot:body-cell-actions="props">
          <q-td :props="props" class="text-center">
            <q-btn
              icon="more_vert"
              flat
              round
              dense
              color="grey-8"
            >
              <q-menu auto-close>
                <q-list style="min-width: 150px">
                  <q-item clickable @click="onEdit(props.row)">
                    <q-item-section>Edit Team & Members</q-item-section>
                  </q-item>
                  <q-item clickable @click="onAddSchedule(props.row)">
                    <q-item-section>Add Schedule</q-item-section>
                  </q-item>
                  <q-separator />
                  <q-item clickable @click="onRemove(props.row)">
                    <q-item-section>Remove</q-item-section>
                  </q-item>
                </q-list>
              </q-menu>
            </q-btn>
          </q-td>
        </template>
      </q-table>
    </div>
  </expanded-nav-page-container>

  <!-- Dialogs -->
  <AddEditTeamDialog
    ref="addEditTeamDialog"
    :team-data="selectedTeam || undefined"
    @save-done="onTeamSaved"
  />
  
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, getCurrentInstance } from 'vue';
import { useQuasar, QTableColumn } from 'quasar';
import ExpandedNavPageContainer from '../../../../components/shared/ExpandedNavPageContainer.vue';
import AddEditTeamDialog from './dialogs/AddEditTeamDialog.vue';

export default defineComponent({
  name: 'TeamManagementMenuPage',
  components: {
    ExpandedNavPageContainer,
    AddEditTeamDialog,
  },
  setup() {
    const $q = useQuasar();
    const instance = getCurrentInstance();
    const $api = instance?.proxy?.$api;
    const addEditTeamDialog = ref<InstanceType<typeof AddEditTeamDialog> | null>(null);
    const selectedTeam = ref<any>(null);
    const loading = ref(false);
    
    const teams = ref<any[]>([]);

    const columns: QTableColumn[] = [
      {
        name: 'name',
        label: 'Team Name',
        field: 'name',
        align: 'left' as const,
        sortable: true,
      },
      {
        name: 'members',
        label: 'Members',
        field: (row: any) => `${row.memberCount || 0} Members`,
        align: 'center' as const,
        sortable: true,
      },
      {
        name: 'actions',
        label: 'Actions',
        field: 'actions',
        align: 'center' as const,
      },
    ];

    const pagination = ref({
      rowsPerPage: 10,
    });

    const fetchTeams = async () => {
      if (!$api) return;
      loading.value = true;
      try {
        const response = await $api.get('/hr/team/all');
        teams.value = response.data;
      } catch (error: any) {
        $q.notify({
          type: 'negative',
          message: error.response?.data?.message || 'Failed to fetch teams',
        });
      } finally {
        loading.value = false;
      }
    };

    onMounted(async () => {
      await fetchTeams();
    });

    const onAddTeam = () => {
      selectedTeam.value = null;
      addEditTeamDialog.value?.show();
    };

    const onAddSchedule = (team: any) => {
      $q.notify({
        type: 'info',
        message: `Add Schedule feature for ${team.name} coming soon`,
      });
    };

    const onEdit = (team: any) => {
      selectedTeam.value = team;
      addEditTeamDialog.value?.show();
    };

    const onRemove = (team: any) => {
      $q.dialog({
        title: 'Confirm',
        message: `Are you sure you want to remove ${team.name}?`,
        cancel: true,
        persistent: true,
      }).onOk(async () => {
        if (!$api) return;
        try {
          await $api.delete(`/hr/team/delete/${team.id}`);
          teams.value = teams.value.filter(t => t.id !== team.id);
          $q.notify({
            type: 'positive',
            message: 'Team removed successfully',
          });
        } catch (error: any) {
          $q.notify({
            type: 'negative',
            message: error.response?.data?.message || 'Failed to delete team',
          });
        }
      });
    };

    const onTeamSaved = async () => {
      // Refresh the teams list to get the latest data
      await fetchTeams();
    };

    return {
      teams,
      columns,
      pagination,
      loading,
      addEditTeamDialog,
      selectedTeam,
      onAddTeam,
      onAddSchedule,
      onEdit,
      onRemove,
      onTeamSaved,
      fetchTeams,
    };
  },
});
</script>

<style scoped>
.team-table {
  background: white;
  box-shadow: none;
}

.team-table :deep(.q-table__top) {
  display: none;
}

.team-table :deep(thead) {
  background-color: #f5f5f5;
}

.team-table :deep(th) {
  font-weight: 500;
  color: #666;
  font-size: 14px;
  padding: 12px 16px;
}

.team-table :deep(td) {
  padding: 16px;
  font-size: 14px;
}

.team-table :deep(tbody tr) {
  border-bottom: 1px solid #e0e0e0;
}

.team-table :deep(tbody tr:last-child) {
  border-bottom: none;
}
</style>