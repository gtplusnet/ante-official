<template>
  <g-table
    :is-row-action-enabled="true"
    tableKey="collectionByProject"
    apiUrl="/project"
    ref="table"
  >
    <template v-slot:row-actions="props">
      <q-btn
        rounded
        class="q-mr-sm text-label-medium"
        @click="viewSummary(props.data)"
        no-caps
        color="primary"
        outline
      >
        <q-icon class="q-mr-sm" size="20px" name="summarize"></q-icon>
        View Summary
      </q-btn>
    </template>

    <template v-slot:totalCollectionBalance="props">
      <span class="text-weight-medium text-body-small"
        >{{ props.data.totalCollected.formatCurrency }} /
        {{ props.data.totalCollectionBalance.formatCurrency }}</span
      >
    </template>
  </g-table>

  <!-- View Summary Dialog -->
  <ViewSummaryDialog
    :projectInformation="projectInformation"
    v-model="openViewSummaryDialog"
  />
</template>

<script>
import { defineAsyncComponent } from 'vue';
import GTable from "../../../../../components/shared/display/GTable.vue";

// Lazy-loaded dialogs (ALL dialogs must be lazy loaded - CLAUDE.md)
const ViewSummaryDialog = defineAsyncComponent(() =>
  import("../../dialogs/TreasuryViewSummaryCollectionByProjectDialog.vue")
);

export default {
  name: 'CollectionProjectTable',
  components: {
    GTable,
    ViewSummaryDialog,
  },
  props: {},
  data: () => ({
    openViewSummaryDialog: false,
    projectInformation: null,
  }),
  methods: {
    viewSummary(data) {
      this.projectInformation = data;
      this.openViewSummaryDialog = true;
    },
  },
};
</script>
