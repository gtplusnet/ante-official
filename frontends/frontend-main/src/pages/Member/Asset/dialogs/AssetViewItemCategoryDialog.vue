<template>
  <q-dialog ref="dialog" v-model="showDialog">
    <TemplateDialog>
      <template #DialogTitle>
        Category Details
      </template>
      <template #DialogContent>
        <section class="q-pa-md" v-if="categoryData">
          <div class="q-gutter-y-md">
            <div class="row q-col-gutter-md">
              <div class="col-6">
                <div class="text-caption text-grey-7">Category Name</div>
                <div class="text-body1 text-weight-medium">{{ categoryData.name }}</div>
              </div>
              <div class="col-6">
                <div class="text-caption text-grey-7">Category Code</div>
                <div class="text-body1 text-weight-medium">
                  <q-badge color="primary">{{ categoryData.code }}</q-badge>
                </div>
              </div>
            </div>

            <div v-if="categoryData.description">
              <div class="text-caption text-grey-7">Description</div>
              <div class="text-body2">{{ categoryData.description }}</div>
            </div>

            <div class="row q-col-gutter-md">
              <div class="col-6" v-if="categoryData.parent">
                <div class="text-caption text-grey-7">Parent Category</div>
                <div class="text-body2">
                  {{ categoryData.parent.name }} ({{ categoryData.parent.code }})
                </div>
              </div>
              <div class="col-6" v-if="categoryData.childrenCount">
                <div class="text-caption text-grey-7">Sub-categories</div>
                <div class="text-body2">{{ categoryData.childrenCount }}</div>
              </div>
            </div>

            <div class="row q-col-gutter-md q-mt-md">
              <div class="col-6">
                <div class="text-caption text-grey-7">Status</div>
                <div class="text-body2">
                  <q-badge :color="categoryData.isActive ? 'positive' : 'negative'">
                    {{ categoryData.isActive ? 'Active' : 'Inactive' }}
                  </q-badge>
                </div>
              </div>
            </div>

            <div class="row q-col-gutter-md">
              <div class="col-6">
                <div class="text-caption text-grey-7">Created At</div>
                <div class="text-body2">{{ formatDate(categoryData.createdAt) }}</div>
              </div>
              <div class="col-6">
                <div class="text-caption text-grey-7">Updated At</div>
                <div class="text-body2">{{ formatDate(categoryData.updatedAt) }}</div>
              </div>
            </div>

            <div class="full-width row justify-end q-gutter-sm q-mt-md">
              <GButton
                label="Close"
                type="button"
                color="primary"
                variant="outline"
                class="text-label-large"
                v-close-popup
              />
              <GButton
                label="Edit"
                type="button"
                color="primary"
                class="text-label-large"
                @click="handleEdit"
              />
            </div>
          </div>
        </section>
      </template>
    </TemplateDialog>
  </q-dialog>
</template>

<style scoped lang="scss">
.text-caption {
  font-size: 12px;
  margin-bottom: 4px;
}
</style>

<script lang="ts">
import { ref, watch } from "vue";
import { QDialog } from "quasar";
import { ItemCategoryDataResponse } from "@shared/response/item-category.response";
import GButton from "src/components/shared/buttons/GButton.vue";
import TemplateDialog from "src/components/dialog/TemplateDialog.vue";

export default {
  name: "AssetViewItemCategoryDialog",
  components: {
    GButton,
    TemplateDialog,
  },
  props: {
    categoryData: {
      type: Object as () => ItemCategoryDataResponse | null,
      default: null,
    },
    modelValue: {
      type: Boolean,
      default: false,
    },
  },
  emits: ["close", "edit", "update:modelValue"],
  setup(props, { emit }) {
    const dialog = ref<QDialog | null>(null);
    const showDialog = ref(props.modelValue);

    const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    const handleEdit = () => {
      emit("edit", props.categoryData);
      showDialog.value = false;
      emit("update:modelValue", false);
    };

    watch(
      () => props.modelValue,
      (newVal) => {
        showDialog.value = newVal;
      }
    );

    watch(showDialog, (newVal) => {
      emit("update:modelValue", newVal);
      if (!newVal) {
        emit("close");
      }
    });

    return {
      dialog,
      showDialog,
      formatDate,
      handleEdit,
    };
  },
};
</script>
