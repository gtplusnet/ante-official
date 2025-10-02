<template>
  <q-dialog ref="dialog" @before-show="fetchData" full-width>
    <TemplateDialog width="800px" full-width>
      <template #DialogTitle>
        Team Members - {{ teamData?.name }}
      </template>
      <template #DialogContent>
        <section>
          <div class="row items-center justify-between q-mb-md">
            <div class="col-4">
              <g-input
                v-model="searchText"
                label="Search members"
                type="text"
                clearable
                @update:model-value="filterMembers"
              >
                <template v-slot:prepend>
                  <q-icon name="search" />
                </template>
              </g-input>
            </div>
            <div>
              <GButton
                label="Add Member"
                color="primary"
                unelevated
                no-caps
                icon="add"
                @click="openAddMemberDialog"
              />
            </div>
          </div>

          <q-table
            :rows="filteredMembers"
            :columns="columns"
            row-key="id"
            flat
            bordered
            :pagination="pagination"
            class="members-table"
          >
            <template v-slot:body-cell-actions="props">
              <q-td :props="props" class="text-center">
                <GButton
                  icon="delete"
                  variant="icon"
                  color="negative"
                  tooltip="Remove member"
                  @click="removeMember(props.row)"
                />
              </q-td>
            </template>

            <template v-slot:no-data>
              <div class="full-width row flex-center text-grey q-gutter-sm q-pa-lg">
                <q-icon size="2em" name="group_off" />
                <span>No members in this team yet</span>
              </div>
            </template>
          </q-table>

          <div class="full-width row justify-end q-mt-md">
            <GButton
              label="Close"
              color="primary"
              variant="outline"
              class="text-label-large"
              v-close-popup
            />
          </div>
        </section>
      </template>
    </TemplateDialog>
  </q-dialog>

  <AddTeamMemberDialog
    ref="addMemberDialog"
    :team-data="teamData"
    :existing-members="members"
    @members-added="onMembersAdded"
  />
</template>

<style scoped lang="scss">
.members-table {
  background: white;
  
  :deep(thead) {
    background-color: #f5f5f5;
  }
  
  :deep(th) {
    font-weight: 500;
    color: #666;
    font-size: 14px;
  }
}
</style>

<script lang="ts">
import { defineComponent, ref, computed } from 'vue';
import { QDialog, useQuasar, QTableColumn } from 'quasar';
import TemplateDialog from 'src/components/dialog/TemplateDialog.vue';
import GButton from 'src/components/shared/buttons/GButton.vue';
import GInput from 'src/components/shared/form/GInput.vue';
import AddTeamMemberDialog from './AddTeamMemberDialog.vue';

interface TeamMember {
  id: string;
  name: string;
  position: string;
  department: string;
}

export default defineComponent({
  name: 'TeamMembersDialog',
  components: {
    TemplateDialog,
    GButton,
    GInput,
    AddTeamMemberDialog,
  },
  props: {
    teamData: {
      type: Object,
      default: null,
    },
  },
  emits: ['members-updated', 'close'],
  setup(props, { emit }) {
    const $q = useQuasar();
    const dialog = ref<InstanceType<typeof QDialog> | null>(null);
    const addMemberDialog = ref<InstanceType<typeof AddTeamMemberDialog> | null>(null);
    const searchText = ref('');
    const members = ref<TeamMember[]>([]);

    const columns: QTableColumn[] = [
      {
        name: 'name',
        label: 'Name',
        field: 'name',
        align: 'left' as const,
        sortable: true,
      },
      {
        name: 'position',
        label: 'Position',
        field: 'position',
        align: 'left' as const,
        sortable: true,
      },
      {
        name: 'department',
        label: 'Department',
        field: 'department',
        align: 'left' as const,
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

    const filteredMembers = computed(() => {
      if (!searchText.value) return members.value;
      
      const search = searchText.value.toLowerCase();
      return members.value.filter(member => 
        member.name.toLowerCase().includes(search) ||
        member.position.toLowerCase().includes(search) ||
        member.department.toLowerCase().includes(search)
      );
    });

    const fetchData = () => {
      // Simulate fetching team members
      if (props.teamData) {
        members.value = [
          { id: '1', name: 'John Doe', position: 'Developer', department: 'IT' },
          { id: '2', name: 'Jane Smith', position: 'Designer', department: 'Creative' },
          { id: '3', name: 'Bob Johnson', position: 'Manager', department: 'Operations' },
        ];
      }
    };

    const filterMembers = () => {
      // Filtering is handled by computed property
    };

    const openAddMemberDialog = () => {
      addMemberDialog.value?.show();
    };

    const removeMember = (member: TeamMember) => {
      $q.dialog({
        title: 'Confirm',
        message: `Are you sure you want to remove ${member.name} from the team?`,
        cancel: true,
        persistent: true,
      }).onOk(() => {
        members.value = members.value.filter(m => m.id !== member.id);
        $q.notify({
          type: 'positive',
          message: 'Member removed successfully',
        });
        emit('members-updated', members.value);
      });
    };

    const onMembersAdded = (newMembers: any[]) => {
      // Convert to TeamMember format if needed
      const formattedMembers = newMembers.map(member => ({
        id: member.accountId || member.id,
        name: member.name,
        position: member.position,
        department: member.department,
      }));
      
      members.value = [...members.value, ...formattedMembers];
      emit('members-updated', members.value);
    };

    const show = () => {
      dialog.value?.show();
    };

    const hide = () => {
      dialog.value?.hide();
    };

    return {
      dialog,
      addMemberDialog,
      searchText,
      members,
      columns,
      pagination,
      filteredMembers,
      fetchData,
      filterMembers,
      openAddMemberDialog,
      removeMember,
      onMembersAdded,
      show,
      hide,
    };
  },
});
</script>