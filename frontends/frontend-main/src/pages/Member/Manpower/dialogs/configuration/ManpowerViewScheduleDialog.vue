<template>
  <q-dialog ref="dialog" @before-show="fetchData">
    <TemplateDialog>
      <template #DialogTitle>
        <div>View Schedule</div>
      </template>
      <template #DialogContent>
        <div class="q-pa-md">
          <div class="q-gutter-y-md">
            <g-input
              required
              type="readonly"
              label="Schedule Code"
              v-model="form.scheduleCode"
            ></g-input>
            <table class="global-table">
              <thead class="text-left text-title-small">
                <tr>
                  <th>Day</th>
                  <th>Shift Code</th>
                </tr>
              </thead>
              <tbody class="text-body-small">
                <tr v-for="(row, key) in form.dayScheduleDetails" :key="key">
                  <td class="text-left">{{ formatDay(key) }}</td>
                  <td>
                    <g-input
                      required
                      type="readonly"
                      class="text-left"
                      v-model="row.shiftCode"
                    ></g-input>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="text-right q-mt-md q-gutter-x-sm">
            <GButton
              class="text-label-large"
              variant="outline"
              label="Close"
              type="button"
              color="primary"
              v-close-popup
            />
            <GButton
              class="text-label-large"
              @click="$emit('edit', scheduleInformation)"
              label="Edit"
              type="button"
              color="primary"
              v-close-popup
            />
          </div>
        </div>
      </template>
    </TemplateDialog>
  </q-dialog>
</template>

<style scoped lang="scss">
.schedule-card {
  max-width: 500px;
}
</style>

<script lang="ts">
import GInput from "../../../../../components/shared/form/GInput.vue";
import { useQuasar } from "quasar";
import { ref } from "vue";
import { defineAsyncComponent } from 'vue';
import GButton from "src/components/shared/buttons/GButton.vue";

// Lazy-loaded dialogs (ALL dialogs must be lazy loaded - CLAUDE.md)
const TemplateDialog = defineAsyncComponent(() =>
  import('src/components/dialog/TemplateDialog.vue')
);

export default {
  name: "ViewScheduleDialog",
  components: {
    GInput,
    GButton,
    TemplateDialog,
  },
  props: {
    scheduleInformation: {
      type: Object,
      default: () => null,
    },
  },
  setup(props) {
    const $q = useQuasar();
    const form = ref<{
      scheduleCode: string;
      dayScheduleDetails: Record<string, { shiftCode: string }>;
    }>({
      scheduleCode: "",
      dayScheduleDetails: {},
    });

    const fetchData = () => {
      $q.loading.show();

      if (props.scheduleInformation) {
        form.value.scheduleCode = props.scheduleInformation.scheduleCode;
        form.value.dayScheduleDetails =
          props.scheduleInformation.dayScheduleDetails;
      }

      $q.loading.hide();
    };

    const formatDay = (dayKey: string) => {
      return dayKey.replace("Shift", "");
    };

    return {
      form,
      fetchData,
      formatDay,
    };
  },
};
</script>
