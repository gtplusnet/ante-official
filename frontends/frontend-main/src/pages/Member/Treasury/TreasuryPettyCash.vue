<template>
  <expanded-nav-page-container>
    <treasury-header></treasury-header>

    <div class="page-content">
      <div class="page-content-actions row justify-end">
        <q-btn
          label="Assign Petty Cash"
          color="primary"
          icon="add"
          unelevated
          @click="isAssignmentDialogOpen = true"
        />
      </div>

      <g-card class="q-pa-md q-mt-sm">
        <PettyCashHoldersTable
          ref="holdersTable"
        />
      </g-card>
    </div>

    <!-- Dialogs -->
    <petty-cash-assignment-dialog
      v-model="isAssignmentDialogOpen"
      @saveDone="handleAssignmentDone"
    />
  </expanded-nav-page-container>
</template>

<script>
import TreasuryHeader from './TreasuryHeader.vue';
import GCard from "../../../components/shared/display/GCard.vue";
import ExpandedNavPageContainer from '../../../components/shared/ExpandedNavPageContainer.vue';
import PettyCashHoldersTable from "./components/tables/TreasuryPettyCashHoldersTable.vue";
import PettyCashAssignmentDialog from "./dialogs/PettyCashAssignmentDialog.vue";

export default {
  name: 'TreasuryPettyCash',
  components: {
    ExpandedNavPageContainer,
    TreasuryHeader,
    GCard,
    PettyCashHoldersTable,
    PettyCashAssignmentDialog
  },
  data: () => ({
    isAssignmentDialogOpen: false,
  }),
  methods: {
    handleAssignmentDone() {
      // Use nextTick to ensure DOM is updated before accessing refs
      this.$nextTick(() => {
        if (this.$refs.holdersTable && typeof this.$refs.holdersTable.refetch === 'function') {
          this.$refs.holdersTable.refetch();
        }
      });
    }
  },
};
</script>
