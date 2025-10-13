<template>
  <div>
    <!-- Deal Source Selection -->
    <g-input
      ref="selectBox"
      v-model="selectedDealSourceId"
      type="select-search-with-add"
      apiUrl="/select-box/deal-source-list"
      label="Deal Source"
      :require="required"
      :isDisabled="disabled"
      @showAddDialog="showAddDialog"
    ></g-input>

    <!-- Add/Edit Deal Source Dialog -->
    <add-edit-deal-source-dialog
      ref="addEditDialog"
      @created="handleDealSourceCreated"
    />
  </div>
</template>

<script>
import { defineAsyncComponent } from 'vue';
import GInput from '../shared/form/GInput.vue';

// Lazy-loaded dialogs (ALL dialogs must be lazy loaded - CLAUDE.md)
const AddEditDealSourceDialog = defineAsyncComponent(() =>
  import('../dialog/AddEditDealSourceDialog.vue')
);

export default {
  name: 'SelectionDealSource',
  components: {
    GInput,
    AddEditDealSourceDialog,
  },
  props: {
    value: {
      type: [String, Number, Object],
      default: null,
    },
    required: {
      type: Boolean,
      default: false,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
  },
  data: () => ({
    selectedDealSourceId: null,
  }),
  watch: {
    selectedDealSourceId(newVal) {
      this.$emit('update:modelValue', newVal);
    },
    value: {
      immediate: true,
      handler(newVal) {
        this.selectedDealSourceId = newVal;
      },
    },
  },
  methods: {
    showAddDialog() {
      if (this.$refs.addEditDialog) {
        this.$refs.addEditDialog.show();
      }
    },
    async handleDealSourceCreated(dealSource) {
      // Deal Source API uses responseHandler, returns data directly
      const newDealSourceId = dealSource.id;

      if (this.$refs.selectBox && newDealSourceId) {
        // Reload the select box and auto-select the new deal source
        await this.$refs.selectBox.reloadGSelect(newDealSourceId);
      } else if (this.$refs.selectBox) {
        // If no ID returned, just reload
        await this.$refs.selectBox.reloadGSelect();
      }
    },
  },
};
</script>
