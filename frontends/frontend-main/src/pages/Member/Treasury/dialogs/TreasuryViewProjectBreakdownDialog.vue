<template>
  <q-dialog ref="dialog">
    <q-card class="full-width dialog-card">
      <q-bar class="bg-primary text-white cursor-default" dark>
        <q-icon name="person" />
        <div>View Project Breakdown</div>

        <q-space />

        <q-btn dense flat icon="close" v-close-popup>
          <q-tooltip>Close</q-tooltip>
        </q-btn>
      </q-bar>

      <q-card-section>
        <g-table
          :is-row-action-enabled="true"
          tableKey="collectionByProject"
          :apiFilters="[
            { clientId: clientInformation.id }
          ]"
          apiUrl="/project"
          ref="table"
        >
          <template v-slot:row-actions="props">
            <q-btn
              rounded
              class="q-mr-sm"
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
            <span class="text-weight-medium"
              >{{ props.data.totalCollected.formatCurrency }} /
              {{ props.data.totalCollectionBalance.formatCurrency }}</span
            >
          </template>
        </g-table>
      </q-card-section>
    </q-card>

    <ViewSummaryCollectionByProjectDialog
      :projectInformation="projectInformation"
      v-model="openViewSummaryDialog"
    />
  </q-dialog>
</template>

<style scoped lang="scss">
.dialog-card {
  max-width: 800px;
}
</style>

<script>
import GTable from "../../../../components/shared/display/GTable.vue";
import ViewSummaryCollectionByProjectDialog from './TreasuryViewSummaryCollectionByProjectDialog.vue';
export default {
  name: 'ViewProjectBreakdownDialog',
  components: {
    GTable,
    ViewSummaryCollectionByProjectDialog,
  },
  props: {
    clientInformation: {
      type: Object,
      default: null,
    },
  },
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
