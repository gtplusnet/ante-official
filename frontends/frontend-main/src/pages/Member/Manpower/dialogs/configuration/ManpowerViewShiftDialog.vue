<template>
  <q-dialog ref="dialog" @before-show="fetchData">
    <TemplateDialog minWidth="400px">
      <template #DialogIcon>
        <q-icon name="visibility" size="22px" class="q-pr-xs" />
      </template>
      <template #DialogTitle> View Shift </template>
      <template #DialogContent>
        <section class="q-pa-md q-gutter-y-md">
          <div>
            <g-input type="readonly" v-model="shiftCode" label="Shift Code" />
          </div>

          <div>
            <g-input type="readonly" v-model="shiftType" label="Shift Type" />
          </div>
        </section>

        <section v-if="shiftType == 'Time Bound'" class="q-gutter-y-md q-px-md">
          <div class="row justify-end">
            <div class="text-label-medium q-mr-md">
              Total Working Hours:
              <span class="text-label-medium">{{ totalHours }}</span>
            </div>
            <div class="text-label-medium">
              Total Break Hours:
              <span class="text-label-medium">{{ totalBreakHours }}</span>
            </div>
          </div>

          <!-- initial shift time row -->
          <div class="q-pa-md bg-grey-2 row justify-start">
            <div class="col-4">
              <div class="text-label-large">Start</div>
              <q-input
                v-model="workingHours[0].start"
                type="time"
                outlined
                dense
                readonly
                class="time-input text-body-medium"
              />
            </div>
            <div class="col-4">
              <div class="text-label-large">End</div>
              <q-input
                v-model="workingHours[0].end"
                type="time"
                outlined
                dense
                readonly
                class="time-input text-body-medium"
              />
            </div>
            <div class="col-4 self-stretch text-right">
              <!-- Placeholder for alignment, no button needed in view mode -->
            </div>
          </div>

          <!-- repeated rows for shift time -->
          <div
            class="q-pa-md bg-grey-2"
            v-for="(hours, index) in workingHours.slice(1)"
            :key="index"
          >
            <div class="row items-center q-gutter-y-sm">
              <!-- Start Time -->
              <div class="col-4">
                <q-input
                  v-model="workingHours[index + 1].start"
                  type="time"
                  label="Start"
                  outlined
                  dense
                  readonly
                  class="time-input text-body-medium"
                />
              </div>

              <!-- End Time -->
              <div class="col-4">
                <q-input
                  v-model="workingHours[index + 1].end"
                  type="time"
                  label="End"
                  outlined
                  dense
                  readonly
                  class="time-input text-body-medium"
                />
              </div>

              <!-- Placeholder for alignment -->
              <div class="col-4 flex justify-end items-center">
                <!-- No remove button needed in view mode -->
              </div>
            </div>

            <!-- Checkbox below -->
            <div class="q-mt-sm">
              <q-checkbox
                v-model="workingHours[index + 1].isBreakTime"
                label="Break Hours"
                disable
              />
            </div>
          </div>
          <!-- No add button needed in view mode -->
        </section>

        <section v-if="shiftType == 'Flexitime' || shiftType == 'Extra Day'" class="q-px-md">
          <div class="row justify-end">
            <div class="text-label-medium q-mr-md">
              Total Working Hours:
              <span class="text-weight-regular">{{ totalHours }}</span>
            </div>
            <div class="text-label-medium">
              Total Break Hours:
              <span class="text-weight-regular">{{ totalBreakHours }}</span>
            </div>
          </div>
          <div class="q-pa-md q-mt-md bg-grey-2 row justify-start">
            <div class="col-4">
              <div class="text-label-medium">Working Hours</div>
              <q-input
                v-model="targetHours"
                type="number"
                outlined
                dense
                readonly
                class="time-input text-body-medium"
              />
            </div>
            <div class="col-4">
              <div class="text-label-medium">Break Hours</div>
              <q-input
                v-model="totalBreakHours"
                type="number"
                outlined
                dense
                readonly
                class="time-input text-body-medium"
              />
            </div>
            <div class="col-4 self-stretch text-right">
              <!-- Placeholder -->
            </div>
          </div>
        </section>

        <section align="right" class="q-pa-md q-gutter-x-sm">
          <GButton
            variant="outline"
            class="text-label-large"
            label="Close"
            type="button"
            color="primary"
            v-close-popup
          />
          <GButton
            label="Edit"
            color="primary"
            @click="$emit('edit', shiftInfo)"
            v-close-popup
            class="text-label-large"
          />
        </section>
      </template>
    </TemplateDialog>
  </q-dialog>
