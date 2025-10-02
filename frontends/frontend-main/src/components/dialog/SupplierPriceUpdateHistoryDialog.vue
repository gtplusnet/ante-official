<template>
  <q-dialog @before-show="fetchData">
    <q-card class="full-width dialog-card">
      <q-bar class="bg-primary text-white cursor-default" dark>
        <q-icon name="o_task" />
        <div>Supplier Price Update History</div>

        <q-space />

        <q-btn dense flat icon="close" v-close-popup>
          <q-tooltip>Close</q-tooltip>
        </q-btn>
      </q-bar>

      <q-card-section>
        <g-table
          tableKey="supplierPriceUpdate"
          apiUrl="/supplier/price-update-table"
          :apiFilters="[{ itemId, supplierId }]"
          ref="table"
        >
          <!-- slot name -->
          <template v-slot:name="props">
            <span class="clickable-code">{{ props.data.updateBy.email }}</span>
          </template>
        </g-table>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<style scoped lang="scss">
.dialog-card {
  max-width: 800px;
  min-height: 450px;
}
</style>

<script>
import GTable from "../../components/shared/display/GTable.vue";

export default {
  name: 'SupplierPriceUpdateHistoryDialog',
  components: {
    GTable,
  },
  props: {
    itemId: {
      type: String,
      required: true,
    },
    supplierId: {
      type: Number,
      required: true,
    },
  },
  data: () => ({}),
  watch: {},
  methods: {
    fetchData() {
      if (this.$refs.table) {
        this.$refs.table.refetch();
      }
    },
  },
};
</script>
