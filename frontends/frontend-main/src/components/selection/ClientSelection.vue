<template>
  <div>
    <!-- Location -->
    <g-input
      ref="selectBox"
      v-model="selectedData"
      require
      type="select-search-with-add"
      apiUrl="select-box/client-list"
      label="Client List:"
      @showAddDialog="showLocationAddDialog"
    ></g-input>

    <!-- Add/Edit Client Dialog -->
    <AddEditClientDialog
      @saveDone="selectNewSave"
      v-model="isAddEditClientDialogOpen"
    />
  </div>
</template>

<script>
import GInput from "../../components/shared/form/GInput.vue";

// Lazy-loaded dialogs (ALL dialogs must be lazy loaded - CLAUDE.md)
const AddEditClientDialog = defineAsyncComponent(() =>
  import('../dialog/AddEditClientDialog.vue')
);

export default {
  name: 'BrandSelection',
  components: {
    GInput,
    AddEditClientDialog,
  },
  props: {
    value: {
      type: [String, Number, Object],
      default: null,
    },
  },
  data: () => ({
    selectedData: null,
    isAddEditClientDialogOpen: false,
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
      this.isAddEditClientDialogOpen = true;
    },
    async selectNewSave(data) {
      const autoSelect = data.id;
      console.log('autoSelect', autoSelect);
      await this.$refs.selectBox.reloadGSelect(autoSelect);
    },
  },
};
</script>
