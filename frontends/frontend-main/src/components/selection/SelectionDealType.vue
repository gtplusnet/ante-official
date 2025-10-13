<template>
  <div>
    <!-- Deal Type Selection -->
    <g-input
      ref="selectBox"
      v-model="selectedDealTypeId"
      type="select-search-with-add"
      apiUrl="/select-box/deal-type-list"
      label="Deal Type"
      :require="required"
      :isDisabled="disabled"
      @showAddDialog="showAddDialog"
    ></g-input>

    <!-- Add/Edit Deal Type Dialog -->
    <add-edit-deal-type-dialog
      ref="addEditDialog"
      @created="handleDealTypeCreated"
    />
  </div>
</template>

<script>
import { defineAsyncComponent } from 'vue';
import GInput from '../shared/form/GInput.vue';

// Lazy-loaded dialogs (ALL dialogs must be lazy loaded - CLAUDE.md)
const AddEditDealTypeDialog = defineAsyncComponent(() =>
  import('../dialog/AddEditDealTypeDialog.vue')
);

export default {
  name: 'SelectionDealType',
  components: {
    GInput,
    AddEditDealTypeDialog,
  },
  props: {
    modelValue: {
      type: [String, Number, Object],
      default: null,
    },
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
    selectedDealTypeId: null,
  }),
  watch: {
    selectedDealTypeId(newVal) {
      this.$emit('update:modelValue', newVal);
    },
    modelValue: {
      immediate: true,
      handler(newVal) {
        if (newVal !== this.selectedDealTypeId) {
          this.selectedDealTypeId = newVal;
        }
      },
    },
    value: {
      immediate: true,
      handler(newVal) {
        // Fallback for Vue 2 style, only if modelValue is not set
        if (this.modelValue === null || this.modelValue === undefined) {
          if (newVal !== this.selectedDealTypeId) {
            this.selectedDealTypeId = newVal;
          }
        }
      },
    },
  },
  methods: {
    showAddDialog() {
      if (this.$refs.addEditDialog) {
        this.$refs.addEditDialog.show();
      }
    },
    async handleDealTypeCreated(dealType) {
      // Deal Type API uses manual wrapping, returns { data: dealType }
      const newDealTypeId = dealType.data?.id || dealType.id;

      if (this.$refs.selectBox && newDealTypeId) {
        // Reload the select box and auto-select the new deal type
        await this.$refs.selectBox.reloadGSelect(newDealTypeId);
      } else if (this.$refs.selectBox) {
        // If no ID returned, just reload
        await this.$refs.selectBox.reloadGSelect();
      }
    },
  },
};
</script>
