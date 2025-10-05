<template>
  <q-dialog ref="dialog" @hide="fetchData">
    <TemplateDialog>
      <template #DialogTitle>
        {{ deductionData ? "Edit" : "Add" }} {{ dialogMode }}
      </template>
      <template #DialogContent>
        <form @submit.prevent="save" class="q-pa-md">
          <div v-if="dialogMode === 'Deduction Type'">
            <div>
              <g-input
                required
                type="text"
                label="Deduction Type"
                v-model="formData.deductionTitle"
              />
            </div>
          </div>
          <div v-else-if="dialogMode === 'Deduction Sub-Type'">
            <div>
              <g-input
                required
                type="text"
                label="Deduction Sub-Type"
                v-model="formData.deductionSubTitle"
              />
            </div>
          </div>
          <div>
            <label class="text-label-large">Deduction Category</label>
            <q-select
              :readonly="!!deductionData || dialogMode === 'Deduction Sub-Type'"
              outlined
              dense
              v-model="formData.deductionCategory"
              :options="deductionCategoryList"
              option-value="value"
              option-label="label"
              emit-value
              map-options
              class="full-width q-pt-xs"
              required
            />
          </div>
          <div class="row items-center q-mt-md q-gutter-sm justify-end">
            <GButton
              label="Cancel"
              color="primary"
              variant="outline"
              class="text-label-large"
              v-close-popup
            />
            <GButton
              :label="deductionData ? 'Update' : 'Save'"
              type="submit"
              color="primary"
              class="text-label-large"
            />
          </div>
        </form>
      </template>
    </TemplateDialog>
  </q-dialog>
</template>

<script lang="ts">
import { QDialog, useQuasar } from "quasar";
import { api } from "src/boot/axios";
import GInput from "../../../../../components/shared/form/GInput.vue";
import { handleAxiosError } from "../../../../../utility/axios.error.handler";
import { onMounted, reactive, ref, PropType } from "vue";
import { defineAsyncComponent } from 'vue';
import { DeductionConfigurationDataResponse } from "@shared/response";
import GButton from "src/components/shared/buttons/GButton.vue";

// Lazy-loaded dialogs (ALL dialogs must be lazy loaded - CLAUDE.md)
const TemplateDialog = defineAsyncComponent(() =>
  import('src/components/dialog/TemplateDialog.vue')
);

export default {
  name: "AddDeductionTypeDialog",
  components: {
    GInput,
    TemplateDialog,
    GButton,
  },
  props: {
    dialogMode: {
      type: String as PropType<string | null>,
      default: null,
    },
    deductionParent: {
      type: Object as PropType<DeductionConfigurationDataResponse | null>,
      default: null,
    },
    deductionData: {
      type: Object as PropType<DeductionConfigurationDataResponse | null>,
      default: null,
    },
  },

  setup(props, { emit }) {
    const $q = useQuasar();
    const dialog = ref<InstanceType<typeof QDialog> | null>(null);
    const deductionCategory = ref(null);
    const deductionCategoryList = ref<{ label: string; value: string }[]>([]);
    const formData = reactive({
      deductionTitle: "",
      deductionSubTitle: "",
      deductionCategory: "",
    });

    onMounted(() => {
      fetchDeductionCategoryList();
    });

    const save = async () => {
      if (props.deductionData) {
        await apiUpdate();
      } else {
        await apiSave();
      }
    };

    const apiSave = () => {
      $q.loading.show();

      if (props.dialogMode === "Deduction Type") {
        const parentParams = {
          name: formData.deductionTitle,
          deductionCategory: formData.deductionCategory,
        };
        api
          .post("/hr-configuration/deduction", parentParams)
          .then(() => {
            if (dialog.value) {
              dialog.value.hide();
            }
            emit("saveDone");
          })
          .catch((error) => {
            handleAxiosError($q, error);
          })
          .finally(() => {
            $q.loading.hide();
          });
      } else {
        const childParams = {
          name: formData.deductionSubTitle,
          parentDeduction: props.deductionParent?.id,
          deductionCategory: formData.deductionCategory,
        };
        api
          .post("/hr-configuration/deduction", childParams)
          .then(() => {
            if (dialog.value) {
              dialog.value.hide();
            }
            emit("saveDone");
          })
          .finally(() => {
            $q.loading.hide();
          });
      }
    };

    const apiUpdate = () => {
      $q.loading.show();

      if (props.dialogMode === "Deduction Type") {
        const updateParentParams = {
          id: props.deductionData?.id,
          name: formData.deductionTitle,
          deductionCategory: formData.deductionCategory,
        };
        api
          .patch("hr-configuration/deduction", updateParentParams)
          .then(() => {
            if (dialog.value) {
              dialog.value.hide();
            }
            emit("saveDone");
          })
          .finally(() => {
            $q.loading.hide();
          });
      } else {
        const updateChildParams = {
          id: props.deductionData?.id,
          name: formData.deductionSubTitle,
          deductionCategory: formData.deductionCategory,
        };
        api
          .patch("hr-configuration/deduction", updateChildParams)
          .then(() => {
            if (dialog.value) {
              dialog.value.hide();
            }
            emit("saveDone");
          })
          .finally(() => {
            $q.loading.hide();
          });
      }
    };

    const fetchDeductionCategoryList = () => {
      $q.loading.show();
      api
        .get("hr-configuration/deduction/categories")
        .then((response) => {
          if (response.data) {
            deductionCategoryList.value = (response.data || []).map(
              (item: { value: string; key: string }) => ({
                label: item.value,
                value: item.key,
              })
            );
          }
        })
        .catch((error) => {
          handleAxiosError($q, error);
        })
        .finally(() => {
          $q.loading.hide();
        });
    };

    const fetchData = () => {
      $q.loading.show();
      if (props.deductionData) {
        formData.deductionTitle = props.deductionData.name;
        formData.deductionSubTitle = props.deductionData.name;
        formData.deductionCategory =
          props.deductionData.category?.key || "LOAN";
      } else if (props.deductionParent) {
        formData.deductionCategory =
          props.deductionParent.category?.key || "LOAN";
        formData.deductionTitle = "";
        formData.deductionSubTitle = "";
      } else {
        formData.deductionTitle = "";
        formData.deductionSubTitle = "";
        formData.deductionCategory = "LOAN";
      }
      $q.loading.hide();
    };

    return {
      dialog,
      formData,
      deductionCategory,
      deductionCategoryList,
      save,
      fetchData,
    };
  },
};
</script>
