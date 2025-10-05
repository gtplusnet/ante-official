<template>
  <div>
    <!-- Location -->
    <g-input
      ref="selectBox"
      v-model="selectedData"
      require
      type="select-search-with-add"
      apiUrl="select-box/brand-list"
      label="Brand"
      @showAddDialog="showLocationAddDialog"
    ></g-input>

    <!-- Add/Edit Location Dialog -->
    <add-edit-brand-dialog
      @saveDone="selectNewSave"
      v-model="isAddDialogOpen"
    />
  </div>
</template>

<script>
import { defineAsyncComponent } from 'vue';
import GInput from "../../components/shared/form/GInput.vue";

// Lazy-loaded dialogs (ALL dialogs must be lazy loaded - CLAUDE.md)
const AddEditBrandDialog = defineAsyncComponent(() =>
  import('../dialog/AddEditBrandDialog.vue')
);

export default {
  name: 'BrandSelection',
  components: {
    GInput,
    AddEditBrandDialog,
  },
  props: {
    value: {
      type: [String, Number, Object],
      default: null,
    },
  },
  data: () => ({
    selectedData: null,
    isAddDialogOpen: false,
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
      this.isAddDialogOpen = true;
    },
    async selectNewSave(data) {
      const autoSelect = data.id;
      console.log('autoSelect', autoSelect);
      await this.$refs.selectBox.reloadGSelect(autoSelect);
    },
  },
};
</script>
