<template>
  <q-dialog ref="dialog" @before-show="fetchData">
    <TemplateDialog minWidth="400px">
      <template #DialogTitle>
        Edit Leave Credits
        <span>
          ({{ formatName(employeeLeavePlanTagInformation?.employee?.name) }})
        </span>
      </template>
      <template #DialogContent>
        <q-form @submit.prevent="submitForm" class="q-pa-md">
          <div class="column q-gutter-y-md">
            <div>
              <label class="text-label-large">Initial Leave Credits</label>
              <q-input
                class="q-pt-xs text-body-medium"
                required
                v-model="detailsRow.initialLeaveCredits"
                type="number"
                min="0"
                step="0.01"
                dense
                placeholder="Enter Initial Leave Credits"
                outlined
              />
            </div>

            <div>
              <label class="text-label-large"
                >Total Leave Credits Given Upfront</label
              >
              <q-input
                required
                class="text-body-medium"
                v-model="detailsRow.leaveCreditsGivenUpfront"
                type="number"
                min="0"
                step="0.01"
                dense
                placeholder="Enter Total Leave Credits Given Upfront"
                outlined
              />
            </div>

            <div>
              <label class="text-label-large"
                >Credits Accrue Over Time (Per month)</label
              >
              <q-input
                class="text-body-medium"
                v-model="detailsRow.monthlyAccrualCredits"
                type="number"
                min="0"
                step="0.01"
                dense
                placeholder="Enter Credits Accrue Over Time"
                outlined
              />
            </div>

            <div>
              <label class="text-label-large"
                >Number of Days of the Month</label
              >
              <q-input
                class="text-body-medium"
                v-model="detailsRow.numberOfDaysOfMonth"
                type="number"
                min="0"
                step="0.01"
                dense
                placeholder="Enter Number of Days of the Month"
                outlined
              />
            </div>
          </div>
          <div class="text-right q-gutter-x-sm q-pt-md">
            <GButton
              variant="outline"
              label="Cancel"
              type="button"
              color="primary"
              v-close-popup
            />
            <GButton
              variant="default"
              label="Update"
              unelevated
              type="submit"
              color="primary"
            />
          </div>
        </q-form>
      </template>
    </TemplateDialog>
  </q-dialog>
</template>

<style lang="scss" scoped>
.leave-credits-card {
  min-width: 400px;
}
</style>

<script lang="ts">
import { ref } from "vue";
import { formatName } from "src/utility/formatter";
import { useQuasar, QDialog } from "quasar";
import { api } from "src/boot/axios";
import { handleAxiosError } from "src/utility/axios.error.handler";
import TemplateDialog from "src/components/dialog/TemplateDialog.vue";
import GButton from "src/components/shared/buttons/GButton.vue";

export default {
  name: "ManpowerEditEmployeeLeavePlanTagDialog",
  components: {
    TemplateDialog,
    GButton,
  },
  props: {
    employeeLeavePlanTagInformation: {
      type: [Object, null],
      default: () => ({}),
    },
  },

  setup(props, { emit }) {
    const q = useQuasar();
    const dialog = ref<InstanceType<typeof QDialog> | null>(null);
    const detailsRow = ref({
      initialLeaveCredits: null,
      leaveCreditsGivenUpfront: null,
      monthlyAccrualCredits: null,
      numberOfDaysOfMonth: null,
    });

    const submitForm = () => {
      q.loading.show();
      const params = {
        totalAnnualCredits: detailsRow.value.initialLeaveCredits,
        leaveCreditsGivenUpfront: detailsRow.value.leaveCreditsGivenUpfront,
        monthlyAccrualCredits: detailsRow.value.monthlyAccrualCredits,
        monthDay: detailsRow.value.numberOfDaysOfMonth,
      };
      api
        .patch(
          `hr-configuration/leave/employee-plan/${props.employeeLeavePlanTagInformation?.id}/settings`,
          params
        )
        .then(() => {
          if (dialog.value) {
            dialog.value.hide();
          }
          emit("saveDone");
        })
        .catch((error) => {
          handleAxiosError(q, error);
        })
        .finally(() => {
          q.loading.hide();
        });
    };

    const fetchData = () => {
      if (props.employeeLeavePlanTagInformation) {
        detailsRow.value = {
          initialLeaveCredits:
            props.employeeLeavePlanTagInformation?.settings?.totalAnnualCredits,
          leaveCreditsGivenUpfront:
            props.employeeLeavePlanTagInformation?.settings
              ?.leaveCreditsGivenUpfront,
          monthlyAccrualCredits:
            props.employeeLeavePlanTagInformation?.settings
              ?.monthlyAccrualCredits,
          numberOfDaysOfMonth:
            props.employeeLeavePlanTagInformation?.settings
              ?.monthDayCreditsAccrual,
        };
      }
    };

    return {
      dialog,
      detailsRow,
      fetchData,
      submitForm,
      formatName,
    };
  },
};
</script>
