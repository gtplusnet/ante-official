<template>
  <div>
    <!-- Relationship Owner Selection -->
    <g-input
      ref="selectBox"
      v-model="selectedOwnerId"
      type="select-search-with-add"
      apiUrl="/select-box/relationship-owner-list"
      label="Relationship Owner"
      @showAddDialog="showAddDialog"
    ></g-input>

    <!-- Select Multiple Employee Dialog -->
    <manpower-select-multiple-employee-dialog
      v-model="isDialogOpen"
      :selectMultipleEmployee="selectMultipleEmployee"
      @add-selected-employees="handleSelectedEmployees"
    />
  </div>
</template>

<script>
import { defineAsyncComponent } from 'vue';
import GInput from '../shared/form/GInput.vue';

// Lazy-loaded dialogs (ALL dialogs must be lazy loaded - CLAUDE.md)
const ManpowerSelectMultipleEmployeeDialog = defineAsyncComponent(() =>
  import('../../pages/Member/Manpower/dialogs/configuration/ManpowerSelectMultipleEmployeeDialog.vue')
);

export default {
  name: 'SelectionRelationshipOwner',
  components: {
    GInput,
    ManpowerSelectMultipleEmployeeDialog,
  },
  props: {
    value: {
      type: [String, Number, Object],
      default: null,
    },
  },
  data: () => ({
    selectedOwnerId: null,
    isDialogOpen: false,
    selectMultipleEmployee: {
      url: '/lead/employee/select-list',
    },
  }),
  watch: {
    selectedOwnerId(newVal) {
      this.$emit('update:modelValue', newVal);
    },
    value: {
      immediate: true,
      handler(newVal) {
        this.selectedOwnerId = newVal;
      },
    },
  },
  methods: {
    showAddDialog() {
      this.isDialogOpen = true;
    },
    async handleSelectedEmployees(selectedEmployeeIds) {
      try {
        // Add relationship owners via API
        const response = await this.$api.post('/lead-relationship-owner/multiple', {
          accountIds: selectedEmployeeIds,
        });

        this.$q.notify({
          color: 'positive',
          message: `Successfully added ${response.data.count} relationship owner(s)`,
          icon: 'check_circle',
        });

        // Auto-select the first added owner
        // API returns: { count, data: [{ accountId, account: {...}, ... }] }
        const firstOwner = response.data.data?.[0];
        const firstOwnerId = firstOwner?.accountId || firstOwner?.id;

        // Reload the select box with auto-select
        if (this.$refs.selectBox && firstOwnerId) {
          await this.$refs.selectBox.reloadGSelect(firstOwnerId);
        } else if (this.$refs.selectBox) {
          // If no ID returned, just reload
          await this.$refs.selectBox.reloadGSelect();
        }

        // Close the dialog
        this.isDialogOpen = false;
      } catch (error) {
        console.error('Error adding relationship owners:', error);
        this.$q.notify({
          color: 'negative',
          message: 'Failed to add relationship owners',
          icon: 'error',
        });
      }
    },
  },
};
</script>
