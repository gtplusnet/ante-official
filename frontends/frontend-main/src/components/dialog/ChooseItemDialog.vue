<template>
  <q-dialog ref="dialog" @before-show="fetchData">
    <TemplateDialog
      size="lg"
      :scrollable="true"
      :icon="'o_inventory'"
      :iconColor="'primary'"
    >
      <!-- Dialog Title -->
      <template #DialogTitle> Choose Item </template>

      <!-- Dialog Content -->
      <template #DialogContent>
        <section class="q-pa-md">
          <div class="text-right q-mb-sm">
            <GButton
              label="Add Item"
              icon="add"
              variant="filled"
              color="primary"
              @click="this.$refs.itemTable.addItem()"
            />
          </div>
          <SimpleItemTable
            ref="itemTable"
            :emitKey="emitKey"
            :hideItemGroups="true"
            @select="selectItem"
            tab="select"
          />
        </section>
      </template>
    </TemplateDialog>

    <!-- Choose Variation Dialog -->
    <q-dialog v-model="isChooseVariantDialog">
      <TemplateDialog
        size="sm"
        :scrollable="true"
        :icon="'o_check'"
        :iconColor="'primary'"
      >
        <template #DialogTitle> Choose Variation </template>

        <template #DialogContent>
          <div class="q-pa-md">
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
            <div
              v-if="variationItemInformation"
              class="text-center q-pa-md text-body-medium"
            >
              {{ variationItemInformation.name }} ({{
                variationItemInformation.sku
              }})
            </div>
          </div>
        </template>

        <template #DialogSubmitActions>
          <GButton
            label="Submit"
            variant="filled"
            color="primary"
            :disable="!variationItemInformation"
            @click="submitVariationItem"
          />
        </template>
      </TemplateDialog>
    </q-dialog>

    <!-- Quantity Dialog -->
    <q-dialog v-model="isQuantityDialog">
      <TemplateDialog
        size="sm"
        :scrollable="false"
        :icon="'o_inventory'"
        :iconColor="'primary'"
      >
        <template #DialogTitle> Set Quantity </template>

        <template #DialogContent>
          <div class="q-pa-md">
            <div v-if="selectedItemForQuantity" class="q-mb-md">
              <div class="text-body-medium">
                {{ selectedItemForQuantity.name }}
              </div>
              <div class="text-caption text-grey">
                {{ selectedItemForQuantity.sku }}
              </div>
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
          </div>
        </template>

        <template #DialogSubmitActions>
          <GButton
            label="Add Item"
            variant="filled"
            color="primary"
            @click="submitItemWithQuantity"
            block
          />
        </template>
      </TemplateDialog>
    </q-dialog>
  </q-dialog>
</template>

<style scoped lang="scss"></style>

<script>
import SimpleItemTable from "../../components/tables/SimpleItemTable.vue";
import TemplateDialog from "./TemplateDialog.vue";
import GButton from "../shared/buttons/GButton.vue";
import { api } from "src/boot/axios";

export default {
  name: "ChooseItemDialog",
  props: {
    emitKey: {
      type: String,
      default: "",
    },
    isItemGroup: {
      type: Boolean,
      default: false,
    },
  },
  components: {
    SimpleItemTable,
    TemplateDialog,
    GButton,
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
        this.$bus.emit("chooseItem", this.variationItemInformation);
        this.$emit("chooseItem", this.variationItemInformation);
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
          this.$bus.emit("chooseItem", itemData);
          this.$emit("chooseItem", itemData);
          this.$refs.dialog.hide();
        }
      }
    },
    loadVariant() {
      this.$q.loading.show();
      api
        .post("/items/get-variation-item", {
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
        quantity: this.itemQuantity,
      };
      console.log(itemWithQuantity);
      this.$bus.emit("chooseItem", itemWithQuantity);
      this.$emit("chooseItem", itemWithQuantity);

      this.isQuantityDialog = false;
      this.$refs.dialog.hide();
    },
  },
};
</script>
