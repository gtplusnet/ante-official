<template>
  <g-table
    :is-row-action-enabled="true"
    :apiFilters="[{ isForReview: true }]"
    tableKey="forReviewsTable"
    apiUrl="/collection/table"
    ref="table"
  >
    <template v-slot:row-actions="props">
      <q-btn
        rounded
        class="q-mr-sm text-label-medium"
        @click="startCollection(props.data)"
        no-caps
        color="primary"
        outline
      >
        <q-icon class="q-mr-sm" size="20px" name="money"></q-icon>
        Start Collection
      </q-btn>
    </template>
  </g-table>
  <!-- Star Collection Dialog -->
  <ForReviewStartCollectionDialog
    :collectionData="collectionData"
    v-model="openStartCollection"
    @saveDone="this.$refs.table.refetch()"
  />
</template>

<script>
import ForReviewStartCollectionDialog from '../dialog/ForReviewStartCollectionDialog.vue';
import GTable from "../../components/shared/display/GTable.vue";

export default {
  name: 'ForReviewsTable',
  components: {
    GTable,
    ForReviewStartCollectionDialog,
  },
  data: () => ({
    openStartCollection: false,
    collectionData: null,
  }),
  methods: {
    startCollection(data) {
      this.collectionData = data;
      this.openStartCollection = true;
    },
  },
};
</script>
