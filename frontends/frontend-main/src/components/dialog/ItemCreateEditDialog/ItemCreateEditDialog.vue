<template>
  <q-dialog v-model="dialogVisible" @before-show="initialize" ref="dialog">
    <TemplateDialog maxWidth="700px" :icon="'inventory'" :iconColor="'primary'">
      <!-- Dialog Title -->
      <template #DialogTitle>
        {{ itemInformation ? 'Edit Item' : 'Create Item' }}
      </template>

      <!-- Dialog Content -->
      <template #DialogContent>
        <div>
          <!-- Tabs for Simple/Variation Item (only for new items) -->
          <q-tabs v-if="!itemInformation" v-model="tab" dense class="text-grey" active-color="primary"
            indicator-color="primary" align="justify" narrow-indicator>
            <q-tab name="simple" label="Simple Item" no-caps/>
            <q-tab name="variation" label="Variation Item" no-caps />
          </q-tabs>

          <q-separator v-if="!itemInformation" />

          <!-- Tab Panels -->
          <q-tab-panels v-model="tab" animated>
            <q-tab-panel name="simple">
              <simple-item :key="componentKey" :v-model="isSimpleItemOnDisplay" :itemInformation="itemInformation"
                @onFormUpdate="onSimpleItemUpdate" />
            </q-tab-panel>
            <q-tab-panel name="variation">
              <variation-item :key="componentKey" :v-model="isVariationItemOnDisplay" :itemInformation="itemInformation"
                :fullItemData="fullItemData" @onFormUpdate="onVariationItemUpdate" />
            </q-tab-panel>
          </q-tab-panels>
        </div>
      </template>

      <!-- Dialog Actions -->
      <template #DialogSubmitActions>
        <GButton label="Cancel" variant="text" color="primary" v-close-popup />
        <GButton :label="itemInformation ? 'Update Item' : 'Save Item'" variant="filled" color="primary"
          @click="onSaveButtonClicked" />
      </template>
    </TemplateDialog>

    <!-- Confirmation Dialog -->
    <q-dialog v-model="confirm" persistent>
      <TemplateDialog size="xs" :scrollable="false" :icon="'help_outline'" :iconColor="'warning'">
        <template #DialogTitle>
          Confirm {{ itemInformation ? 'Update' : 'Save' }}
        </template>

        <template #DialogContent>
          <div class="text-body-medium q-pa-md">
            {{ itemInformation
              ? 'Are you sure you want to update this item?'
              : 'Are you sure you want to add this new item?'
            }}
          </div>
        </template>

        <template #DialogSubmitActions>
          <GButton label="Cancel" variant="text" color="primary" v-close-popup />
          <GButton :label="itemInformation ? 'Update Item' : 'Save Item'" variant="filled" color="primary" v-close-popup
            @click="addItem" />
        </template>
      </TemplateDialog>
    </q-dialog>
  </q-dialog>
</template>

<script>
import { ref } from 'vue';
import SimpleItem from './SimpleItem/SimpleItem.vue';
import VariationItem from './VariationItem/VariationItem.vue';
import TemplateDialog from '../TemplateDialog.vue';
import GButton from '../../shared/buttons/GButton.vue';
import { api } from 'src/boot/axios';

