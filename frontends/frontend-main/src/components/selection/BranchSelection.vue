<template>
  <div>
    <g-input
      ref="selectBox"
      v-model="selectedData"
      type="select-search"
      apiUrl="select-box/branch-list"
      label="Select Branch"
    />
  </div>
</template>

<script>
import GInput from "../shared/form/GInput.vue";

export default {
  name: 'BranchSelection',
  components: { GInput },
  props: {
    modelValue: {
      type: [String, Number],
      default: null,
    },
  },
  data: () => ({
    selectedData: null,
  }),
  watch: {
    selectedData(newVal) {
      this.$emit('update:modelValue', newVal);
    },
    modelValue: {
      immediate: true,
      handler(newVal) {
        this.selectedData = newVal;
      },
    },
  },
  methods: {
    async reloadOptions(autoSelect = null) {
      await this.$refs.selectBox.reloadGSelect(autoSelect);
    },
  },
};
</script>