<template>
  
  <div>
    <!-- Location -->
    <g-input ref="selectBox" v-model="selectedLocation" required type="select-search-with-add"
      apiUrl="/select-box/location-list" label="Location" @showAddDialog="showLocationAddDialog"></g-input>

    <!-- Add/Edit Location Dialog -->
    <add-edit-location-dialog @saveDone="selectNewSave" v-model="isAddLocationDialogOpen" />
  </div>
</template>

<script>
import { defineAsyncComponent } from 'vue';
import GInput from "../../components/shared/form/GInput.vue";

// Lazy-loaded dialogs (ALL dialogs must be lazy loaded - CLAUDE.md)
const AddEditLocationDialog = defineAsyncComponent(() =>
  import('../dialog/AddEditLocationDialog.vue')
);

export default {
  name: 'SelectionLocation',
  components: {
    GInput,
    AddEditLocationDialog,
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
  },
  data: () => ({
    selectedLocation: null,
    isAddLocationDialogOpen: false,
  }),
  watch: {
    selectedLocation(newVal) {
      this.$emit('update:modelValue', newVal);
    },
    modelValue: {
      immediate: true,
      handler(newVal) {
        if (newVal !== this.selectedLocation) {
          this.selectedLocation = newVal;
        }
      },
    },
    value: {
      immediate: true,
      handler(newVal) {
        // Fallback for Vue 2 style, only if modelValue is not set
        if (this.modelValue === null || this.modelValue === undefined) {
          if (newVal !== this.selectedLocation) {
            this.selectedLocation = newVal;
          }
        }
      },
    },
  },
  mounted() {
  },
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
