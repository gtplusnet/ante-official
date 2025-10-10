<template>
  <div>
    <div class="row q-gutter-sm items-center justify-between">
      <div class="col text-subtitle2 text-primary">Variations</div>
    </div>

    <div class="row q-gutter-sm items-center justify-between">
      <div class="col text-center label">Item Name</div>
      <div class="col text-center label">SKU</div>
      <div v-if="!itemInformation" class="col text-center label">Price</div>
      <div v-if="!itemInformation" class="col text-center label">Size</div>
      <div v-if="!itemInformation" class="col text-center label">Selling Price</div>
      <div v-if="!itemInformation" class="col text-center label">Min Stock</div>
      <div v-if="!itemInformation" class="col text-center label">Max Stock</div>
    </div>

    <div v-for="(variation, index) in data" :key="index">
      <div class="row q-gutter-sm">
        <div class="col">
          <GInput required type="text_with_tooltip" v-model="variation.itemName" :tooltipLabel="variation.itemName">
          </GInput>
        </div>
        <div class="col">
          <GInput required type="text_with_tooltip" v-model="variation.sku" :tooltipLabel="variation.sku"></GInput>
        </div>
        <div class="col" v-if="!itemInformation">
          <GInput required type="text" v-model="variation.price"></GInput>
        </div>
        <div class="col" v-if="!itemInformation">
          <GInput required type="text" v-model="variation.size"></GInput>
        </div>
        <div class="col" v-if="!itemInformation">
          <GInput required type="text" v-model="variation.sellingPrice"></GInput>
        </div>
        <div class="col" v-if="!itemInformation">
          <GInput required type="number" v-model="variation.minimumStockLevel"></GInput>
        </div>
        <div class="col" v-if="!itemInformation">
          <GInput required type="number" v-model="variation.maximumStockLevel"></GInput>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import GInput from "../../../../../components/shared/form/GInput.vue";

export default {
  name: 'VariationsPartial',
  components: { GInput },
  props: {
    itemName: {
      type: String,
      required: true,
    },
    tiers: {
      type: Array,
      required: true,
    },
    itemInformation: {
      type: Object || null,
      default: null,
    },
  },
  data() {
    return {
      data: [],
    };
  },
  watch: {
    tiers: {
      handler(updatedValue) {
        this.formatVariations(updatedValue);
      },
      deep: true,
      immediate: true,
    },
    data: {
      handler() {
        this.$emit('onVariationUpdate', this.data);
      },
      deep: true,
    },
  },
  mounted() {
    this.formatVariations(this.tiers);
  },
  methods: {
    formatVariations(tiers) {
      if (!tiers || tiers.length === 0) {
        this.data = [];
        return;
      }

      const variations = this.generateCombinations(tiers);
      this.data = variations.map((variation) => ({
        itemName: this.generateItemName(variation),
        sku: this.generateSku(variation),
        variation: variation,
        price: 0,
        size: 0,
        sellingPrice: 0,
        minimumStockLevel: 0,
        maximumStockLevel: 0,
      }));
    },
    

    generateCombinations(tiers) {
      return tiers.reduce((acc, tier) => {
        const { key, attributes } = tier;
        if (acc.length === 0) {
          return attributes.map((attr) => ({ [key]: attr }));
        }
        return acc.flatMap((variant) =>
          attributes.map((attr) => ({ ...variant, [key]: attr }))
        );
      }, []);
    },

    generateItemName(variation) {
      const attributes = Object.values(variation)
        .map((value) => this.capitalizeFirstLetter(value))
        .join(' ');
      return `${this.itemName} ${attributes}`;
    },


    generateSku(variation) {
      const attributes = Object.values(variation)
        .map((value) => value.toUpperCase())
        .join('-');

      const itemNameCode = this.formatCode(this.itemName);
      const attributesCode = this.formatCode(attributes);
      return `${itemNameCode}-${attributesCode}`;
    },


    capitalizeFirstLetter(string) {
      return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
    },
  },
};
</script>
