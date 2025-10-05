<template>
  <q-dialog @hide="resetShiftCodeData" transition-show="none">
    <TemplateDialog>
      <template #DialogTitle>
        {{ shiftCodeData?.shiftCode || "N/A" }}
      </template>
      <template #DialogContent>
        <div class="bg-grey-2 rounded-borders q-pa-md">
          <div class="text-center q-py-sm text-title-small">
            <b>Shift Summary</b>
          </div>
          <table class="global-table">
            <tbody class="text-body-small">
              <tr>
                <td class="text-left text-label-medium"><b>Shift Code</b></td>
                <td></td>
                <td>{{ shiftCodeData?.shiftCode || "N/A" }}</td>
              </tr>
              <tr>
                <td class="text-left text-label-medium"><b>Flexi Time</b></td>
                <td></td>
                <td>{{ shiftCodeData?.isFlexiTime ? "Yes" : "No" }}</td>
              </tr>
              <tr>
                <td class="text-left text-label-medium"><b>Target Hours</b></td>
                <td></td>
                <td>{{ shiftCodeData?.targetHours?.formatted || "N/A" }}</td>
              </tr>
              <tr>
                <td class="text-left text-label-medium"><b>Break Hours</b></td>
                <td></td>
                <td>{{ shiftCodeData?.breakHours?.formatted || "N/A" }}</td>
              </tr>
              <tr>
                <td class="text-left text-label-medium"><b>Work Hours</b></td>
                <td></td>
                <td>{{ shiftCodeData?.totalWorkHours?.formatted || "N/A" }}</td>
              </tr>
            </tbody>
          </table>
          <div v-if="shiftCodeData?.shiftTime?.length">
            <div class="text-center q-py-sm q-mt-lg text-title-small">
              <b>Shift Time</b>
            </div>
            <table class="global-table">
              <thead class="text-label-medium">
                <tr>
                  <th>Start Time</th>
                  <th>End Time</th>
                  <th>Night Shift</th>
                  <th>Work Hours</th>
                </tr>
              </thead>
              <tbody class="text-body-small text-center">
                <tr
                  v-for="(time, index) in shiftCodeData.shiftTime"
                  :key="index"
                >
                  <td>{{ time?.startTime?.time || "N/A" }}</td>
                  <td>{{ time?.endTime?.time || "N/A" }}</td>
                  <td>{{ time?.isNightShift ? "Yes" : "No" }}</td>
                  <td>{{ time?.workHours?.formatted || "N/A" }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </template>
    </TemplateDialog>
  </q-dialog>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
import { defineAsyncComponent } from 'vue';

// Lazy-loaded dialogs (ALL dialogs must be lazy loaded - CLAUDE.md)
const TemplateDialog = defineAsyncComponent(() =>
  import('src/components/dialog/TemplateDialog.vue')
);

interface ShiftTime {
  startTime?: { time: string };
  endTime?: { time: string };
  isNightShift: boolean;
  workHours?: { formatted: string };
}

interface ShiftCodeData {
  shiftCode?: string;
  isFlexiTime: boolean;
  targetHours?: { formatted: string };
  breakHours?: { formatted: string };
  totalWorkHours?: { formatted: string };
  shiftTime?: ShiftTime[];
}

export default defineComponent({
  name: "ViewShiftCodeDialog",
  components: {
    TemplateDialog,
  },
  props: {
    shiftCodeData: {
      type: Object as () => ShiftCodeData | null,
      default: () => ({}),
    },
  },
  emits: ["update:shiftCodeData"],
  setup(props, { emit }) {
    const isLoading = ref(false);

    const resetShiftCodeData = (): void => {
      emit("update:shiftCodeData", null);
    };

    return {
      isLoading,
      resetShiftCodeData,
    };
  },
});
</script>
