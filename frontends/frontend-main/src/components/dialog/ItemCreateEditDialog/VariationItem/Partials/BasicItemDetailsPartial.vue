<template>
  <div>
    <div class="text-title-small text-primary q-mb-md">Basic Details</div>
    <!-- Item name -->
    <div class="row q-gutter-sm">
      <div class="col">
        <GInput required type="text" label="Item Name" v-model="form.itemName" class="text-body-medium"></GInput>
      </div>
    </div>
    <!-- Description -->
    <div class="row q-gutter-sm">
      <div class="col">
        <GInput required type="textarea" label="Description" v-model="form.description" class="text-body-medium">
        </GInput>
      </div>
    </div>
    <!-- Tags -->
    <div class="row q-gutter-sm">
      <div class="col">
        <tags-partial ref="tagsPartial" v-model="isTagPartialDisplayed" class="text-body-medium"
          @onTagUpdate="onTagUpdated" />
      </div>
    </div>
    <div v-if="showMeasurement" class="col q-mb-md">
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
    <div class="row q-gutter-sm q-pb-md">
      <div class="col">
        <div class="label">Category</div>
        <CustomCategoryTreeSelect
          ref="categorySelect"
          v-model="selectedCategoryIds"
          placeholder="Select Category"
          :showAllOption="false"
          :includeChildren="false"
          :showAddButton="true"
          outlined
        />
      </div>
      <div class="col">
        <div class="label">Branch</div>
        <CustomBranchTreeSelect
          v-model="selectedBranchIds"
          placeholder="Select Branch"
          :showAllOption="false"
          :includeChildren="false"
          :showAddButton="true"
          outlined
        />
      </div>
    </div>
    <!-- Brand -->
    <div class="row q-gutter-sm q-mb-md">
      <div class="col">
        <GInput ref="brandSelect" v-model="form.brandId" type="select-search-with-add" apiUrl="brand/select-box"
          label="Brand" nullOption="No Brand" class="text-body-small" @showAddDialog="showBrandAddDialog" />
      </div>
    </div>
    <!-- Keywords -->
    <div class="row q-gutter-sm">
      <div class="col">
        <keywords-partial ref="keywordsPartial" class="text-body-small" v-model="isKeywordsPartialDisplayed"
          @onKeywordUpdate="onKeywordUpdated" />
      </div>
    </div>
    <!-- Enable in POS -->
    <div class="row q-gutter-sm">
      <div class="col flex items-center">
        <q-checkbox v-model="form.enabledInPOS" label="Enable in POS" class="text-body-small" />
      </div>
    </div>

    <!-- Add Brand Dialog -->
    <AddEditBrandDialog v-if="isAddBrandDialogOpen" v-model="isAddBrandDialogOpen" @saveDone="selectNewBrand" />
  </div>
</template>
<script>
import { defineAsyncComponent } from 'vue';
import GInput from "../../../../../components/shared/form/GInput.vue";
import TagsPartial from '../../Partials/TagsPartial.vue';
import KeywordsPartial from '../../Partials/KeywordsPartial.vue';
import CustomBranchTreeSelect from '../../../../../components/selection/CustomBranchTreeSelect.vue';
import CustomCategoryTreeSelect from '../../../../../components/selection/CustomCategoryTreeSelect.vue';

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
    CustomBranchTreeSelect,
    CustomCategoryTreeSelect,
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
  }),
  watch: {
    form: {
      handler() {
        this.$emit('onBasicDetailsUpdate', { ...this.form });
      },
      deep: true,
    },
  },
  mounted() {},
  computed: {
    // Convert between single branchId (for backend) and array format (for CustomBranchTreeSelect)
    selectedBranchIds: {
      get() {
        // Convert single ID to array format for the component
        if (this.form.branchId === null || this.form.branchId === undefined) {
          return [];
        }
        return [this.form.branchId];
      },
      set(value) {
        // Convert array back to single ID for the form
        if (!value || value.length === 0) {
          this.form.branchId = null;
        } else {
          // Take the first ID from the array (primary selected branch)
          this.form.branchId = value[0];
        }
      }
    },
    // Convert between single categoryId (for backend) and array format (for CustomCategoryTreeSelect)
    selectedCategoryIds: {
      get() {
        // Convert single ID to array format for the component
        if (this.form.categoryId === null || this.form.categoryId === undefined) {
          return [];
        }
        return [this.form.categoryId];
      },
      set(value) {
        // Convert array back to single ID for the form
        if (!value || value.length === 0) {
          this.form.categoryId = null;
        } else {
          // Take the first ID from the array (primary selected category)
          this.form.categoryId = value[0];
        }
      }
    }
  },
  methods: {
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
