<template>
  
  <div>
    <!-- Location -->
    <g-input ref="selectBox" v-model="selectedLocation" require type="select-search-with-add"
      apiUrl="select-box/location-list" label="Location" @showAddDialog="showLocationAddDialog"></g-input>

    <!-- Add/Edit Location Dialog -->
    <add-edit-location-dialog @saveDone="selectNewSave" v-model="isAddLocationDialogOpen" />
  </div>
</template>

<script>
import GInput from "../../components/shared/form/GInput.vue";
import AddEditLocationDialog from '../dialog/AddEditLocationDialog.vue';

export default {
  name: 'SelectionLocation',
  components: {
    GInput,
    AddEditLocationDialog,
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
