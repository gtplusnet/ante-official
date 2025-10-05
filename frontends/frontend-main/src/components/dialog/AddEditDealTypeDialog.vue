<template>
  <q-dialog ref="dialog" @before-show="initForm">
    <TemplateDialog minWidth="500px" maxWidth="600px">
      <template #DialogIcon>
        <q-icon name="o_category" />
      </template>
      <template #DialogTitle>
        {{ editMode ? "Edit" : "Add New" }} Deal Type
      </template>
      <template #DialogContent>
        <q-form @submit.prevent="saveDealType" class="q-px-md q-pb-md">
          <div class="row">
            <div class="col-12">
              <g-input 
                v-model="form.typeName" 
                label="Deal Type Name" 
                type="text" 
                required 
                :rules="[(val: string) => val && val.length > 0 || 'Deal type name is required']"
              />
            </div>
          </div>

          <!-- Actions -->
          <div class="text-right q-mt-lg">
            <GButton 
              no-caps 
              class="q-mr-sm" 
              variant="tonal" 
              label="Cancel" 
              type="button" 
              color="light-grey" 
              v-close-popup 
            />
            <GButton
              no-caps
              :label="editMode ? 'Update' : 'Save'"
              type="submit"
              color="primary"
              :loading="saving"
            />
          </div>
        </q-form>
      </template>
    </TemplateDialog>
  </q-dialog>
</template>

<style scoped lang="scss">
// Custom styles for AddEditDealTypeDialog
</style>

<script lang="ts">
import { defineComponent, ref } from "vue";
import { defineAsyncComponent } from 'vue';
import { QDialog, useQuasar } from "quasar";
import { getCurrentInstance } from 'vue';
import GInput from "../shared/form/GInput.vue";
import GButton from "../shared/buttons/GButton.vue";

// Lazy-loaded dialogs (ALL dialogs must be lazy loaded - CLAUDE.md)
const TemplateDialog = defineAsyncComponent(() =>
  import('./TemplateDialog.vue')
);

interface DealTypeForm {
  typeName: string;
}

export default defineComponent({
  name: "AddEditDealTypeDialog",
  components: {
    GInput,
    GButton,
    TemplateDialog,
  },
  props: {
    dealTypeData: {
      type: Object,
      default: null,
    },
  },
  emits: ["close", "created", "updated"],
  setup(props, { emit }) {
    const $q = useQuasar();
    const { proxy } = getCurrentInstance() as any;
    const dialog = ref<InstanceType<typeof QDialog>>();
    const saving = ref(false);
    
    const form = ref<DealTypeForm>({
      typeName: "",
    });

    const editMode = ref(false);
    const dealTypeId = ref<number | null>(null);

    const initForm = () => {
      if (props.dealTypeData && props.dealTypeData.id) {
        // Edit mode
        editMode.value = true;
        dealTypeId.value = props.dealTypeData.id;
        form.value.typeName = props.dealTypeData.typeName || "";
      } else {
        // Create mode
        editMode.value = false;
        dealTypeId.value = null;
        form.value.typeName = "";
      }
    };

    const saveDealType = async () => {
      if (!form.value.typeName.trim()) {
        $q.notify({
          color: "negative",
          message: "Please enter a deal type name",
          position: "top",
        });
        return;
      }

      saving.value = true;
      
      try {
        const payload = {
          typeName: form.value.typeName.trim(),
        };

        let response;
        if (editMode.value && dealTypeId.value) {
          // Update existing deal type
          response = await proxy.$api.put(`/deal-type/${dealTypeId.value}`, payload);
          emit("updated", response.data);
          $q.notify({
            color: "positive",
            message: "Deal type updated successfully",
            position: "top",
          });
        } else {
          // Create new deal type
          response = await proxy.$api.post("/deal-type", payload);
          emit("created", response.data);
          $q.notify({
            color: "positive",
            message: "Deal type created successfully",
            position: "top",
          });
        }

        if (dialog.value) {
          dialog.value.hide();
        }
        emit("close");
      } catch (error: any) {
        console.error("Failed to save deal type:", error);
        $q.notify({
          color: "negative",
          message: error.response?.data?.message || "Failed to save deal type",
          position: "top",
        });
      } finally {
        saving.value = false;
      }
    };

    const show = () => {
      if (dialog.value) {
        dialog.value.show();
      }
    };

    const hide = () => {
      if (dialog.value) {
        dialog.value.hide();
      }
    };

    return {
      dialog,
      form,
      editMode,
      saving,
      initForm,
      saveDealType,
      show,
      hide,
    };
  },
});
</script>