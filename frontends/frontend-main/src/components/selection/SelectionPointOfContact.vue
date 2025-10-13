<template>
  <div>
    <!-- Point of Contact Selection -->
    <g-input
      ref="selectBox"
      v-model="selectedContactId"
      type="select-search-with-add"
      apiUrl="/select-box/point-of-contact-list"
      label="Point Of Contact"
      @showAddDialog="showAddDialog"
    ></g-input>

    <!-- Add/Edit Point of Contact Dialog -->
    <add-edit-point-of-contact-dialog
      ref="addEditDialog"
      @created="handleContactCreated"
    />
  </div>
</template>

<script>
import { defineAsyncComponent } from 'vue';
import GInput from '../shared/form/GInput.vue';

// Lazy-loaded dialogs (ALL dialogs must be lazy loaded - CLAUDE.md)
const AddEditPointOfContactDialog = defineAsyncComponent(() =>
  import('../../pages/Member/Leads/People/dialogs/AddEditPointOfContactDialog.vue')
);

export default {
  name: 'SelectionPointOfContact',
  components: {
    GInput,
    AddEditPointOfContactDialog,
  },
  props: {
    value: {
      type: [String, Number, Object],
      default: null,
    },
  },
  data: () => ({
    selectedContactId: null,
  }),
  watch: {
    selectedContactId(newVal) {
      this.$emit('update:modelValue', newVal);
    },
    value: {
      immediate: true,
      handler(newVal) {
        this.selectedContactId = newVal;
      },
    },
  },
  methods: {
    showAddDialog() {
      if (this.$refs.addEditDialog) {
        this.$refs.addEditDialog.show();
      }
    },
    async handleContactCreated(contact) {
      // The contact was created and automatically added to Point of Contact page
      // Now auto-select the newly created contact (API uses responseHandler, returns data directly)
      const newContactId = contact.id;

      if (this.$refs.selectBox && newContactId) {
        // Reload the select box and auto-select the new contact
        await this.$refs.selectBox.reloadGSelect(newContactId);
      } else if (this.$refs.selectBox) {
        // If no ID returned, just reload
        await this.$refs.selectBox.reloadGSelect();
      }
    },
  },
};
</script>
