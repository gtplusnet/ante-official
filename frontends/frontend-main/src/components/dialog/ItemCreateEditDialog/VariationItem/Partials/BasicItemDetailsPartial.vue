<template>
  <div>
    <div class="text-title-small text-primary">Basic Details</div>
    <!-- Item name -->
    <div class="row q-gutter-sm">
      <div class="col">
        <GInput required type="text" label="Item Name" v-model="form.itemName" class="text-body-medium"></GInput>
      </div>
    </div>
    <!-- Description -->
    <div class="row q-gutter-sm">
      <div class="col">
        <GInput required type="textarea" label="Description" v-model="form.description" class="text-body-medium"></GInput>
      </div>
    </div>
    <!-- Tags -->
    <div class="row q-gutter-sm">
      <div class="col">
        <tags-partial ref="tagsPartial" v-model="isTagPartialDisplayed" class="text-body-medium" @onTagUpdate="onTagUpdated" />
      </div>
    </div>
    <div v-if="showMeasurement" class="col">
      <GInput required type="select" apiUrl="select-box/unit-of-measurement-list" label="Unit of Measurement"
        v-model="form.uom" class="text-body-medium"></GInput>
    </div>
    <!-- Selling Price & Stock Levels -->
    <div class="row q-gutter-sm">
      <div class="col">
        <GInput required type="text" label="Selling Price" v-model="form.sellingPrice"></GInput>
      </div>
      <div class="col">
        <GInput required type="number" label="Minimum Stock Level" v-model="form.minimumStockLevel"></GInput>
      </div>
      <div class="col">
        <GInput required type="number" label="Maximum Stock Level" v-model="form.maximumStockLevel"></GInput>
      </div>
    </div>
  </div>
</template>
<script>
import GInput from "../../../../../components/shared/form/GInput.vue";
import TagsPartial from '../../Partials/TagsPartial.vue';

export default {
  name: 'BasicItemDetailsPartial',
  components: {
    GInput,
    TagsPartial,
  },
  props: {},
  data: () => ({
    form: {
      itemName: '',
      description: '',
      tags: [],
      uom: null,
      sellingPrice: '',
      minimumStockLevel: 0,
      maximumStockLevel: 0,
    },
    isTagPartialDisplayed: true,
    showMeasurement: false
  }),
  watch: {
    form: {
      handler() {
        this.$emit('onBasicDetailsUpdate', { ...this.form });
      },
      deep: true,
    },
  },
  mounted() { },
  computed: {},
  methods: {
    setTags(tags) {
      this.form.tags = tags;
      this.$refs.tagsPartial.tags = tags;
    },
    onTagUpdated(val) {
      this.form.tags = val;
    },
  },
};
</script>
