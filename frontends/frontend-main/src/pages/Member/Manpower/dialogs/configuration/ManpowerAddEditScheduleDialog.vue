<template>
  <q-dialog ref="dialog" @before-show="fetchData">
    <TemplateDialog minWidth="500px" maxWidth="500px">
      <template #DialogTitle>
        <div>{{ scheduleInformation ? "Edit" : "Create" }} Schedule</div>
      </template>
      <template #DialogContent>
        <form v-if="initialDataLoaded" @submit.prevent="save" class="q-pa-md">
          <label class="text-title-small">Schedule Code</label>
          <div class="q-mb-sm">
            <q-input
              required
              type="text"
              class="text-body-medium"
              outlined
              dense
              v-model="form.scheduleCode"
            ></q-input>
          </div>
          <div>
            <table class="global-table">
              <thead class="text-left text-title-small">
                <tr>
                  <th>Day</th>
                  <th>Shift Code</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, index) in dayColumn" :key="index">
                  <td class="text-left text-body-medium">{{ row.label }}</td>
                  <td class="row no-wrap items-center">
                    <q-select
                      :ref="row.name + 'ShiftId'"
                      required
                      class="text-left full-width q-pr-sm text-body-medium"
                      v-model="form[`${row.name}ShiftId`]"
                      :options="shiftCodeList"
                      option-label="label"
                      option-value="value"
                      emit-value
                      map-options
                      outlined
                      dense
                    ></q-select>
                    <GButton
                      @click="openAddEditShiftCode(dayColumn[index].label)"
                      variant="outline"
                      color="dark"
                      icon="add"
                      icon-size="md"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="q-mt-md">
            <div class="row justify-end q-gutter-sm">
              <GButton
                label="Close"
                type="button"
                color="primary"
                variant="outline"
                v-close-popup
                class="text-label-large"
              />
              <GButton
                type="submit"
                :label="scheduleInformation ? 'Update' : 'Save'"
                color="primary"
                class="text-label-large"
              />
            </div>
          </div>
        </form>

        <AddEditShiftDialog
          @close="openShiftCodeDialog = false"
          @saveDone="
        (data: any) => {
          $nextTick(() => newSelect(data));
        }
      "
          v-model="openShiftCodeDialog"
          :dayData="dayData"
        />
      </template>
    </TemplateDialog>
  </q-dialog>
</template>

<script lang="ts">
import { useQuasar, QDialog } from "quasar";
import { api } from "src/boot/axios";
import { handleAxiosError } from "../../../../../utility/axios.error.handler";
import GButton from "src/components/shared/buttons/GButton.vue";
import { nextTick, Ref, ref, watch } from "vue";
import { defineAsyncComponent } from 'vue';
import { ScheduleDataRequest } from "@shared/request/schedule.request";
// TODO: Migrate to backend API
// import { useSupabaseShifts } from "src/composables/supabase/useSupabaseShifts";
import { useAuthStore } from "src/stores/auth";

// Lazy-loaded dialogs (ALL dialogs must be lazy loaded - CLAUDE.md)
const AddEditShiftDialog = defineAsyncComponent(() =>
  import('./ManpowerAddEditShiftDialog.vue')
);
const TemplateDialog = defineAsyncComponent(() =>
  import('src/components/dialog/TemplateDialog.vue')
);

