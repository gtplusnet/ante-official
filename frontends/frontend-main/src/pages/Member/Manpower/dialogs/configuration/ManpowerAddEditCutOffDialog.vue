<template>
  <q-dialog ref="dialog" @before-show="fetchData">
    <TemplateDialog maxWidth="400px" minWidth="400px">
      <template #DialogTitle>
        {{ cutOffData ? "Edit" : "Create" }} Cut-Off
      </template>
      <template #DialogContent>
        <q-form @submit.prevent="save" class="q-pa-md">
          <div class="q-mb-sm">
            <div class="q-pb-md">
              <label class="text-label-large">Cut-Off Code</label>
              <q-input
                v-model="cutoffCode"
                outlined
                dense
                required
                type="text"
                class="text-body-medium"
              />
            </div>

            <div class="q-pb-md">
              <label class="text-label-large">Payroll Period</label>
              <q-select
                outlined
                dense
                v-model="selectedPayrollPeriod"
                :options="payrollPeriods"
                option-value="key"
                option-label="label"
                emit-value
                map-options
                class="full-width q-pt-xs text-body-medium"
                required
              />
            </div>

            <!-- Weekly Selection -->
            <div v-if="selectedPayrollPeriod === 'WEEKLY'">
              <div class="q-pb-md">
                <label class="text-label-large">Day</label>
                <q-select
                  outlined
                  dense
                  v-model="selectedWeekDay"
                  :options="weeklyCutoffOptions"
                  option-value="value"
                  option-label="label"
                  emit-value
                  map-options
                  class="full-width q-pt-xs text-body-medium"
                  required
                />
              </div>
            </div>

            <!-- Semi-Monthly Selection -->
            <div v-if="selectedPayrollPeriod === 'SEMIMONTHLY'">
              <div class="q-pb-md">
                <label class="text-label-large">First Period</label>
                <q-select
                  outlined
                  dense
                  v-model="selectedFirstCutoff"
                  :options="firstCutoffOptions"
                  option-value="value"
                  option-label="label"
                  emit-value
                  map-options
                  class="full-width q-pt-xs text-body-medium"
                  required
                />
              </div>

              <div class="q-pb-md">
                <label class="text-label-large">Last Period</label>
                <q-select
                  outlined
                  dense
                  v-model="selectedLastCutoff"
                  :options="lastCutoffOptions"
                  option-value="value"
                  option-label="label"
                  emit-value
                  map-options
                  class="full-width q-pt-xs text-body-medium"
                  required
                />
              </div>
            </div>

            <!-- Monthly Selection -->
            <div v-if="selectedPayrollPeriod === 'MONTHLY'">
              <div class="q-pb-md">
                <label class="text-label-large">Period</label>
                <q-select
                  outlined
                  dense
                  v-model="selectedMonthOff"
                  :options="monthlyCutoffOptions"
                  option-value="value"
                  option-label="label"
                  emit-value
                  map-options
                  class="full-width q-pt-xs text-body-medium"
                  required
                />
              </div>
            </div>

            <!-- Processing Period (Days) for WEEKLY, MONTHLY, and SEMI_MONTHLY -->
            <div
              v-if="
                selectedPayrollPeriod === 'WEEKLY' ||
                selectedPayrollPeriod === 'SEMIMONTHLY' ||
                selectedPayrollPeriod === 'MONTHLY'
              "
            >
              <div>
                <label class="text-label-large">Processing Period (Days)</label>
                <q-input
                  v-model="releaseProcessingDays"
                  outlined
                  dense
                  type="number"
                  min="0"
                  required
                  class="full-width q-pt-xs text-body-medium"
                />
              </div>
            </div>
          </div>
          <div class="row justify-end q-pt-md q-gutter-sm">
            <GButton
              label="Cancel"
              type="button"
              variant="outline"
              class="text-label-large"
              v-close-popup
            />
            <GButton
              :label="cutOffData ? 'Update' : 'Save'"
              type="submit"
              class="text-label-large"
            />
          </div>
        </q-form>
      </template>
    </TemplateDialog>
  </q-dialog>
</template>

<script lang="ts">
import { CutoffTypeReferenceResponse } from "@shared/response/cutoff.response";
import { QDialog, useQuasar } from "quasar";
import { api } from "src/boot/axios";
import { handleAxiosError } from "../../../../../utility/axios.error.handler";
import {
  CutoffConfigMonthly,
  CutoffConfigSemiMonthly,
  CutoffConfigWeekly,
  DayCutoffPeriod,
} from "@shared/response/cutoff.response";
import { CutoffDataRequest } from "@shared/request/cutoff.request";
import { ref, onMounted, nextTick } from "vue";
import TemplateDialog from "src/components/dialog/TemplateDialog.vue";
import GButton from "src/components/shared/buttons/GButton.vue";

