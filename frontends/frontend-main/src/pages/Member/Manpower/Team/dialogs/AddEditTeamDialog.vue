<template>
  <q-dialog ref="dialog" @before-show="fetchData" @hide="resetForm" persistent>
    <TemplateDialog width="900px" min-width="900px">
      <template #DialogTitle>
        {{ teamData ? 'Edit' : 'Create' }} Team
      </template>
      <template #DialogContent>
        <section>
          <q-form @submit.prevent="saveTeam" class="col q-gutter-y-md">
            <div class="col-12">
              <g-input
                v-model="form.teamName"
                label="Team Name"
                type="text"
                required
                :rules="[(val: any) => !!val || 'Team name is required']"
              />
            </div>

            <!-- Employee Selection Section -->
            <div class="col-12">
              <div class="row items-center justify-between q-mb-sm">
                <div class="text-subtitle1 text-weight-medium">Team Members</div>
                <GButton
                  label="Add Employees"
                  icon="add"
                  color="primary"
                  variant="outline"
                  size="sm"
                  no-caps
                  @click="openEmployeeSelection"
                />
              </div>
              
              <!-- Team Members Table -->
              <div v-if="allEmployees.length > 0" class="q-mt-sm">
                <q-table
                  :rows="allEmployees"
                  :columns="memberColumns"
                  row-key="accountId"
                  flat
                  bordered
                  dense
                  :pagination="{ rowsPerPage: 5 }"
                  class="members-table"
                >
                  <template v-slot:body-cell-actions="props">
                    <q-td :props="props" class="text-center">
                      <q-btn
                        icon="delete"
                        flat
                        round
                        dense
                        size="sm"
                        color="negative"
                        @click="removeEmployee(props.row)"
                      />
                    </q-td>
                  </template>
                </q-table>
              </div>
              <div v-else class="text-grey-6 text-caption q-mt-sm">
                No employees selected
              </div>
            </div>

            <div class="full-width row justify-end q-gutter-sm q-mt-md">
              <GButton
                label="Cancel"
                type="button"
                color="primary"
                variant="outline"
                class="text-label-large"
                v-close-popup
              />
              <GButton
                :label="teamData ? 'Update' : 'Save'"
                type="submit"
                color="primary"
                class="text-label-large"
                :loading="loading"
              />
            </div>
          </q-form>
        </section>
      </template>
    </TemplateDialog>
  </q-dialog>

  <!-- Employee Selection Dialog -->
  <ManpowerSelectMultipleEmployeeDialog
    v-model="isEmployeeDialogOpen"
    :select-multiple-employee="{ url: '/hr/team/employee/available-for-teams' }"
    @add-selected-employees="onEmployeesSelected"
  />
</template>

<style scoped lang="scss">
.dialog-card {
  max-width: 500px;
}

.members-table {
  background: white;
  
  :deep(thead) {
    background-color: #f5f5f5;
  }
  
  :deep(th) {
    font-weight: 500;
    color: #666;
    font-size: 13px;
    padding: 8px 12px;
  }
  
  :deep(td) {
    font-size: 13px;
    padding: 8px 12px;
  }
  
  :deep(tbody tr) {
    border-bottom: 1px solid #e0e0e0;
  }
  
  :deep(tbody tr:last-child) {
    border-bottom: none;
  }
}
</style>

<script lang="ts">
import { defineComponent, ref, getCurrentInstance, watch, computed } from 'vue';
import { QDialog, useQuasar, QTableColumn } from 'quasar';
import TemplateDialog from 'src/components/dialog/TemplateDialog.vue';
import GButton from 'src/components/shared/buttons/GButton.vue';
import GInput from 'src/components/shared/form/GInput.vue';
import ManpowerSelectMultipleEmployeeDialog from '../../dialogs/configuration/ManpowerSelectMultipleEmployeeDialog.vue';

