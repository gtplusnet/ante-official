<template>
  <div>
    <!-- Location -->
    <g-input
      ref="selectBox"
      v-model="selectedLocation"
      require
      type="select-search-with-add"
      apiUrl="select-box/warehouse-list"
      label="Warehouse"
      @showAddDialog="showLocationAddDialog"
    ></g-input>

    <!-- Add/Edit Location Dialog -->
    <add-edit-warehouse-dialog
      @saveDone="selectNewSave"
      v-model="isAddLocationDialogOpen"
    />
  </div>
</template>

<script>
import GInput from '../../../../../components/shared/form/GInput.vue';
import AddEditWarehouseDialog from '../../dialogs/AssetAddEditWarehouseDialog.vue';

export default {
  name: 'AssetWarehouseSelection',
  components: {
    GInput,
    AddEditWarehouseDialog,
  },
  props: {
    value: {
      type: [String, Number, Object],
      default: null,
    },
  },
  data: () => ({
    selectedLocation: null,
    isAddLocationDialogOpen: false,
  }),
  watch: {
    selectedLocation(newVal) {
      console.log('newVal', newVal);
      this.$emit('update:modelValue', newVal);
    },
    value: {
      immediate: true,
      handler(newVal) {
        this.selectedLocation = newVal;
      },
    },
  },
  mounted() {},
  methods: {
    async showLocationAddDialog() {
      this.isAddLocationDialogOpen = true;
    },
    async selectNewSave(data) {
      const autoSelect = data.id;
      await this.$refs.selectBox.reloadGSelect(autoSelect);
    },
  },
};
</script>
