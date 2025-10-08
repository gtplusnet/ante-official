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
    <!-- Category & Branch -->
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
    <!-- Brand -->
    <div class="row q-gutter-sm">
      <div class="col">
        <GInput
          ref="brandSelect"
          v-model="form.brandId"
          type="select-search-with-add"
          apiUrl="brand/select-box"
          label="Brand"
          nullOption="No Brand"
          class="text-body-small"
          @showAddDialog="showBrandAddDialog"
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

    <!-- Add Brand Dialog -->
    <AddEditBrandDialog
      v-if="isAddBrandDialogOpen"
      v-model="isAddBrandDialogOpen"
      @saveDone="selectNewBrand"
    />
  </div>
</template>
<script>
import { defineAsyncComponent } from 'vue';
import GInput from "../../../../../components/shared/form/GInput.vue";
import TagsPartial from '../../Partials/TagsPartial.vue';
import KeywordsPartial from '../../Partials/KeywordsPartial.vue';

// Lazy-loaded dialog (ALL dialogs must be lazy loaded - CLAUDE.md)
const AddEditBrandDialog = defineAsyncComponent(() =>
  import('../../../../dialog/AddEditBrandDialog.vue')
);

export default {
  name: 'BasicItemDetailsPartial',
  components: {
    GInput,
    TagsPartial,
    KeywordsPartial,
    AddEditBrandDialog,
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
    isAddBrandDialogOpen: false,
    showMeasurement: false,
    categoryOptions: [],
    branchOptions: [],
    loadingCategories: false,
    loadingBranches: false,
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
    showBrandAddDialog() {
      this.isAddBrandDialogOpen = true;
    },
    async selectNewBrand(data) {
      const autoSelect = data.id;
      await this.$refs.brandSelect.refreshSelectOptions(autoSelect);
      this.form.brandId = autoSelect;
    },
  },
};
</script>
