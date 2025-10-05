<template>
  <ManpowerSelectMultipleEmployeeDialog
    ref="dialog"
    v-model="isDialogOpen"
    @add-selected-employees="onEmployeesSelected"
    :selectMultipleEmployee="employeeSelectionConfig"
  />
</template>

<script lang="ts">
import { defineComponent, defineAsyncComponent, ref, computed } from 'vue';
import { useQuasar } from 'quasar';

// Lazy-loaded dialogs (ALL dialogs must be lazy loaded - CLAUDE.md)
const ManpowerSelectMultipleEmployeeDialog = defineAsyncComponent(() =>
  import('../../dialogs/configuration/ManpowerSelectMultipleEmployeeDialog.vue')
);

export default defineComponent({
  name: 'AddTeamMemberDialog',
  components: {
    ManpowerSelectMultipleEmployeeDialog,
  },
  props: {
    teamData: {
      type: Object,
      default: null,
    },
    existingMembers: {
      type: Array,
      default: () => [],
    },
  },
  emits: ['members-added', 'close'],
  setup(props, { emit }) {
    const $q = useQuasar();
    const dialog = ref<InstanceType<typeof ManpowerSelectMultipleEmployeeDialog> | null>(null);
    const isDialogOpen = ref(false);

    // Build URL with excluded employee IDs
    const employeeSelectionConfig = computed(() => {
      // Get existing member account IDs to exclude
      const excludedIds = props.existingMembers
        .map((member: any) => member.accountId || member.id)
        .filter(Boolean)
        .join(',');

      // Use existing payroll-approvers endpoint that supports employee selection with exclusions
      const baseUrl = 'hr-configuration/payroll-approvers/employee-select';
      const url = excludedIds 
        ? `${baseUrl}?excludeAccountIds=${excludedIds}`
        : baseUrl;

      return {
        url: url,
        name: `Add Members to ${props.teamData?.name || 'Team'}`,
      };
    });

    const onEmployeesSelected = (selectedEmployees: any[]) => {
      // Transform the selected employees to match our team member format
      const newMembers = selectedEmployees.map(emp => ({
        id: emp.accountId || emp.id,
        accountId: emp.accountId || emp.id,
        name: emp.accountDetails?.fullName || `${emp.accountDetails?.firstName} ${emp.accountDetails?.lastName}`,
        position: emp.accountDetails?.role?.name || emp.position || '-',
        department: emp.accountDetails?.role?.roleGroup?.name || emp.department || '-',
        role: 'MEMBER',
      }));

      $q.notify({
        type: 'positive',
        message: `${newMembers.length} member(s) added successfully`,
      });

      emit('members-added', newMembers);
      isDialogOpen.value = false;
    };

    const show = () => {
      isDialogOpen.value = true;
    };

    const hide = () => {
      isDialogOpen.value = false;
    };

    return {
      dialog,
      isDialogOpen,
      employeeSelectionConfig,
      onEmployeesSelected,
      show,
      hide,
    };
  },
});
</script>