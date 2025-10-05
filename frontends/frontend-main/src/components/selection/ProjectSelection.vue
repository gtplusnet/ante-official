<template>
  <div>
    <!-- Location -->
    <g-input
      ref="selectBox"
      v-model="selectedData"
      require
      type="select-search-with-add"
      apiUrl="select-box/project-list"
      label="Project List:"
      @showAddDialog="showLocationAddDialog"
    ></g-input>

    <!-- Add/Edit Location Dialog -->
    <ProjectCreateDialog
      @saveDone="selectNewSave"
      v-model="isProjectCreateDialogOpen"
    />
  </div>
</template>

<script>
import GInput from "../../components/shared/form/GInput.vue";

// Lazy-loaded dialogs (ALL dialogs must be lazy loaded - CLAUDE.md)
const ProjectCreateDialog = defineAsyncComponent(() =>
  import('../dialog/ProjectCreateDialog.vue')
);

export default {
  name: 'BrandSelection',
  components: {
    GInput,
    ProjectCreateDialog,
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
    isProjectCreateDialogOpen: false,
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
      this.isProjectCreateDialogOpen = true;
    },
    async selectNewSave(data) {
      const autoSelect = data.id;
      console.log('autoSelect', autoSelect);
      await this.$refs.selectBox.reloadGSelect(autoSelect);
    },
  },
};
</script>