export default {
  name: "AddEditScheduleDialog",
  components: {
    AddEditShiftDialog,
    TemplateDialog,
    GButton,
  },
  props: {
    scheduleInformation: {
      type: Object || null,
      default: null,
    },
  },
  setup(props, { emit }) {
    const $q = useQuasar();
    const dialog = ref<InstanceType<typeof QDialog> | null>(null);
    const initialDataLoaded = ref(false);
    const openShiftCodeDialog: Ref<boolean> = ref(false);
    const dayData = ref<string | null>(null);
    const shiftCodeList = ref<{ label: string; value: number }[]>([]);

    // TODO: Migrate to backend API - shifts composable deleted
    // const shiftsComposable = useSupabaseShifts();
    const shiftsComposable = {
      shiftOptions: { value: [] },
      fetchShiftsByCompany: async () => {},
      fetchShifts: async () => {}
    };
    const authStore = useAuthStore();
    const dayColumn = ref([
      { name: "monday", label: "Monday" },
      { name: "tuesday", label: "Tuesday" },
      { name: "wednesday", label: "Wednesday" },
      { name: "thursday", label: "Thursday" },
      { name: "friday", label: "Friday" },
      { name: "saturday", label: "Saturday" },
      { name: "sunday", label: "Sunday" },
    ]);

    interface shiftType {
      scheduleCode: string;
      [key: string]: string | number | null;
      mondayShiftId: number | null;
      tuesdayShiftId: number | null;
      wednesdayShiftId: number | null;
      thursdayShiftId: number | null;
      fridayShiftId: number | null;
      saturdayShiftId: number | null;
      sundayShiftId: number | null;
    }

    const form = ref<shiftType>({
      scheduleCode: "",
      mondayShiftId: null,
      tuesdayShiftId: null,
      wednesdayShiftId: null,
      thursdayShiftId: null,
      fridayShiftId: null,
      saturdayShiftId: null,
      sundayShiftId: null,
    });
    const latestShiftId = ref<number | null>(null);

    // Watch for dialog visibility and only fetch data when opened
    watch(() => props.modelValue, (newVal) => {
      if (newVal && !initialDataLoaded.value) {
        fetchShiftCodeList();
      }
    });

    const openAddEditShiftCode = (data: string) => {
      dayData.value = data;
      openShiftCodeDialog.value = true;
    };

    const newSelect = (newShiftData: { data: { id: number } }) => {
      try {
        fetchShiftCodeList()
          .then(() => {
            const dayName = dayData.value?.toLowerCase();
            const dayObj = dayColumn.value.find(
              (day) => day.label.toLowerCase() === dayName
            );

            if (dayObj && newShiftData?.data?.id) {
              nextTick(() => {
                form.value[`${dayObj.name}ShiftId`] = newShiftData.data.id;
              });
            }
          })
          .catch((error) => {
            handleAxiosError($q, error);
          });
      } catch (error) {
        console.log("Error: ", error);
      }
    };

    const save = async () => {
      $q.loading.show();

      if (props.scheduleInformation) {
        await apiUpdate();
      } else {
        await apiSave();
      }
    };

    const apiSave = () => {
      $q.loading.show();

      const params: Omit<ScheduleDataRequest, "id"> = {
        scheduleCode: form.value.scheduleCode,
        daySchedule: {
          mondayShiftId: form.value.mondayShiftId ?? 0,
          tuesdayShiftId: form.value.tuesdayShiftId ?? 0,
          wednesdayShiftId: form.value.wednesdayShiftId ?? 0,
          thursdayShiftId: form.value.thursdayShiftId ?? 0,
          fridayShiftId: form.value.fridayShiftId ?? 0,
          saturdayShiftId: form.value.saturdayShiftId ?? 0,
          sundayShiftId: form.value.sundayShiftId ?? 0,
        },
      };
      api
        .post("hr-configuration/schedule/create", params)
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
    const apiUpdate = () => {
      $q.loading.show();

      const updateParams: ScheduleDataRequest = {
        id: props.scheduleInformation.id,
        scheduleCode: form.value.scheduleCode,
        daySchedule: {
          mondayShiftId: form.value.mondayShiftId ?? 0,
          tuesdayShiftId: form.value.tuesdayShiftId ?? 0,
          wednesdayShiftId: form.value.wednesdayShiftId ?? 0,
          thursdayShiftId: form.value.thursdayShiftId ?? 0,
          fridayShiftId: form.value.fridayShiftId ?? 0,
          saturdayShiftId: form.value.saturdayShiftId ?? 0,
          sundayShiftId: form.value.sundayShiftId ?? 0,
        },
      };

      api
        .patch("hr-configuration/schedule/update", updateParams)
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

    const fetchShiftCodeList = async () => {
      $q.loading.show();
      initialDataLoaded.value = false;

      try {
        // Fetch shifts using Supabase composable
        const companyId = authStore.getAccountInformation?.companyId || authStore.getAccountInformation?.company?.id;
        if (companyId) {
          await shiftsComposable.fetchShiftsByCompany(companyId);
        } else {
          await shiftsComposable.fetchShifts();
        }
        
        // Update local shift list from composable (shiftOptions is a computed ref)
        shiftCodeList.value = shiftsComposable.shiftOptions.value.map(opt => ({
          label: opt.label,
          value: opt.value
        }));
        
        // Set the latest shift ID if shifts exist
        if (shiftCodeList.value.length > 0) {
          latestShiftId.value = shiftCodeList.value[0]?.value ?? null;
        } else {
          latestShiftId.value = null;
        }
        
        $q.loading.hide();
        initialDataLoaded.value = true;
        return shiftCodeList.value;
      } catch (error) {
        $q.loading.hide();
        initialDataLoaded.value = true;
        console.error("Error fetching shifts from Supabase:", error);
        $q.notify({
          type: "negative",
          message: "Failed to load shifts",
        });
        throw error;
      }
    };

    const fetchData = () => {
      $q.loading.show();
      initialDataLoaded.value = false;

      if (props.scheduleInformation) {
        form.value.scheduleCode = props.scheduleInformation.scheduleCode;
        form.value.mondayShiftId =
          props.scheduleInformation.dayScheduleDetails.mondayShift.id;
        form.value.tuesdayShiftId =
          props.scheduleInformation.dayScheduleDetails.tuesdayShift.id;
        form.value.wednesdayShiftId =
          props.scheduleInformation.dayScheduleDetails.wednesdayShift.id;
        form.value.thursdayShiftId =
          props.scheduleInformation.dayScheduleDetails.thursdayShift.id;
        form.value.fridayShiftId =
          props.scheduleInformation.dayScheduleDetails.fridayShift.id;
        form.value.saturdayShiftId =
          props.scheduleInformation.dayScheduleDetails.saturdayShift.id;
        form.value.sundayShiftId =
          props.scheduleInformation.dayScheduleDetails.sundayShift.id;
      } else {
        form.value.scheduleCode = "";
        form.value.mondayShiftId = latestShiftId.value || null;
        form.value.tuesdayShiftId = latestShiftId.value || null;
        form.value.wednesdayShiftId = latestShiftId.value || null;
        form.value.thursdayShiftId = latestShiftId.value || null;
        form.value.fridayShiftId = latestShiftId.value || null;
        form.value.saturdayShiftId = latestShiftId.value || null;
        form.value.sundayShiftId = latestShiftId.value || null;
      }

      $q.loading.hide();
      initialDataLoaded.value = true;
    };

    return {
      dialog,
      initialDataLoaded,
      openShiftCodeDialog,
      shiftCodeList,
      dayData,
      dayColumn,
      form,
      openAddEditShiftCode,
      newSelect,
      fetchShiftCodeList,
      fetchData,
      save,
    };
  },
};
</script>
