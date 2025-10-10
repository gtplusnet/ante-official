<template>
  <q-dialog ref="dialog" v-model="showDialog" @before-show="fetchData">
    <TemplateDialog>
      <template #DialogTitle>
        {{ categoryData ? "Edit" : "Create" }} Item Category
      </template>
      <template #DialogContent>
        <section class="q-pa-md">
          <q-form @submit.prevent="saveCategory" class="col q-gutter-y-md">
            <div class="col-6">
              <g-input
                v-model="form.name"
                label="Category Name"
                type="text"
                required
              />
            </div>
            <div class="col-6">
              <g-input
                v-model="form.code"
                label="Category Code"
                type="text"
                required
              />
            </div>
            <div class="col-6">
              <g-input
                v-model="form.description"
                label="Description"
                type="textarea"
              />
            </div>
            <div class="col-6">
              <q-select
                v-model="form.parentId"
                :options="availableParents"
                option-label="name"
                option-value="id"
                label="Parent Category (Optional)"
                clearable
                emit-value
                map-options
                outlined
                dense
                :loading="loadingParents"
              >
                <template v-slot:option="scope">
                  <q-item v-bind="scope.itemProps">
                    <q-item-section>
                      <q-item-label>{{ scope.opt.name }}</q-item-label>
                      <q-item-label caption v-if="scope.opt.code">{{ scope.opt.code }}</q-item-label>
                    </q-item-section>
                  </q-item>
                </template>
              </q-select>
            </div>

            <div class="full-width row justify-end q-gutter-sm">
              <GButton
                label="Cancel"
                type="button"
                color="primary"
                variant="outline"
                class="text-label-large"
                v-close-popup
              />
              <GButton
                :label="categoryData ? 'Update' : 'Save'"
                type="submit"
                color="primary"
                class="text-label-large"
              />
            </div>
          </q-form>
        </section>
      </template>
    </TemplateDialog>
  </q-dialog>
</template>

<style scoped lang="scss">
.dialog-card {
  max-width: 500px;
}
</style>

<script lang="ts">
import GInput from "../../../../components/shared/form/GInput.vue";
import { api } from "src/boot/axios";
import { QDialog, useQuasar } from "quasar";
import { ref, watch } from "vue";
import { handleAxiosError } from "../../../../utility/axios.error.handler";
import { ItemCategoryDataResponse } from "@shared/response/item-category.response";
import GButton from "src/components/shared/buttons/GButton.vue";
import TemplateDialog from "src/components/dialog/TemplateDialog.vue";

export default {
  name: "AssetAddEditItemCategoryDialog",
  components: {
    GInput,
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
  emits: ["close", "saveDone", "update:modelValue"],
  setup(props, { emit }) {
    const $q = useQuasar();
    const dialog = ref<QDialog | null>(null);
    const showDialog = ref(props.modelValue);
    const form = ref<{
      name: string;
      code: string;
      description: string;
      parentId: number | null;
    }>({
      name: "",
      code: "",
      description: "",
      parentId: null,
    });
    const availableParents = ref<any[]>([]);
    const loadingParents = ref(false);

    const fetchData = async () => {
      if (props.categoryData) {
        form.value = {
          name: props.categoryData.name,
          code: props.categoryData.code,
          description: props.categoryData.description || "",
          parentId: props.categoryData.parentId || null,
        };
      } else {
        form.value = {
          name: "",
          code: "",
          description: "",
          parentId: null,
        };
      }

      // Fetch available parent categories
      await fetchParentOptions();
    };

    const fetchParentOptions = async () => {
      loadingParents.value = true;
      try {
        const params = props.categoryData?.id
          ? { excludeId: props.categoryData.id }
          : {};
        const response = await api.get("item-category/parent-options", {
          params,
        });
        availableParents.value = response.data;
      } catch (error) {
        handleAxiosError($q, error);
      } finally {
        loadingParents.value = false;
      }
    };

    const saveCategory = async () => {
      try {
        if (props.categoryData) {
          // Update
          await api.put(`item-category/${props.categoryData.id}`, form.value);
        } else {
          // Create
          await api.post("item-category", form.value);
        }
        showDialog.value = false;
        emit("saveDone");
      } catch (error) {
        handleAxiosError($q, error);
      }
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
      form,
      availableParents,
      loadingParents,
      fetchData,
      saveCategory,
    };
  },
};
</script>
