<template>
  <q-dialog ref="dialog" @before-show="fetchData">
    <TemplateDialog minWidth="400px">
      <template #DialogTitle>
        <div>{{ employeeDeductionData ? "Edit" : "Create" }} Deduction</div>
      </template>
      <template #DialogContent>
        <section>
          <q-form @submit.prevent="save" class="q-pa-md">
            <div>
              <g-input
                :type="!employeeDeductionData ? 'text' : 'readonly'"
                :class="!employeeDeductionData ? '' : 'q-pb-md'"
                label="Deduction Type"
                v-model="form.deductionType"
              />
            </div>
            <div
              v-if="
                employeeDeductionData?.deductionConfiguration.category
                  .hasTotalAmount == true
              "
            >
              <label class="text-label-large">Loan Amount</label>
              <q-input
                readonly
                class="q-pt-xs q-pb-md text-body-medium"
                type="number"
                min="0"
                v-model="form.loanAmount"
                dense
                outlined
              />
            </div>
            <div>
              <label class="text-label-large">Monthly Amortization</label>

              <q-input
                class="q-pt-xs q-pb-md text-body-medium"
                type="number"
                min="0"
                v-model="form.monthlyAmortization"
                dense
                outlined
              />
            </div>
            <div>
              <label class="text-label-large">Deduction Period</label>
              <q-select
                readonly
                class="q-pt-xs q-pb-md text-body-medium"
                v-model="form.deductionPeriod"
                :options="deductionPeriodList"
                option-value="key"
                option-label="label"
                emit-value
                map-options
                dense
                outlined
              />
            </div>
            <div>
              <g-input
                type="readonly"
                label="Effectivity Date"
                v-model="form.effectivityDate"
              />
            </div>
            <div class="row justify-end q-pt-md q-gutter-sm">
              <GButton
                label="Cancel"
                type="button"
                color="primary"
                variant="outline"
                class="text-label-large"
                v-close-popup
              />
              <GButton
                :label="employeeDeductionData ? 'Update' : 'Save'"
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

<style>
.deduction-dialog {
  min-width: 400px;
}
</style>

<script lang="ts">
import { QDialog, useQuasar } from "quasar";
import { api } from "src/boot/axios";
import GInput from "../../../../../components/shared/form/GInput.vue";
import { handleAxiosError } from "../../../../../utility/axios.error.handler";
import { onMounted, ref, PropType } from "vue";
import { defineAsyncComponent } from 'vue';
import {
  DeductionPeriod,
  UpdateDeductionPlanConfigurationRequest,
} from "@shared/request";
import { DeductionPlanConfigurationDataResponse } from "@shared/response";
import GButton from "src/components/shared/buttons/GButton.vue";

// Lazy-loaded dialogs (ALL dialogs must be lazy loaded - CLAUDE.md)
const TemplateDialog = defineAsyncComponent(() =>
  import('src/components/dialog/TemplateDialog.vue')
);

function formatDateForSubmit(date: string): string {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(d.getDate()).padStart(2, "0")}`;
}

export default {
  name: "AddEditDeductionDialog",
  components: {
    GInput,
    TemplateDialog,
    GButton,
  },
  props: {
    employeeDeductionData: {
      type: Object as PropType<DeductionPlanConfigurationDataResponse | null>,
      default: null,
    },
  },

  setup(props, { emit }) {
    const $q = useQuasar();
    const dialog = ref<InstanceType<typeof QDialog> | null>(null);
    const form = ref({
      deductionType: "",
      loanAmount: "",
      monthlyAmortization: "",
      deductionPeriod: "",
      effectivityDate: "",
    });
    const deductionPeriodList = ref<{ label: string; key: string }[]>([]);

    onMounted(() => {
      fetchDeductionPeriod();
    });

    const fetchDeductionPeriod = () => {
      $q.loading.show();
      api
        .get("hr-configuration/deduction/plan/cutoff-period-type")
        .then((response) => {
          if (response.data) {
            deductionPeriodList.value = (response.data || []).map(
              (item: { label: string; key: string }) => ({
                label: item.label,
                key: item.key,
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

    const save = async () => {
      $q.loading.show();

      if (props.employeeDeductionData) {
        await apiUpdate();
      } else {
        await apiSave();
      }
    };

    const apiSave = () => {};

    const apiUpdate = () => {
      if (!props.employeeDeductionData) return;

      $q.loading.show();
      const updateParams: UpdateDeductionPlanConfigurationRequest = {
        id: props.employeeDeductionData.id,
        employeeAccountId: props.employeeDeductionData.accountInformation.id,
        loanAmount: Number(form.value.loanAmount),
        monthlyAmortization: Number(form.value.monthlyAmortization),
        deductionPeriod: form.value.deductionPeriod as DeductionPeriod,
        effectivityDate: formatDateForSubmit(form.value.effectivityDate),
        deductionConfigurationId: Number(
          props.employeeDeductionData.deductionConfiguration.id
        ),
      };

      api
        .patch("/hr-configuration/deduction/plan", updateParams)
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
    };

    const fetchData = () => {
      $q.loading.show();
      if (props.employeeDeductionData) {
        form.value.deductionType =
          props.employeeDeductionData.deductionConfiguration.name;
        form.value.loanAmount = String(
          props.employeeDeductionData.totalAmount.raw
        );
        form.value.monthlyAmortization = String(
          props.employeeDeductionData.monthlyAmortization.raw
        );
        form.value.deductionPeriod =
          props.employeeDeductionData.deductionPeriod.key;
        form.value.effectivityDate =
          props.employeeDeductionData.effectivityDate.dateFull;
      } else {
        form.value = {
          deductionType: "",
          loanAmount: "",
          monthlyAmortization: "",
          deductionPeriod: "",
          effectivityDate: "",
        };
      }

      $q.loading.hide();
    };

    return {
      form,
      dialog,
      deductionPeriodList,
      fetchData,
      save,
    };
  },
};
</script>
