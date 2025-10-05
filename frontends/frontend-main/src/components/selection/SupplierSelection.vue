<template>
  <div>
    <!-- Location -->
    <g-input
      ref="selectBox"
      v-model="selectedData"
      require
      type="select-search-with-add"
      apiUrl="select-box/supplier-list"
      label="Supplier List:"
      @showAddDialog="showLocationAddDialog"
    ></g-input>

    <!-- Add/Edit Supplier Dialog -->
    <AddEditSupplierDialog
      @saveDone="selectNewSave"
      v-model="isAddEditSupplierDialogOpen"
    />
  </div>
</template>

<script>
import GInput from "../../components/shared/form/GInput.vue";

// Lazy-loaded dialogs (ALL dialogs must be lazy loaded - CLAUDE.md)
const AddEditSupplierDialog = defineAsyncComponent(() =>
  import('../../pages/Member/Asset/dialogs/AssetAddEditSupplierDialog.vue')
);

export default {
  name: 'BrandSelection',
  components: {
    GInput,
    AddEditSupplierDialog,
  },
  props: {
    value: {
      type: [String, Number, Object],
      default: null,
    },
  },
  data: () => ({
    selectedData: null,
    isAddEditSupplierDialogOpen: false,
  }),
  watch: {
    selectedData(newVal) {
      this.$emit('update:modelValue', newVal);
    },
    value: {
      immediate: true,
      handler(newVal) {
        this.selectedData = newVal;
      },
    },
  },
  mounted() {},
  methods: {
    async showLocationAddDialog() {
      this.isAddEditSupplierDialogOpen = true;
    },
    async selectNewSave(data) {
      const autoSelect = data.id;
      await this.$refs.selectBox.reloadGSelect(autoSelect);
    },
  },
};
</script>
