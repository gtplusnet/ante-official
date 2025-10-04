<template>
  <g-table
    :isRowActionEnabled="true"
    tableKey="supplier"
    apiUrl="/supplier"
    :apiFilters="[{ type: ['PURCHASE_ORDER'], deleted: false }]"
    ref="table"
    class="text-body-small"
  >
    <!-- slot - actions -->
    <template v-slot:row-actions="props">
      <q-btn
        rounded
        class="q-mr-sm text-label-medium"
        @click="editSupplier(props.data)"
        no-caps
        color="primary"
        unelevated
      >
        <q-icon class="q-mr-sm" size="20px" name="edit"></q-icon> Edit
      </q-btn>
      <q-btn
        rounded
        class="q-mr-sm text-label-medium"
        @click="deleteSupplier(props.data)"
        no-caps
        color="red"
        outline
      >
        <q-icon class="q-mr-sm" size="20px" name="delete"></q-icon> Delete
      </q-btn>
    </template>

    <!-- slot - supplier name -->
    <template v-slot:name="props">
      <span
        @click="openSupplierInformation(props.data)"
        class="clickable-code text-body-small"
        >{{ props.data.name }}</span
      >
    </template>
  </g-table>

  <!-- Add/Edit Supplier Dialog -->
  <add-edit-supplier-dialog
    @saveDone="$refs.table.refetch()"
    @close="isAddEditSupplierDialogOpen = false"
    :supplierInformation="supplierInformation"
    v-model="isAddEditSupplierDialogOpen"
    class="text-body-small"
  />


  <!-- Supplier Information Dialog -->
  <supplier-information-dialog
    v-if="supplierId"
    :supplierId="supplierId"
    v-model="isSupplierInformationDialogOpen"
      />
</template>

<script>
import { defineAsyncComponent } from 'vue';
import { api } from 'src/boot/axios';
import GTable from "../../components/shared/display/GTable.vue";

// Lazy-loaded dialogs (ALL dialogs must be lazy loaded - CLAUDE.md)
const AddEditSupplierDialog = defineAsyncComponent(() =>
  import("../../pages/Member/Asset/dialogs/AssetAddEditSupplierDialog.vue")
);
const SupplierInformationDialog = defineAsyncComponent(() =>
  import("../../pages/Member/Asset/dialogs/AssetSupplierInformationDialog/SupplierInformationDialog.vue")
);

export default {
  name: 'SupplierTable',
  components: {
    GTable,
    AddEditSupplierDialog,
    SupplierInformationDialog,
  },
  props: {},
  data: () => ({
    supplierInformation: null,
    supplierId: null,
    isSupplierInformationDialogOpen: false,
    isAddEditSupplierDialogOpen: false,
  }),
  watch: {},
  methods: {
    editSupplier(data) {
      this.supplierInformation = data;
      this.isAddEditSupplierDialogOpen = true;
    },
    openSupplierInformation(data) {
      this.supplierId = data.id;
      this.isSupplierInformationDialogOpen = true;
    },
    deleteSupplier(data) {
      this.$q
        .dialog({
          title: 'Confirm',
          message: `Are you sure you want to delete <b>${data.name}</b>?`,
          ok: 'Yes',
          cancel: 'No',
          html: true,
        })
        .onOk(() => {
          this.deleteSupplierApi(data.id);
        });
    },
    async deleteSupplierApi(id) {
      try {
        this.$q.loading.show();
        api.delete(`supplier/${id}`);
        this.$refs.table.refetch();
        this.$q.loading.hide();
      } catch (error) {
        this.handleAxiosError(error);
        this.$q.loading.hide();
      }
    },
  },
};
</script>
