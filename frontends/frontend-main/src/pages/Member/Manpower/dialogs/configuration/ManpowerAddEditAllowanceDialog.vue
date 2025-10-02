<template>
  <q-dialog ref="dialog" @before-show="fetchData">
    <TemplateDialog>
      <template #DialogTitle>
        {{ employeeAllowanceData ? "Edit" : "Create" }} Allowance ({{
          employeeAllowanceData?.accountInformation.fullName
        }})
      </template>
      <template #DialogContent>
        <q-form @submit.prevent="save" class="q-pa-md">
          <div>
            <g-input
              :type="!employeeAllowanceData ? 'text' : 'readonly'"
              :class="!employeeAllowanceData ? '' : 'q-pb-md'"
              label="Allowance Type"
              v-model="form.allowanceType"
            />
          </div>
          <div>
            <label class="label text-label-large">Allowance Amount</label>
            <q-input
              class="q-pt-xs q-pb-md text-body-medium"
              type="number"
              min="0"
              v-model="form.allowanceAmount"
              dense
              outlined
            />
          </div>
          <div>
            <label class="label text-label-large">Allowance Period</label>
            <q-select
              class="q-pt-xs q-pb-md text-body-medium"
              v-model="form.deductionPeriod"
              :options="allowancePeriodList"
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
              type="date"
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
              :label="employeeAllowanceData ? 'Update' : 'Save'"
              type="submit"
              color="primary"
              class="text-label-large"
            />
          </div>
        </q-form>
      </template>
    </TemplateDialog>
  </q-dialog>
</template>

<script lang="ts">
import { QDialog, useQuasar } from "quasar";
import { api } from "src/boot/axios";
import GInput from "src/components/shared/form/GInput.vue";
import { handleAxiosError } from "src/utility/axios.error.handler";
import { onMounted, ref, PropType } from "vue";
import { DeductionPeriod } from "@shared/request";
import { UpdateAllowancePlanRequest } from "@shared/request/allowance-plan.request";
import { AllowancePlanDataResponse } from "@shared/response";
import TemplateDialog from "src/components/dialog/TemplateDialog.vue";
import GButton from "src/components/shared/buttons/GButton.vue";

function formatDateForSubmit(date: string): string {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(d.getDate()).padStart(2, "0")}`;
}

export default {
  name: "AddEditAllowanceDialog",
  components: {
    GInput,
    TemplateDialog,
    GButton,
  },
  props: {
    employeeAllowanceData: {
      type: Object as PropType<AllowancePlanDataResponse | null>,
      default: null,
    },
  },

  setup(props, { emit }) {
    const $q = useQuasar();
    const dialog = ref<InstanceType<typeof QDialog> | null>(null);
    const form = ref({
      allowanceType: "",
      allowanceAmount: "",
      deductionPeriod: "",
      effectivityDate: "",
    });
    const allowancePeriodList = ref<{ label: string; key: string }[]>([]);

    onMounted(() => {
      fetchAllowancePeriod();
    });

    const fetchAllowancePeriod = () => {
      $q.loading.show();
      api
        .get("hr-configuration/allowance/plan/cutoff-period-type")
        .then((response) => {
          if (response.data) {
            allowancePeriodList.value = (response.data || []).map(
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

      if (props.employeeAllowanceData) {
        apiUpdate();
      } else {
        apiSave();
      }
    };

    const apiSave = () => {};

    const apiUpdate = () => {
      if (!props.employeeAllowanceData) return;

      $q.loading.show();
      const updateParams: UpdateAllowancePlanRequest = {
        id: props.employeeAllowanceData.id,
        employeeAccountId: props.employeeAllowanceData.accountInformation.id,
        amount: Number(form.value.allowanceAmount),
        deductionPeriod: form.value.deductionPeriod as DeductionPeriod,
        effectivityDate: formatDateForSubmit(form.value.effectivityDate),
        allowanceConfigurationId: Number(
          props.employeeAllowanceData.allowanceConfiguration.id
        ),
      };

      api
        .patch("hr-configuration/allowance/plan", updateParams)
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
      if (props.employeeAllowanceData) {
        form.value.allowanceType =
          props.employeeAllowanceData.allowanceConfiguration.name;
        form.value.allowanceAmount = String(
          props.employeeAllowanceData.amount.raw
        );
        form.value.deductionPeriod =
          props.employeeAllowanceData.deductionPeriod.key;
        form.value.effectivityDate =
          props.employeeAllowanceData.effectivityDate.dateFull;
      } else {
        form.value = {
          allowanceType: "",
          allowanceAmount: "",
          deductionPeriod: "",
          effectivityDate: "",
        };
      }

      $q.loading.hide();
    };

    return {
      form,
      dialog,
      allowancePeriodList,
      fetchData,
      save,
    };
  },
};
</script>