enum CutoffType {
  WEEKLY = "WEEKLY",
  MONTHLY = "MONTHLY",
  SEMIMONTHLY = "SEMIMONTHLY",
}

export default {
  name: "AddEditCutOffManagementDialog",
  components: {
    TemplateDialog,
    GButton,
  },
  props: {
    cutOffData: {
      type: Object || null,
      default: null,
    },
  },
  setup(props, { emit }) {
    const dialog = ref<InstanceType<typeof QDialog> | null>(null);
    const $q = useQuasar();
    const cutoffCode = ref("");
    const selectedPayrollPeriod = ref<CutoffType>(CutoffType.SEMIMONTHLY);
    const releaseProcessingDays = ref(3);
    const payrollPeriods = ref<CutoffTypeReferenceResponse[]>([]);
    const firstCutoffOptions = ref<{ key: number; label: string }[]>([]);
    const lastCutoffOptions = ref<{ key: number; label: string }[]>([]);
    const weeklyCutoffOptions = ref([]);
    const monthlyCutoffOptions = ref<{ key: number; label: string }[]>([]);
    const selectedFirstCutoff = ref(0);
    const selectedLastCutoff = ref(0);
    const selectedWeekDay = ref("MONDAY");
    const selectedMonthOff = ref(0);

    onMounted(() => {
      fetchPayrollPeriods();
      fetchSemiMonthlyCutoffPeriods();
      fetchWeeklyCutoffPeriods();
      fetchMonthlyCutoffPeriods();
    });

    const fetchPayrollPeriods = () => {
      $q.loading.show();
      api
        .get("/hr-configuration/cutoff/type")
        .then((response) => {
          if (Array.isArray(response.data) && response.data.length > 0) {
            payrollPeriods.value = response.data;
          }
        })
        .catch((error) => {
          handleAxiosError($q, error);
        })
        .finally(() => {
          $q.loading.hide();
        });
    };

    const fetchSemiMonthlyCutoffPeriods = () => {
      $q.loading.show();
      api
        .get("/hr-configuration/cutoff/config-select?cutoffType=SEMIMONTHLY")
        .then((response) => {
          if (response.data) {
            firstCutoffOptions.value = (
              response.data.firstCutoffPeriod || []
            ).map((item: { label: string; key: number }) => ({
              label: item.label,
              value: item.key,
            }));
            lastCutoffOptions.value = (
              response.data.lastCutoffPeriod || []
            ).map((item: { label: string; key: number }) => ({
              label: item.label,
              value: item.key,
            }));
          }
        })
        .catch((error) => {
          handleAxiosError($q, error);
        })
        .finally(() => {
          $q.loading.hide();
        });
    };

    const fetchWeeklyCutoffPeriods = () => {
      $q.loading.show();
      api
        .get("/hr-configuration/cutoff/config-select?cutoffType=WEEKLY")
        .then((response) => {
          if (response.data) {
            weeklyCutoffOptions.value = (response.data.cutoffDay || []).map(
              (item: { label: string; key: string }) => ({
                label: item.label,
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

    const fetchMonthlyCutoffPeriods = () => {
      $q.loading.show();
      api
        .get("/hr-configuration/cutoff/config-select?cutoffType=MONTHLY")
        .then((response) => {
          if (response.data) {
            monthlyCutoffOptions.value = (response.data.cutoffPeriod || []).map(
              (item: { label: string; key: number }) => ({
                label: item.label,
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

    const save = async () => {
      $q.loading.show();
      props.cutOffData ? apiUpdate() : apiSave();
    };

    const apiSave = () => {
      $q.loading.show();

      let cutoffConfig:
        | CutoffConfigMonthly
        | CutoffConfigWeekly
        | CutoffConfigSemiMonthly = {} as CutoffConfigMonthly;

      if (selectedPayrollPeriod.value === "WEEKLY") {
        cutoffConfig = {
          dayCutoffPeriod: (selectedWeekDay.value ?? "") as DayCutoffPeriod,
        };
      } else if (selectedPayrollPeriod.value === "MONTHLY") {
        cutoffConfig = {
          cutoffPeriod: selectedMonthOff.value ?? 0,
        };
      } else if (selectedPayrollPeriod.value === "SEMIMONTHLY") {
        cutoffConfig = {
          firstCutoffPeriod: selectedFirstCutoff.value ?? 0,
          lastCutoffPeriod: selectedLastCutoff.value ?? 0,
        };
      } else {
        cutoffConfig = {} as CutoffConfigMonthly;
      }

      const params: Omit<CutoffDataRequest, "id"> = {
        cutoffCode: cutoffCode.value,
        cutoffType: selectedPayrollPeriod.value,
        cutoffConfig,
        releaseProcessingDays: Number(releaseProcessingDays.value),
      };

      api
        .post("/hr-configuration/cutoff/create", params)
        .then((response) => {
          $q.loading.hide();
          if (dialog.value) {
            dialog.value.hide();
          }
          nextTick(() => {
            try {
              emit("close");
              emit("saveDone", response.data);
            } catch (err) {
              console.log(err);
            }
          });
        })
        .catch((error) => {
          handleAxiosError($q, error);
        })
        .finally(() => {
          $q.loading.hide();
        });
    };

    const apiUpdate = () => {
      $q.loading.show();

      let cutoffConfig:
        | CutoffConfigMonthly
        | CutoffConfigWeekly
        | CutoffConfigSemiMonthly = {} as CutoffConfigMonthly;

      if (selectedPayrollPeriod.value === "WEEKLY") {
        cutoffConfig = {
          dayCutoffPeriod: (selectedWeekDay.value ?? "") as DayCutoffPeriod,
        };
      } else if (selectedPayrollPeriod.value === "MONTHLY") {
        cutoffConfig = {
          cutoffPeriod: selectedMonthOff.value ?? 0,
        };
      } else if (selectedPayrollPeriod.value === "SEMIMONTHLY") {
        cutoffConfig = {
          firstCutoffPeriod: selectedFirstCutoff.value ?? 0,
          lastCutoffPeriod: selectedLastCutoff.value ?? 0,
        };
      } else {
        cutoffConfig = {} as CutoffConfigMonthly;
      }

      const updateParams: CutoffDataRequest = {
        id: props.cutOffData.id,
        cutoffCode: cutoffCode.value,
        cutoffType: selectedPayrollPeriod.value,
        cutoffConfig,
        releaseProcessingDays: Number(releaseProcessingDays.value),
      };

      api
        .patch("hr-configuration/cutoff/update", updateParams)
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
      if (props.cutOffData) {
        cutoffCode.value = props.cutOffData.cutoffCode;
        selectedPayrollPeriod.value = props.cutOffData.cutoffType;
        releaseProcessingDays.value = props.cutOffData.releaseProcessingDays;

        switch (props.cutOffData.cutoffType) {
          case "WEEKLY":
            selectedWeekDay.value =
              props.cutOffData.cutoffConfig.dayCutoffPeriod;
            break;
          case "SEMIMONTHLY":
            selectedFirstCutoff.value =
              props.cutOffData.cutoffConfig.firstCutoffPeriod;
            selectedLastCutoff.value =
              props.cutOffData.cutoffConfig.lastCutoffPeriod;
            break;
          case "MONTHLY":
            selectedMonthOff.value = props.cutOffData.cutoffConfig.cutoffPeriod;
            break;
        }
      } else {
        cutoffCode.value = "";
        selectedPayrollPeriod.value = CutoffType.SEMIMONTHLY;
        releaseProcessingDays.value = 3;
        selectedWeekDay.value = "MONDAY";
        selectedFirstCutoff.value = firstCutoffOptions.value[0]?.key || 1;
        selectedLastCutoff.value = lastCutoffOptions.value[0]?.key ?? 16;
        selectedMonthOff.value = monthlyCutoffOptions.value[0]?.key ?? 1;
      }
      $q.loading.hide();
    };

    return {
      dialog,
      cutoffCode,
      selectedPayrollPeriod,
      releaseProcessingDays,
      payrollPeriods,
      firstCutoffOptions,
      lastCutoffOptions,
      weeklyCutoffOptions,
      monthlyCutoffOptions,
      selectedFirstCutoff,
      selectedLastCutoff,
      selectedMonthOff,
      selectedWeekDay,
      fetchPayrollPeriods,
      fetchSemiMonthlyCutoffPeriods,
      fetchWeeklyCutoffPeriods,
      fetchMonthlyCutoffPeriods,
      save,
      fetchData,
    };
  },
};
</script>
