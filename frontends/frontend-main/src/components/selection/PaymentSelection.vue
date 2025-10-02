<template>
  <div>
    <!-- Location -->
    <g-input
      ref="selectBox"
      v-model="selectedData"
      require
      type="select"
      apiUrl="select-box/fund-account-type-list"
      label="Payment Type:"
    ></g-input>
  </div>
</template>

<script>
import GInput from "../../components/shared/form/GInput.vue";

export default {
  name: 'BrandSelection',
  components: {
    GInput,
  },
  props: {
    value: {
      type: [String, Number, Object],
      default: null,
    },
  },
  data: () => ({
    selectedData: null,
    isAddEditSupplierDialogOpen: false,
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
      this.isAddEditSupplierDialogOpen = true;
    },
  },
};
</script>
