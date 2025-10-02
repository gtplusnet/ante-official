<template>
  <q-dialog ref="dialog">
    <q-card class="full-width dialog-card">
      <q-bar class="bg-primary text-white cursor-default" dark>
        <q-icon name="person" />
        <div class="text-title-medium">View Summary</div>

        <q-space />

        <q-btn dense flat icon="close" v-close-popup>
          <q-tooltip class="text-label-small">Close</q-tooltip>
        </q-btn>
      </q-bar>

      <q-card-section>
        <g-table
          :is-row-action-enabled="true"
          tableKey="viewSummaryCollectionProject"
          apiUrl="/collection/table"
          :apiFilters="[
            { projectId: projectInformation ? projectInformation.id : null },
          ]"
          ref="table"
        >
          <template v-slot:row-actions="props">
            <q-btn
              rounded
              class="q-mr-sm text-label-large"
              @click="viewDetails(props.data)"
              no-caps
              color="primary"
              outline
            >
              <q-icon class="q-mr-sm" size="20px" name="details"></q-icon>
              Details
            </q-btn>
          </template>
        </g-table>
      </q-card-section>
    </q-card>
    <!-- View Details Collection Project Dialog -->
    <ViewDetailsCollectionByProjectDialog
      :collectionData="collectionData"
      v-if="collectionData"
      v-model="openViewDetailCollectionProject"
      @close="openViewDetailCollectionProject = false"
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
import ViewDetailsCollectionByProjectDialog from './TreasuryViewDetailsCollectionByProjectDialog.vue';
export default {
  name: 'ViewSummaryDialog',
  components: {
    GTable,
    ViewDetailsCollectionByProjectDialog,
  },
  props: {
    projectInformation: {
      type: Object,
      default: () => null,
    },
  },
  data: () => ({
    openViewDetailsDialog: false,
    openViewDetailCollectionProject: false,
    collectionData: null,
  }),
  watch: {},
  methods: {
    viewDetails(data) {
      this.collectionData = data;
      this.openViewDetailCollectionProject = true;
    },
  },
};
</script>
