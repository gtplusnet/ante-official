<template>
  <q-dialog ref="dialog" @before-show="fetchData">
    <TemplateDialog minWidth="400px">
      <template #DialogTitle>
        {{ this.shiftInfo ? "Edit" : "Create" }} Shift
      </template>
      <template #DialogContent>
        <div style="max-height: calc(80vh - 150px); overflow-y: auto" class="shift-wrapper q-px-md q-pt-md">
          <ShiftFormFields
            v-model="formData"
            :readonly="false"
            :hide-shift-code="false"
          />
        </div>

        <div class="q-pa-md">
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
              :label="shiftInfo ? 'Update' : 'Save'"
              color="primary"
              class="text-label-large"
              @click="save"
            />
          </div>
        </div>
      </template>
    </TemplateDialog>
  </q-dialog>
</template>

<script>
import { api } from "src/boot/axios";
import ShiftFormFields from "../../../../../components/shared/form/ShiftFormFields.vue";
import { handleAxiosError } from "../../../../../utility/axios.error.handler";
import TemplateDialog from "src/components/dialog/TemplateDialog.vue";
import GButton from "src/components/shared/buttons/GButton.vue";

export default {
  name: "ShiftCodeDialog",
  props: {
    shiftInfo: {
      type: Object || null,
      default: null,
    },
  },

  data() {
    return {
      formData: {
        shiftCode: "",
        shiftType: "",
        workingHours: [{ start: "00:00", end: "00:00", isBreakTime: false }],
        targetHours: 0,
        totalBreakHours: 0,
      },
    };
  },
  components: {
    ShiftFormFields,
    TemplateDialog,
    GButton,
  },
  methods: {
    async save() {
      this.$q.loading.show();

      // Validate working hours before proceeding
      if (
        this.formData.shiftType === "Time Bound" &&
        !this.validateWorkingHours()
      ) {
        this.$q.notify({ type: "negative", message: "Hours cannot overlap." });
        this.$q.loading.hide();
        return;
      }

      if (this.shiftInfo) {
        await this.updateShiftCode();
      } else {
        await this.saveShiftCode();
      }
    },
    createSaveParams() {
      let shiftTime = [];
      let breakHoursValue = 0;
      let targetHoursValue = null;
      const formattedShiftType = this.formData.shiftType
        .replace(" ", "_")
        .toUpperCase();

      if (this.formData.shiftType === "Time Bound") {
        shiftTime = this.formData.workingHours.map((hours) => ({
          startTime: hours.start,
          endTime: hours.end,
          isBreakTime: hours.isBreakTime,
        }));
      } else {
        targetHoursValue = parseInt(this.formData.targetHours) || 0;
        shiftTime = [];
      }

      breakHoursValue = parseFloat(this.formData.totalBreakHours) || 0;

      const shiftCodeData = {
        shiftCode: this.formData.shiftCode,
        shiftType: formattedShiftType,
        shiftTime: shiftTime,
        breakHours: breakHoursValue,
        targetHours: targetHoursValue,
      };

      return shiftCodeData;
    },
    saveShiftCode() {
      const shiftCodeData = this.createSaveParams();

      this.$q.loading.show();
      api
        .post("hr-configuration/shift/create", shiftCodeData)
        .then((response) => {
          this.$q.loading.hide();
          this.$refs.dialog.hide();
          this.$nextTick(() => {
            this.$emit("close");
            this.$emit("saveDone", response.data);
          });
        })
        .catch((error) => {
          this.$q.loading.hide();
          handleAxiosError(this.$q, error);
        });
    },

    updateShiftCode() {
      const shiftCodeData = this.createSaveParams();
      shiftCodeData.id = this.shiftInfo.data.id;

      this.$q.loading.show();
      api
        .patch("/hr-configuration/shift/update", shiftCodeData)
        .then((response) => {
          this.$q.loading.hide();
          this.$refs.dialog.hide();
          this.$nextTick(() => {
            this.$emit("close");
            this.$emit("saveDone", response.data);
          });
        })
        .catch((error) => {
          this.$q.loading.hide();
          handleAxiosError(this.$q, error);
        });
    },

    fetchData() {
      if (this.shiftInfo) {
        const data = this.shiftInfo.data;
        this.formData.shiftCode = data.shiftCode;
        this.formData.shiftType = data.shiftType.label;
        this.formData.targetHours = data.targetHours.raw - data.breakHours.raw;
        this.formData.totalBreakHours = data.breakHours.raw;
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

        if (combinedHours.length > 0) {
          this.formData.workingHours = combinedHours;
        } else {
          this.formData.workingHours = [
            { start: "00:00", end: "00:00", isBreakTime: false },
          ];
        }
      } else {
        this.formData = {
          shiftCode: "",
          shiftType: "",
          workingHours: [{ start: "00:00", end: "00:00", isBreakTime: false }],
          targetHours: 0,
          totalBreakHours: 0,
        };
      }
    },

    timeToMinutes(timeStr) {
      if (!timeStr || !timeStr.includes(":")) return 0;
      const [hours, minutes] = timeStr.split(":").map(Number);
      return hours * 60 + minutes;
    },

    validateWorkingHours() {
      if (
        !this.formData.workingHours ||
        this.formData.workingHours.length <= 1
      ) {
        return true;
      }

      const intervals = this.formData.workingHours
        .map((wh) => {
          const startMinutes = this.timeToMinutes(wh.start);
          let endMinutes = this.timeToMinutes(wh.end);

          // If end time is 00:00 it should mean the end of the day (1440 minutes)
          // unless start time is also 00:00
          if (endMinutes === 0 && startMinutes !== 0) {
            endMinutes = 24 * 60;
          }
          // Handle overnight intervals where end time is on the next day
          else if (endMinutes < startMinutes) {
            endMinutes += 24 * 60;
          }

          return { startMinutes, endMinutes };
        })
        .filter((interval) => interval.startMinutes !== interval.endMinutes); // Ignore zero-duration intervals if any

      if (intervals.length <= 1) {
        return true; // No overlaps possible if only one valid interval remains
      }

      intervals.sort((a, b) => a.startMinutes - b.startMinutes);

      for (let i = 0; i < intervals.length - 1; i++) {
        if (intervals[i].endMinutes > intervals[i + 1].startMinutes) {
          console.warn(
            "Overlap detected:",
            this.formData.workingHours[i],
            this.formData.workingHours[i + 1]
          );
          return false; // Overlap found
        }
      }

      return true;
    },
  },
};
</script>

<style
  scoped
  lang="scss"
  src="../hris/ManpowerNewSchedule-ShiftCode.scss"
></style>
<style scoped lang="scss">
.shift-wrapper{
  &::-webkit-scrollbar {
    height: 6px;
    width: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background-color: #d9d9d9;
    border-radius: 50px;
  }

  &::-webkit-scrollbar-track {
    background-color: #f4f4f4;
    border-radius: 50px;
  }
}
</style>