</template>

<script>
import { defineAsyncComponent } from 'vue';
import GInput from "../../../../../components/shared/form/GInput.vue";
import GButton from "src/components/shared/buttons/GButton.vue";

// Lazy-loaded dialogs (ALL dialogs must be lazy loaded - CLAUDE.md)
const TemplateDialog = defineAsyncComponent(() =>
  import('src/components/dialog/TemplateDialog.vue')
);

export default {
  name: "ViewShiftCodeDialog",
  props: {
    shiftInfo: {
      type: Object || null,
      default: null,
    },
  },

  data() {
    return {
      shiftCode: "",
      shiftType: "",
      totalHours: 0,
      totalBreakHours: 0,
      workingHours: [{ start: "00:00", end: "00:00", isBreakTime: false }],
      targetHours: 0, // Added for Flexitime/Extra Day
    };
  },
  computed: {
    // Add computed properties from AddEditShiftDialog for consistency if needed later,
    // but for view-only, direct data binding might suffice after fetchData.
    // Keeping it minimal for now.
  },
  watch: {
    // Watchers are generally for reacting to changes, less critical in view-only mode.
    // Can be added back if complex calculations are needed based on fetched data.
  },
  components: {
    GInput,
    GButton,
    TemplateDialog,
  },
  methods: {
    fetchData() {
      this.$q.loading.show();
      if (this.shiftInfo) {
        const data = this.shiftInfo.data;
        this.shiftCode = data.shiftCode;
        this.shiftType = data.shiftType.label; // Use label for display
        this.targetHours = data.targetHours.raw;
        this.totalBreakHours = data.breakHours.raw; // Directly use fetched break hours

        let combinedHours = [];
        if (data.shiftTime && data.shiftTime.length > 0) {
          combinedHours = combinedHours.concat(
            data.shiftTime.map((st) => ({
              start: st.startTime.raw,
              end: st.endTime.raw,
              isBreakTime: st.isBreakTime,
            }))
          );
        }

        // Calculate total working hours based on shift type
        if (this.shiftType === "Time Bound") {
          let totalMinutes = 0;
          combinedHours.forEach((hours) => {
            if (hours.start && hours.end && !hours.isBreakTime) {
              const [startHour, startMinute] = hours.start
                .split(":")
                .map(Number);
              const [endHour, endMinute] = hours.end.split(":").map(Number);

              let durationMinutes =
                endHour * 60 + endMinute - (startHour * 60 + startMinute);

              if (durationMinutes < 0) {
                durationMinutes += 24 * 60;
              }
              totalMinutes += durationMinutes;
            }
          });
          this.totalHours = totalMinutes / 60;

          // Also calculate total break hours specifically for time-bound if needed distinctly
          let totalBreakMinutes = 0;
          combinedHours.forEach((hours) => {
            if (hours.start && hours.end && hours.isBreakTime) {
              const [startHour, startMinute] = hours.start
                .split(":")
                .map(Number);
              const [endHour, endMinute] = hours.end.split(":").map(Number);
              let durationMinutes =
                endHour * 60 + endMinute - (startHour * 60 + startMinute);
              if (durationMinutes < 0) durationMinutes += 24 * 60;
              totalBreakMinutes += durationMinutes;
            }
          });
          this.totalBreakHours = totalBreakMinutes / 60;
        } else if (
          this.shiftType === "Flexitime" ||
          this.shiftType === "Extra Day"
        ) {
          this.totalHours = this.targetHours; // For Flexi/Extra Day, total hours = target hours
          // totalBreakHours is already fetched directly
        } else {
          this.totalHours = 0; // Default or handle other types
        }

        if (combinedHours.length > 0) {
          this.workingHours = combinedHours;
        } else {
          // Keep default if no shiftTime, adjust if needed based on shiftType
          this.workingHours = [
            { start: "00:00", end: "00:00", isBreakTime: false },
          ];
        }
      } else {
        // Reset fields if no shiftInfo
        this.shiftCode = "";
        this.shiftType = "";
        this.totalHours = 0;
        this.totalBreakHours = 0;
        this.workingHours = [
          { start: "00:00", end: "00:00", isBreakTime: false },
        ];
        this.targetHours = 0;
      }
      this.$q.loading.hide();
    },
  },
};
</script>

<style
  scoped
  lang="scss"
  src="../hris/ManpowerNewSchedule-ShiftCode.scss"
></style>
