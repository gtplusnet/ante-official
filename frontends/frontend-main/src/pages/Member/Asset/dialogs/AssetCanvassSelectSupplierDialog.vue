<template>
  <q-dialog ref="dialog" @before-show="fetchData">
    <q-card class="full-width dialog-card">
      <q-bar class="bg-primary text-white cursor-default" dark>
        <q-icon name="people" />
        <div>Select Supplier</div>

        <q-space />

        <q-btn dense flat icon="close" v-close-popup>
          <q-tooltip>Close</q-tooltip>
        </q-btn>
      </q-bar>

      <q-card-section>
        <div class="row justify-between">
          <div class="right full-width">
            <div class="row justify-end q-mb-md">
              <q-btn
                no-caps
                color="primary"
                rounded
                unelevated
                @click="openAddEditSupplierDialog"
                ><q-icon name="add"></q-icon>Add Supplier
              </q-btn>
            </div>
            <g-table
              :is-row-action-enabled="true"
              tableKey="supplier"
              apiUrl="/supplier"
              :apiFilters="[{ type: ['PURCHASE_ORDER'] }]"
              ref="table"
            >
              <!-- slot name -->
              <template v-slot:name="props">
                <span
                  @click="openSupplierInformation(props.data)"
                  class="clickable-code"
                  >{{ props.data.name }}</span
                >
              </template>
              <!-- slot actions -->
              <template v-slot:row-actions="props">
                <q-btn
                  rounded
                  class="q-mr-sm"
                  @click="selectSupplier(props.data)"
                  no-caps
                  color="primary"
                  outline
                >
                  <q-icon name="check" size="16px" class="q-mr-xs"></q-icon>
                  Select
                </q-btn>
              </template>
            </g-table>
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- supplier information dialog -->
    <supplier-information-dialog
      v-if="isSupplierInformationDialogVisible"
      v-model="isSupplierInformationDialogVisible"
      :supplierId="supplierId"
    />

    <!-- Add Supplier dialog -->
    <AddEditSupplierDialog
      @saveDone="$refs.table.refetch()"
      :supplierId="supplierId"
      v-model="isAddEditSupplierDialogOpen"
    />
  </q-dialog>
</template>

<style scoped lang="scss">
.dialog-card {
  max-width: 1000px;
  width: 1000px;
  min-height: 700px;
}
</style>

<script>
import { defineAsyncComponent } from 'vue';
import GTable from "../../../../components/shared/display/GTable.vue";

// Lazy-loaded dialogs (ALL dialogs must be lazy loaded - CLAUDE.md)
const SupplierInformationDialog = defineAsyncComponent(() =>
  import('./AssetSupplierInformationDialog/SupplierInformationDialog.vue')
);
const AddEditSupplierDialog = defineAsyncComponent(() =>
  import('./AssetAddEditSupplierDialog.vue')
);
export default {
  name: 'CanvassSelectSupplierDialog',
  components: {
    GTable,
    SupplierInformationDialog,
    AddEditSupplierDialog,
  },
  props: {
    purchaseRequestId: {
      type: Number,
      required: true,
    },
  },
  data: () => ({
    form: {
      regionId: null,
      municipalityId: null,
      provinceId: null,
      barangayId: null,
    },
    supplierId: null,
    isSupplierInformationDialogVisible: false,
    isAddEditSupplierDialogOpen: false,
  }),
  watch: {},
  methods: {
    openAddEditSupplierDialog() {
      this.isAddEditSupplierDialogOpen = true;
    },
    openSupplierInformation(data) {
      this.supplierId = data.id;
      this.isSupplierInformationDialogVisible = true;
    },
    selectSupplier(data) {
      this.$emit('selectSupplier', data);
      this.$refs.dialog.hide();
    },
    fetchData() {},
  },
};
</script>
