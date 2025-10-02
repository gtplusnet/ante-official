<template>
  <q-dialog ref="dialog" @before-show="fetchData">
    <TemplateDialog minWidth="400px">
      <template #DialogTitle>
        <div>{{ dialogTitle }}</div>
      </template>
      <template #DialogContent>
        <form @submit.prevent="save" class="q-px-md q-pb-md">
          <div v-if="dialogMode === 'allowance'">
            <g-input
              label="Allowance Type"
              ref="allowanceSelect"
              class="text-body-small q-mb-md"
              required
              type="select-search-with-add"
              apiUrl="/hr-configuration/allowance/select-options"
              @showAddDialog="showAllowanceAddDialog"
              v-model="formData.allowanceType"
            />
            <div>
              <label class="label">Allowance Amount</label>
              <q-input v-model.number="formData.allowanceAmount" class="q-mt-xs" type="number" min="0" dense outlined />
            </div>
          </div>

          <div v-else-if="dialogMode === 'salary'">
            <div>
              <label class="label">Adjustment Title</label>
              <q-input v-model="formData.adjustmentTitle" class="q-mt-xs q-pb-md" dense outlined />
            </div>
            <div>
              <label class="label">Adjustment Amount</label>
              <q-input
                v-model.number="formData.adjustedSalaryAmount"
                class="q-mt-xs"
                type="number"
                min="0"
                dense
                outlined
              />
            </div>
          </div>

          <div v-else-if="dialogMode === 'deduction'">
            <div>
              <label class="label">Deduction Title</label>
              <GSelect
                v-model="formData.deductionTitle"
                class="q-mt-xs q-pb-md"
                :apiUrl="'/hr-configuration/deduction/select-options'"
                :nullOption="'Select Deduction Type'"
              />
            </div>
            <div>
              <label class="label">Deduction Amount</label>
              <q-input v-model.number="formData.deductionAmount" class="q-mt-xs" type="number" min="0" dense outlined />
            </div>
          </div>
          <div class="row items-center q-gutter-sm justify-end q-pt-md">
            <q-btn outline label="Cancel" color="primary" v-close-popup />
            <q-btn label="Save" type="submit" color="primary" :loading="isSaving" :disable="!isFormValid" />
          </div>
        </form>
      </template>
    </TemplateDialog>

    <!-- Add Allowance Dialog -->
    <ManpowerAddEditAllowanceDialog
      v-model="showAddAllowanceDialog"
      :allowanceInformation="null"
      @saveDone="handleSaveAllowanceData"
    />
  </q-dialog>
</template>

<script lang="ts">
import { useQuasar } from "quasar";
import { computed, reactive, ref, nextTick } from "vue";
import GSelect from "src/components/shared/form/GSelect.vue";
import GInput from "src/components/shared/form/GInput.vue";
import TemplateDialog from "src/components/dialog/TemplateDialog.vue";
import ManpowerAddEditAllowanceDialog from "src/pages/Member/Manpower/dialogs/configuration/ManpowerAddEditAllowanceTypeDialog.vue";

export default {
  name: "AddAdjustSummaryDialog",
  components: {
    GSelect,
    GInput,
    TemplateDialog,
    ManpowerAddEditAllowanceDialog,
  },
  props: {
    dialogMode: {
      type: [String, null],
      default: null,
    },
  },

  setup(props, { emit }) {
    const $q = useQuasar();
    const isSaving = ref(false);
    const allowanceSelect = ref(null);

    const showAddAllowanceDialog = ref(false);

    const formData = reactive({
      allowanceType: null,
      allowanceAmount: 0,
      adjustmentTitle: "",
      adjustedSalaryAmount: 0,
      deductionTitle: null,
      deductionAmount: 0,
    });

    const dialogTitle = computed(() => {
      if (props.dialogMode === "allowance") return "Add Allowance";
      if (props.dialogMode === "salary") return "Adjust Salary";
      if (props.dialogMode === "deduction") return "Add Deduction";
      return "";
    });

    const isFormValid = computed(() => {
      if (props.dialogMode === "allowance") {
        return formData.allowanceType && formData.allowanceAmount > 0;
      } else if (props.dialogMode === "salary") {
        return formData.adjustmentTitle && formData.adjustedSalaryAmount > 0;
      } else if (props.dialogMode === "deduction") {
        return formData.deductionTitle && formData.deductionAmount > 0;
      }
      return false;
    });

    const handleSaveAllowanceData = async (newAllowanceData) => {
      showAddAllowanceDialog.value = false;
      
      // Debug: Log the received data
      console.log('Received new allowance data:', newAllowanceData);
      
      // Refresh the allowance type dropdown and auto-select the new allowance
      if (newAllowanceData && newAllowanceData.value) {
        
        // Use nextTick to ensure DOM has updated
        await nextTick();
        
        if (allowanceSelect.value) {
          
          if (allowanceSelect.value.refreshSelectOptions) {
            await allowanceSelect.value.refreshSelectOptions(newAllowanceData.value);
            formData.allowanceType = newAllowanceData.value;
          } else {
            if (allowanceSelect.value.reloadGSelect) {
              await allowanceSelect.value.reloadGSelect();
              await nextTick();
              if (allowanceSelect.value.setAutoSelect) {
                await allowanceSelect.value.setAutoSelect(newAllowanceData.value);
              }
              formData.allowanceType = newAllowanceData.value;
            }
          }
        } else {
        }
      } else {
        console.log('No valid new allowance data received');
      }
    };

    const showAllowanceAddDialog = () => {
      showAddAllowanceDialog.value = true;
    };

    const save = () => {
      if (!isFormValid.value) {
        $q.notify({
          type: "negative",
          message: "Please fill in all required fields",
        });
        return;
      }

      if (props.dialogMode === "allowance") {
        emit("save-data", {
          type: "allowance",
          data: {
            configurationId: formData.allowanceType,
            title: "", // Will be set from the selected allowance name
            amount: formData.allowanceAmount,
          },
        });
      } else if (props.dialogMode === "salary") {
        emit("save-data", {
          type: "salary",
          data: {
            title: formData.adjustmentTitle,
            amount: formData.adjustedSalaryAmount,
          },
        });
      } else if (props.dialogMode === "deduction") {
        emit("save-data", {
          type: "deduction",
          data: {
            configurationId: formData.deductionTitle,
            title: "", // Will be set from the selected deduction name
            amount: formData.deductionAmount,
          },
        });
      }
    };

    const fetchData = () => {
      if (props.dialogMode === "allowance") {
        formData.allowanceType = null;
        formData.allowanceAmount = 0;
      } else if (props.dialogMode === "salary") {
        formData.adjustmentTitle = "";
        formData.adjustedSalaryAmount = 0;
      } else if (props.dialogMode === "deduction") {
        formData.deductionTitle = null;
        formData.deductionAmount = 0;
      }
    };

    return {
      allowanceSelect,
      showAddAllowanceDialog,
      showAllowanceAddDialog,
      handleSaveAllowanceData,
      formData,
      dialogTitle,
      isFormValid,
      isSaving,
      save,
      fetchData,
    };
  },
};
</script>