export default {
  components: {
    SimpleItem,
    VariationItem,
    TemplateDialog,
    GButton,
  },
  data: () => ({
    tab: ref('simple'),
    isSimpleItemOnDisplay: true,
    isVariationItemOnDisplay: false,
    confirm: false,
    data: null,
    componentKey: 0,
    fullItemData: null, // Store full parent + children data
  }),
  props: {
    itemInformation: {
      type: Object || null,
      default: null,
    },
    modelValue: {
      type: Boolean,
      default: false,
    },
  },
  watch: {
    dialogVisible(newVal) {
      if (newVal) {
        // Dialog is opening, trigger initialization
        this.$nextTick(() => {
          this.initialize();
        });
      }
    },
    tab(val) {
      this.isSimpleItemOnDisplay = val == 'simple';
      this.isVariationItemOnDisplay = val == 'variation';
    },
    data: {
      handler() {
      },
      deep: true,
    },
  },
  computed: {
    dialogVisible: {
      get() {
        return this.modelValue;
      },
      set(value) {
        this.$emit('update:modelValue', value);
      }
    }
  },
  methods: {
    async initialize() {
      // Force child components to re-mount and reload data
      this.componentKey++;

      // Reset data
      this.data = null;
      this.confirm = false;
      this.fullItemData = null;

      // Set appropriate tab based on item type
      if (this.itemInformation) {
        // Fetch full item data with children for variation items
        if (this.itemInformation.variationCount > 0) {
          await this.fetchFullItemData();
          this.tab = ref('variation');
          this.isVariationItemOnDisplay = true;
          this.isSimpleItemOnDisplay = false;
        } else {
          this.tab = ref('simple');
          this.isSimpleItemOnDisplay = true;
          this.isVariationItemOnDisplay = false;
        }
      } else {
        // For new items, default to simple
        this.tab = ref('simple');
        this.isSimpleItemOnDisplay = true;
        this.isVariationItemOnDisplay = false;
      }
    },
    async fetchFullItemData() {
      try {
        const { data } = await api.get(`/items/${this.itemInformation.id}/parent`);
        this.fullItemData = data;
      } catch (error) {
        console.error('Error fetching full item data:', error);
        this.handleAxiosError(error);
      }
    },
    closeDialog() {
      this.tab = ref('simple');
      this.isSimpleItemOnDisplay = false;
      this.isVariationItemOnDisplay = false;
      this.confirm = false;
      this.data = null;
      this.$emit('update:modelValue', false);
      this.$emit('close');
      this.$refs.dialog.hide();
    },
    onSimpleItemUpdate(val) {
      this.data = val;
    },
    onVariationItemUpdate(val) {
      this.data = val;
    },
    onSaveButtonClicked() {
      this.confirm = true;
    },
    async addItem() {
      this.$q.loading.show();
      try {
        const params = this.formatApiParams();
        let apiUrl =
          this.data.type === 'simple' ? '/items' : '/items/withVariants';

        if (this.itemInformation) {
          params.id = this.itemInformation.id;
          apiUrl =
            this.data.type === 'simple'
              ? '/items/update-simple-item'
              : '/items/update-variation-item/id';
        }

        const { data } = await api.post(apiUrl, params);
        this.$bus.emit('item-updated', data.data);

      } catch (error) {
        this.handleAxiosError(error);
      } finally {
        this.$q.loading.hide();
        this.closeDialog();
      }
    },
    formatApiParams() {
      const { data, type } = this.data;

      if (type === 'simple') {
        const { itemName: name, sku, description, estimatedBuyingPrice, size, tags, isDraft, uom, tiers, sellingPrice, minimumStockLevel, maximumStockLevel, categoryId, brandId, branchId, keywords, enabledInPOS, itemType, groupItems } = data;

        return {
          name,
          sku,
          description,
          estimatedBuyingPrice: Number(estimatedBuyingPrice),
          size: Number(size),
          tags,
          tiers: tiers,
          isDraft: Boolean(isDraft),
          uom: uom || 'pieces',
          sellingPrice: Number(sellingPrice),
          minimumStockLevel: Number(minimumStockLevel),
          maximumStockLevel: Number(maximumStockLevel),
          categoryId: categoryId ? Number(categoryId) : null,
          brandId: brandId ? Number(brandId) : null,
          branchId: branchId ? Number(branchId) : null,
          keywords: keywords || [],
          enabledInPOS: Boolean(enabledInPOS),
          itemType: itemType || 'INDIVIDUAL_PRODUCT',
          groupItems: itemType === 'ITEM_GROUP'
            ? (groupItems || []).map(item => ({
              itemId: item.id,
              quantity: item.quantity || 1
            }))
            : undefined,
        };
      } else if (type === 'variation') {
        const { itemName, description, tags, tiers, variations, isDraft, uom, sellingPrice, minimumStockLevel, maximumStockLevel, categoryId, brandId, branchId, keywords, enabledInPOS } =
          data;
        return {
          name: itemName,
          sku: itemName.toUpperCase().replace(/\s+/g, '-'),
          description,
          size: 0,
          isDraft: Boolean(isDraft),
          tags,
          tiers: tiers,
          sellingPrice: Number(sellingPrice),
          minimumStockLevel: Number(minimumStockLevel),
          maximumStockLevel: Number(maximumStockLevel),
          categoryId: categoryId ? Number(categoryId) : null,
          brandId: brandId ? Number(brandId) : null,
          branchId: branchId ? Number(branchId) : null,
          keywords: keywords || [],
          enabledInPOS: Boolean(enabledInPOS),
          variants: variations.map((variation) => ({
            ...(variation.id && { id: variation.id }), // Include id if exists (for updates)
            name: variation.itemName,
            sku: variation.sku,
            description: `${itemName} - ${variation.itemName}`,
            estimatedBuyingPrice: Number(variation.price),
            size: Number(variation.size),
            isDraft: Boolean(isDraft),
            variation: variation.variation,
            sellingPrice: Number(variation.sellingPrice),
            minimumStockLevel: Number(variation.minimumStockLevel),
            maximumStockLevel: Number(variation.maximumStockLevel),
          })),
          uom: uom || 'pieces',
        };
      }
    },
  },
};
</script>

<style scoped lang="scss">
:deep(.q-tab-panel) {
  padding: 0 !important;
}
</style>