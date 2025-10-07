<template>
  <q-dialog v-model="dialogVisible" @before-show="initialize" ref="dialog">
    <div class="q-pa-md q-gutter-sm" style="width: 700px; max-width: 80vw">
      <div class="q-gutter-y-md" style="max-width: 600px">
        <q-card>
          <q-tabs v-if="!itemInformation" v-model="tab" dense class="text-grey" active-color="primary"
            indicator-color="primary" align="justify" narrow-indicator>
            <q-tab name="simple" label="Simple Item"/>
            <q-tab name="variation" label="Variation Item" />
          </q-tabs>
          <div v-else>
            <div class="bg-primary text-white" style="border-radius:  8px 8px 0px 0px;">
              <div class="text-title-medium q-pa-sm">Item Information</div>
            </div>
          </div>

          <q-separator />
          <q-card-section>
            <q-tab-panels v-model="tab" animated>
              <q-tab-panel name="simple">
                <simple-item 
                  :key="componentKey"
                  :v-model="isSimpleItemOnDisplay" 
                  :itemInformation="itemInformation"
                  @onFormUpdate="onSimpleItemUpdate" />
              </q-tab-panel>
              <q-tab-panel name="variation">
                <variation-item 
                  :key="componentKey"
                  :v-model="isVariationItemOnDisplay" 
                  :itemInformation="itemInformation"
                  @onFormUpdate="onVariationItemUpdate" />
              </q-tab-panel>
            </q-tab-panels>
          </q-card-section>
          <q-card-actions align="right">
            <q-btn flat label="Cancel" color="primary" v-close-popup class="text-label-large" />
            <q-btn :label="itemInformation ? 'Update Item' : 'Save Item'" color="primary"
              @click="onSaveButtonClicked" class="text-label-large" />
            <q-dialog v-model="confirm" persistent>
              <q-card>
                <q-card-section class="row items-center">
                  <span class="q-ml-sm text-body-medium">{{ itemInformation ? 'Are you sure you want to update this item?' : 'Are you sure you want to add this new item?' }}</span>
                </q-card-section>
                <q-card-actions align="right">
                  <q-btn flat label="Cancel" color="primary" v-close-popup class="text-label-large"/>
                  <q-btn flat :label="itemInformation ? 'Update Item' : 'Save Item'" color="primary" class="text-label-large" v-close-popup
                    @click="addItem" />
                </q-card-actions>
              </q-card>
            </q-dialog>
          </q-card-actions>
        </q-card>
      </div>
    </div>
  </q-dialog>
</template>
<script>
import { ref } from 'vue';
import SimpleItem from './SimpleItem/SimpleItem.vue';
import VariationItem from './VariationItem/VariationItem.vue';
import { api } from 'src/boot/axios';

export default {
  components: {
    SimpleItem,
    VariationItem,
  },
  data: () => ({
    tab: ref('simple'),
    isSimpleItemOnDisplay: true,
    isVariationItemOnDisplay: false,
    confirm: false,
    data: null,
    componentKey: 0,
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
    initialize() {
      // Force child components to re-mount and reload data
      this.componentKey++;
      
      // Reset data
      this.data = null;
      this.confirm = false;
      
      // Set appropriate tab based on item type
      if (this.itemInformation) {
        if (this.itemInformation.variationCount > 0) {
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

        this.$q.notify({
          color: 'positive',
          message: data.message,
          position: 'top',
        });

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
        const { itemName: name, sku, description, estimatedBuyingPrice, size, tags, isDraft, uom, tiers, sellingPrice, minimumStockLevel, maximumStockLevel, categoryId, brandId, branchId, keywords, enabledInPOS } = data;

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
