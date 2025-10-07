<template>
  <div class="q-pa-md example-column-vertical-alignment">
    <!-- Basic Item Details -->
    <div class="column justify-start">
      <basic-item-details-partial ref="basicDetails" @onBasicDetailsUpdate="onBasicDetailsUpdate" />
    </div>

    <!-- Tiers -->
    <div class="column justify-start">
      <tiers-partial :itemInformation="itemInformation" @onTierUpdate="onTierUpdate" />
    </div>

    <!-- Variations -->
    <div v-if="form.itemName && form.tiers && form.tiers.length > 0" class="column justify-start">
      <variations-partial :itemInformation="itemInformation" ref="tags" :tiers="form.tiers" :itemName="form.itemName"
        @onVariationUpdate="onVariationUpdate" />
    </div>
  </div>
</template>
<script>
import BasicItemDetailsPartial from './Partials/BasicItemDetailsPartial.vue';
import TiersPartial from './Partials/TiersPartial.vue';
import VariationsPartial from './Partials/VariationsPartial.vue';

export default {
  name: 'VariationItem',
  components: {
    BasicItemDetailsPartial,
    TiersPartial,
    VariationsPartial,
  },
  props: {
    itemInformation: {
      type: Object || null,
      default: null,
    },
  },
  data: () => ({
    form: {
      itemName: '',
      description: '',
      tags: [],
      tiers: null,
      variations: [],
      uom: null,
      sellingPrice: '',
      minimumStockLevel: 0,
      maximumStockLevel: 0,
      categoryId: null,
      keywords: [],
      enabledInPOS: false,
      branchId: null,
      brandId: null,
    },
  }),
  watch: {
    form: {
      handler() {
        this.$emit('onFormUpdate', {
          type: 'variation',
          data: this.form,
        });
      },
      deep: true,
    },
  },
  mounted() {
    this.initialize();
  },
  computed: {},
  methods: {
    initialize() {
      if (this.itemInformation) {
        this.$refs.basicDetails.form.itemName = this.itemInformation.name;
        this.$refs.basicDetails.form.description = this.itemInformation.description;
        this.$refs.basicDetails.form.tags = this.itemInformation.tags;
        this.$refs.basicDetails.setTags(this.itemInformation.tags);

        // Initialize price fields with proper value handling
        this.$refs.basicDetails.form.sellingPrice = this.itemInformation.sellingPrice || '';
        this.$refs.basicDetails.form.minimumStockLevel = this.itemInformation.minimumStockLevel || 0;
        this.$refs.basicDetails.form.maximumStockLevel = this.itemInformation.maximumStockLevel || 0;

        // Set UOM if available
        if (this.itemInformation.uom) {
          this.$refs.basicDetails.form.uom = this.itemInformation.uom;
        }

        // Handle new fields
        this.$refs.basicDetails.form.categoryId = this.itemInformation.categoryId || null;
        this.$refs.basicDetails.form.brandId = this.itemInformation.brandId || null;
        this.$refs.basicDetails.form.enabledInPOS = this.itemInformation.enabledInPOS || false;
        this.$refs.basicDetails.form.branchId = this.itemInformation.branchId || null;
        this.$refs.basicDetails.setKeywords(this.itemInformation.keywords || []);

        if (!this.itemInformation.hasOwnProperty('parent') && this.itemInformation.parent) {
          this.$refs.basicDetails.showMeasurement = true;
        }
      }
      else {
        this.$refs.basicDetails.showMeasurement = true;
      }
    },
    onTierUpdate(value) {
      this.form.tiers = value;
    },

    onBasicDetailsUpdate(newUpdate) {
      this.form.itemName = newUpdate.itemName;
      this.form.description = newUpdate.description;
      this.form.tags = newUpdate.tags;
      this.form.uom = newUpdate.uom;
      this.form.sellingPrice = newUpdate.sellingPrice;
      this.form.minimumStockLevel = newUpdate.minimumStockLevel;
      this.form.maximumStockLevel = newUpdate.maximumStockLevel;
      this.form.categoryId = newUpdate.categoryId;
      this.form.brandId = newUpdate.brandId;
      this.form.keywords = newUpdate.keywords;
      this.form.enabledInPOS = newUpdate.enabledInPOS;
      this.form.branchId = newUpdate.branchId;
    },

    onVariationUpdate(newUpdate) {
      this.form.variations = newUpdate;
    },
  },
};
</script>
