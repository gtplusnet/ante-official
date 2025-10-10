<template>
  <q-dialog ref="dialog" @before-show="fetchData">
    <q-card class="full-width dialog-card">
      <q-bar class="bg-primary text-white cursor-default" dark>
        <q-icon name="o_inventory" />
        <div class="text-title-medium">Choose Item</div>

        <q-space />

        <q-btn dense flat icon="close" v-close-popup>
          <q-tooltip class="text-label-small" >Close</q-tooltip>
        </q-btn>
      </q-bar>

      <q-card-section>
        <div class="text-right q-mb-sm">
          <q-btn
            @click="this.$refs.itemTable.addItem()"
            color="primary"
            unelevated
            ><q-icon name="add" size="16px" class="q-mr-xs text-body-medium"></q-icon> Add
            Item</q-btn
          >
        </div>
        <SimpleItemTable
          ref="itemTable"
          :emitKey="emitKey"
          :hideItemGroups="true"
          @select="selectItem"
          tab="select"
        />
      </q-card-section>

      <!-- select variation dialog -->
      <q-dialog v-model="isChooseVariantDialog">
        <q-card class="full-width dialog-card-variant">
          <q-bar class="bg-primary text-white cursor-default" dark>
            <q-icon name="o_check" />
            <div class="text-title-medium">Choose Variation</div>

            <q-space />

            <q-btn
              dense
              flat
              icon="close"
              @click="isChooseVariantDialog = false"
            >
              <q-tooltip class="text-label-small">Close</q-tooltip>
            </q-btn>
          </q-bar>

          <q-card-section>
            <div v-for="item in variations" :key="item">
              <div class="q-mb-xs">
                {{ this.capitalizeFirstLetter(item.name) }}
              </div>
              <div class="q-mb-sm">
                <q-select
                  v-model="item.value"
                  dense
                  outlined
                  :options="item.itemTierAttribute"
                  option-label="attributeKey"
                  option-value="id"
                  class="text-body-medium"
                ></q-select>
              </div>
            </div>
            <div class="column justify-end q-mt-md">
              <div v-if="variationItemInformation" class="text-center q-pa-md text-body-medium">
                {{ variationItemInformation.name }} ({{
                  variationItemInformation.sku
                }})
              </div>
              <q-btn
                @click="submitVariationItem"
                :disabled="!variationItemInformation"
                unelevated
                color="primary"
                class="text-body-medium"
                label="Submit"
              />
            </div>
          </q-card-section>
        </q-card>
      </q-dialog>

      <!-- Quantity Dialog -->
      <q-dialog v-model="isQuantityDialog">
        <q-card style="max-width: 400px; min-width: 350px">
          <q-bar class="bg-primary text-white cursor-default" dark>
            <q-icon name="o_inventory" />
            <div class="text-title-medium">Set Quantity</div>
            <q-space />
            <q-btn dense flat icon="close" @click="isQuantityDialog = false">
              <q-tooltip class="text-label-small">Close</q-tooltip>
            </q-btn>
          </q-bar>

          <q-card-section>
            <div v-if="selectedItemForQuantity" class="q-mb-md">
              <div class="text-body-medium">{{ selectedItemForQuantity.name }}</div>
              <div class="text-caption text-grey">{{ selectedItemForQuantity.sku }}</div>
            </div>

            <q-input
              v-model.number="itemQuantity"
              type="number"
              label="Quantity"
              outlined
              dense
              :min="1"
              class="text-body-medium"
            />

            <q-btn
              @click="submitItemWithQuantity"
              color="primary"
              unelevated
              class="text-body-medium full-width q-mt-md"
              label="Add Item"
            />
          </q-card-section>
        </q-card>
      </q-dialog>
    </q-card>
  </q-dialog>
</template>

<style scoped lang="scss">
.dialog-card {
  max-width: 1000px;
  min-height: 600px;
}

.dialog-card-variant {
  max-width: 600px;
  min-height: 300px;
}
</style>

<script>
import SimpleItemTable from "../../components/tables/SimpleItemTable.vue";
import { api } from 'src/boot/axios';

export default {
  name: 'ChooseItemDialog',
  props: {
    emitKey: {
      type: String,
      default: '',
    },
    isItemGroup: {
      type: Boolean,
      default: false,
    },
  },
  components: {
    SimpleItemTable,
  },
  data: () => ({
    isChooseVariantDialog: false,
    isQuantityDialog: false,
    variationItemInformation: null,
    itemData: null,
    optionValue: [],
    variations: [],
    selectedItemForQuantity: null,
    itemQuantity: 1,
  }),
  watch: {
    variations: {
      handler() {
        this.loadVariant();
      },
      deep: true,
    },
  },
  methods: {
    submitVariationItem() {
      this.isChooseVariantDialog = false;

      if (this.isItemGroup) {
        // Show quantity dialog for variation item
        this.variationItemInformation.emitKey = this.emitKey;
        this.selectedItemForQuantity = this.variationItemInformation;
        this.itemQuantity = 1;
        this.isQuantityDialog = true;
      } else {
        // Original behavior - direct emit
        this.variationItemInformation.emitKey = this.emitKey;
        this.$bus.emit('chooseItem', this.variationItemInformation);
        this.$emit('chooseItem', this.variationItemInformation);
        this.$refs.dialog.hide();
      }
    },
    selectItem(itemData) {
      if (itemData.variationCount > 0) {
        this.itemData = itemData;
        this.variations = this.formatVariations(itemData.variations);
        this.isChooseVariantDialog = true;
      } else {
        // Show quantity dialog if in item group mode
        if (this.isItemGroup) {
          this.selectedItemForQuantity = itemData;
          this.itemQuantity = 1;
          this.isQuantityDialog = true;
        } else {
          // Default behavior - direct emit
          this.$bus.emit('chooseItem', itemData);
          this.$emit('chooseItem', itemData);
          this.$refs.dialog.hide();
        }
      }
    },
    loadVariant() {
      this.$q.loading.show();
      api
        .post('/items/get-variation-item', {
          itemId: this.itemData.id,
          variations: this.variations,
        })
        .then((response) => {
          this.optionValue = response;
          this.variationItemInformation = response.data;
        })
        .catch((error) => {
          console.error(error);
        })
        .finally(() => {
          this.$q.loading.hide();
        });
    },
    formatVariations(variations) {
      variations.forEach((variation) => {
        variation.itemTierAttribute = variation.itemTierAttribute.map(
          (attribute) => ({
            id: attribute.id,
            attributeKey: attribute.attributeKey.toUpperCase(),
          })
        );

        variation.value = variation.itemTierAttribute[0];
      });

      return variations;
    },
    fetchData() {},
    submitItemWithQuantity() {
      const itemWithQuantity = {
        ...this.selectedItemForQuantity,
        quantity: this.itemQuantity
      };
      console.log(itemWithQuantity);
      this.$bus.emit('chooseItem', itemWithQuantity);
      this.$emit('chooseItem', itemWithQuantity);

      this.isQuantityDialog = false;
      this.$refs.dialog.hide();
    },
  },
};
</script>
