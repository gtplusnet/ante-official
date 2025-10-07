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
    <!-- Category, Brand & Branch -->
    <div class="row q-gutter-sm">
      <div class="col">
        <q-select
          v-model="form.categoryId"
          :options="categoryOptions"
          option-label="name"
          option-value="id"
          label="Category"
          clearable
          emit-value
          map-options
          outlined
          dense
          class="text-body-small"
          :loading="loadingCategories"
        />
      </div>
      <div class="col">
        <q-select
          v-model="form.brandId"
          :options="brandOptions"
          option-label="name"
          option-value="id"
          label="Brand"
          clearable
          emit-value
          map-options
          outlined
          dense
          class="text-body-small"
          :loading="loadingBrands"
        />
      </div>
      <div class="col">
        <q-select
          v-model="form.branchId"
          :options="branchOptions"
          option-label="name"
          option-value="id"
          label="Branch"
          clearable
          emit-value
          map-options
          outlined
          dense
          class="text-body-small"
          :loading="loadingBranches"
        />
      </div>
    </div>
    <!-- Keywords -->
    <div class="row q-gutter-sm">
      <div class="col">
        <keywords-partial ref="keywordsPartial" class="text-body-small" v-model="isKeywordsPartialDisplayed" @onKeywordUpdate="onKeywordUpdated" />
      </div>
    </div>
    <!-- Enable in POS -->
    <div class="row q-gutter-sm">
      <div class="col flex items-center">
        <q-checkbox v-model="form.enabledInPOS" label="Enable in POS" class="text-body-small" />
      </div>
    </div>
  </div>
</template>
<script>
import GInput from "../../../../../components/shared/form/GInput.vue";
import TagsPartial from '../../Partials/TagsPartial.vue';
import KeywordsPartial from '../../Partials/KeywordsPartial.vue';

export default {
  name: 'BasicItemDetailsPartial',
  components: {
    GInput,
    TagsPartial,
    KeywordsPartial,
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
      categoryId: null,
      keywords: [],
      enabledInPOS: false,
      branchId: null,
      brandId: null,
    },
    isTagPartialDisplayed: true,
    isKeywordsPartialDisplayed: true,
    showMeasurement: false,
    categoryOptions: [],
    branchOptions: [],
    brandOptions: [],
    loadingCategories: false,
    loadingBranches: false,
    loadingBrands: false,
  }),
  watch: {
    form: {
      handler() {
        this.$emit('onBasicDetailsUpdate', { ...this.form });
      },
      deep: true,
    },
  },
  mounted() {
    this.fetchCategoryOptions();
    this.fetchBrandOptions();
    this.fetchBranchOptions();
  },
  computed: {},
  methods: {
    async fetchCategoryOptions() {
      this.loadingCategories = true;
      try {
        const response = await this.$api.get('/item-category/select-box');
        this.categoryOptions = response.data;
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        this.loadingCategories = false;
      }
    },
    async fetchBrandOptions() {
      this.loadingBrands = true;
      try {
        const response = await this.$api.get('/brand/select-box');
        this.brandOptions = response.data;
      } catch (error) {
        console.error('Error fetching brands:', error);
      } finally {
        this.loadingBrands = false;
      }
    },
    async fetchBranchOptions() {
      this.loadingBranches = true;
      try {
        const response = await this.$api.get('/branch/select-box');
        this.branchOptions = response.data;
      } catch (error) {
        console.error('Error fetching branches:', error);
      } finally {
        this.loadingBranches = false;
      }
    },
    setTags(tags) {
      this.form.tags = tags;
      this.$refs.tagsPartial.tags = tags;
    },
    setKeywords(keywords) {
      this.form.keywords = keywords;
      if (this.$refs.keywordsPartial) {
        this.$refs.keywordsPartial.keywords = keywords;
      }
    },
    onTagUpdated(val) {
      this.form.tags = val;
    },
    onKeywordUpdated(val) {
      this.form.keywords = val;
    },
  },
};
</script>