export default defineComponent({
  name: 'AddEditTeamDialog',
  components: {
    TemplateDialog,
    GButton,
    GInput,
    ManpowerSelectMultipleEmployeeDialog,
  },
  props: {
    teamData: {
      type: Object,
      default: null,
    },
  },
  emits: ['save-done', 'close'],
  setup(props, { emit }) {
    const $q = useQuasar();
    const dialog = ref<InstanceType<typeof QDialog> | null>(null);
    const isEmployeeDialogOpen = ref(false);
    const loading = ref(false);
    const instance = getCurrentInstance();
    const $api = instance?.proxy?.$api;
    
    const form = ref({
      teamName: '',
    });
    
    const selectedEmployees = ref<any[]>([]);
    const existingMembers = ref<any[]>([]);
    const removedMemberIds = ref<string[]>([]);

    const fetchData = async () => {
      if (props.teamData) {
        form.value.teamName = props.teamData.name || '';
        // Fetch team details with members
        if ($api) {
          try {
            const response = await $api.get(`/hr/team/${props.teamData.id}`);
            existingMembers.value = response.data.members || [];
            removedMemberIds.value = [];
          } catch (error) {
            console.error('Failed to fetch team details:', error);
            existingMembers.value = [];
          }
        }
      } else {
        form.value.teamName = '';
        selectedEmployees.value = [];
        existingMembers.value = [];
        removedMemberIds.value = [];
      }
    };
    
    // Computed property to combine existing and newly selected employees
    const allEmployees = computed(() => {
      const existingNotRemoved = existingMembers.value.filter(
        member => !removedMemberIds.value.includes(member.accountId)
      );
      return [...existingNotRemoved, ...selectedEmployees.value];
    });
    
    // Watch for changes to teamData prop
    watch(() => props.teamData, async (newTeamData) => {
      if (newTeamData) {
        form.value.teamName = newTeamData.name || '';
        // Fetch team details with members
        if ($api) {
          try {
            const response = await $api.get(`/hr/team/${newTeamData.id}`);
            existingMembers.value = response.data.members || [];
            removedMemberIds.value = [];
            selectedEmployees.value = [];
          } catch (error) {
            console.error('Failed to fetch team details:', error);
            existingMembers.value = [];
          }
        }
      } else {
        form.value.teamName = '';
        selectedEmployees.value = [];
        existingMembers.value = [];
        removedMemberIds.value = [];
      }
    });
    
    const openEmployeeSelection = () => {
      isEmployeeDialogOpen.value = true;
    };
    
    const onEmployeesSelected = async (employeeIds: string[]) => {
      // Fetch employee details for the selected IDs
      if (!$api || employeeIds.length === 0) return;
      
      loading.value = true;
      try {
        const employeePromises = employeeIds.map(id => 
          $api.get(`/hris/employee/info?accountId=${id}`)
        );
        
        const responses = await Promise.all(employeePromises);
        const employees = responses.map(res => res.data);
        
        // Transform employee data to match the expected format
        const transformedEmployees = employees.map(emp => ({
          accountId: emp.accountDetails.id,
          name: emp.accountDetails.fullName,
          position: emp.accountDetails?.role?.name || 'N/A',
          department: emp.accountDetails?.role?.roleGroup?.name || 'N/A',
        }));
        
        // Filter out employees that are already members or already selected
        const existingIds = [...existingMembers.value.map(m => m.accountId), ...selectedEmployees.value.map(e => e.accountId)];
        const newEmployees = transformedEmployees.filter(e => !existingIds.includes(e.accountId));
        selectedEmployees.value = [...selectedEmployees.value, ...newEmployees];
      } catch (error) {
        console.error('Failed to fetch employee details:', error);
        $q.notify({
          type: 'negative',
          message: 'Failed to fetch employee details',
        });
      } finally {
        loading.value = false;
        // Close the employee selection dialog
        isEmployeeDialogOpen.value = false;
      }
    };
    
    const removeEmployee = (employee: any) => {
      // Check if it's an existing member
      const isExisting = existingMembers.value.some(m => m.accountId === employee.accountId);
      
      if (isExisting) {
        // Add to removed list
        removedMemberIds.value.push(employee.accountId);
      } else {
        // Remove from selected list
        selectedEmployees.value = selectedEmployees.value.filter(
          e => e.accountId !== employee.accountId
        );
      }
    };

    const saveTeam = async () => {
      loading.value = true;
      
      try {
        const endpoint = props.teamData 
          ? '/hr/team/update' 
          : '/hr/team/create';
        
        const payload = props.teamData
          ? { id: props.teamData.id, name: form.value.teamName }
          : { 
              name: form.value.teamName,
              memberIds: selectedEmployees.value.map(e => e.accountId)
            };
        
        if (!$api) {
          throw new Error('API not available');
        }
        const response = await $api[props.teamData ? 'put' : 'post'](endpoint, payload);
        
        // Handle member updates for existing teams
        if (props.teamData) {
          // Add new members
          if (selectedEmployees.value.length > 0 && $api) {
            await $api.post('/hr/team/members/add', {
              teamId: props.teamData.id,
              accountIds: selectedEmployees.value.map(e => e.accountId),
            });
          }
          
          // Remove members
          if ($api) {
            for (const accountId of removedMemberIds.value) {
              await $api.delete(`/hr/team/members/${props.teamData.id}/${accountId}`);
            }
          }
        }
        
        $q.notify({
          type: 'positive',
          message: props.teamData ? 'Team updated successfully' : 'Team created successfully',
        });
        
        emit('save-done', response.data);
        dialog.value?.hide();
      } catch (error: any) {
        $q.notify({
          type: 'negative',
          message: error.response?.data?.message || 'Failed to save team',
        });
      } finally {
        loading.value = false;
      }
    };

    const show = () => {
      dialog.value?.show();
    };

    const hide = () => {
      dialog.value?.hide();
    };

    const resetForm = () => {
      form.value.teamName = '';
      selectedEmployees.value = [];
      existingMembers.value = [];
      removedMemberIds.value = [];
    };

    const memberColumns: QTableColumn[] = [
      {
        name: 'name',
        label: 'Name',
        field: 'name',
        align: 'left' as const,
      },
      {
        name: 'position',
        label: 'Position',
        field: 'position',
        align: 'left' as const,
      },
      {
        name: 'department',
        label: 'Department',
        field: 'department',
        align: 'left' as const,
      },
      {
        name: 'actions',
        label: '',
        field: 'actions',
        align: 'center' as const,
      },
    ];

    return {
      dialog,
      isEmployeeDialogOpen,
      form,
      loading,
      selectedEmployees,
      existingMembers,
      removedMemberIds,
      allEmployees,
      memberColumns,
      fetchData,
      saveTeam,
      openEmployeeSelection,
      onEmployeesSelected,
      removeEmployee,
      show,
      hide,
      resetForm,
    };
  },
});
</script>