<template>
  <q-dialog ref="dialog" @before-show="fetchData">
    <q-card class="full-width">
      <q-bar class="bg-primary text-white cursor-default" dark>
        <q-icon name="o_task" />
        <div>New Shift Code</div>
        <q-space />
        <q-btn dense flat icon="close" v-close-popup>
          <q-tooltip>Close</q-tooltip>
        </q-btn>
      </q-bar>

      <q-card-section class="q-pa-lg">
        <div class="q-mb-md">
          <div class="text-caption q-mb-xs">
            <p class="day">{{ dayData }}</p>
          </div>
          <g-input v-model="shiftCode" label="Shift Code" />
        </div>

        <div class="container-flexi flex justify-start items-center">
          <q-checkbox
            v-model="isFlexiTime"
            label="Flexi Time"
            class="flexiTimes"
          />
        </div>

        <div class="mainStyle">
          <div class="text-subtitle1 q-mb-xs workingTitle">Working Hours</div>

          <div>
            <div class="F2" v-if="isFlexiTime">
              <g-input label="Total Hours" />
              <g-input label="Break Hours" />
            </div>

            <div v-else>
              <div class="working-hours-grid">
                <div class="grid-header">
                  <span>Total Hours</span>
                  <span>Start</span>
                  <span>End</span>
                </div>

                <div class="grid-row first-row">
                  <q-input
                    v-model="totalHours"
                    type="number"
                    outlined
                    dense
                    class="total-hours-input"
                  />
                  <q-input
                    v-model="start"
                    type="time"
                    outlined
                    dense
                    class="time-input"
                  />
                  <q-input
                    v-model="end"
                    type="time"
                    outlined
                    dense
                    class="time-input"
                  />
                  <q-btn
                    no-caps
                    outline
                    type="button"
                    color="primary"
                    class="perfect-circle"
                    icon="add"
                    @click="addWorkingHoursRow"
                  />
                </div>

                <div
                  v-for="(hours, index) in workingHours.slice(1)"
                  :key="index"
                  class="grid-row additional-row"
                >
                  <div class="placeholder"></div>
                  <q-input
                    v-model="workingHours[index + 1].start"
                    type="time"
                    outlined
                    dense
                    class="time-input"
                  />
                  <q-input
                    v-model="workingHours[index + 1].end"
                    type="time"
                    outlined
                    dense
                    class="time-input"
                  />
                  <q-btn
                    no-caps
                    outline
                    type="button"
                    color="negative"
                    class="perfect-circle"
                    icon="remove"
                    @click="removeWorkingHoursRow(index + 1)"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="Hours" v-if="!isFlexiTime">
          <span>Break Hours</span>
          <q-input dense outlined v-model="breakHours" type="text" />
        </div>
      </q-card-section>

      <q-card-actions align="right" class="q-pa-md">
        <q-btn
          no-caps
          outline
          label="Close"
          type="button"
          color="primary"
          v-close-popup
        />
        <q-btn
          label="Save"
          color="primary"
          unelevated
          @click="saveShiftCode()"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script>
import { api } from 'src/boot/axios';
import GInput from "../../../../../components/shared/form/GInput.vue";

export default {
  name: 'ShiftCodeDialog',
  data() {
    return {
      isFlexiTime: false,
      shiftCode: '',
      totalHours: 8,
      workingHours: [{ start: '09:00', end: '05:00' }],
      breakHours: 1,
      start: '00:00',
      end: '00:00',
    };
  },
  computed: {
    computedTotalHours() {
      if (this.start && this.end) {
        const [startHour, startMinute] = this.start.split(':').map(Number);
        const [endHour, endMinute] = this.end.split(':').map(Number);

        let totalMinutes =
          endHour * 60 + endMinute - (startHour * 60 + startMinute);

        if (totalMinutes < 0) {
          totalMinutes += 24 * 60; // Handle overnight shifts
        }

        const totalHours = totalMinutes / 60 - this.breakHours;
        return totalHours > 0 ? totalHours : 0; // Ensure non-negative hours
      }
      return 0;
    },
  },
  watch: {
    computedTotalHours(newVal) {
      this.totalHours = newVal;
    },
  },
  components: {
    GInput,
  },
  props: {
    dayData: {
      type: [String, null],
      default: null,
    },
  },
  methods: {
    addWorkingHoursRow() {
      this.workingHours.push({
        start: this.start,
        end: this.end,
      });
    },
    removeWorkingHoursRow(index) {
      if (this.workingHours.length > 1) {
        this.workingHours.splice(index, 1);
      }
    },
    saveShiftCode() {
      let shiftCodeData;

      if (this.isFlexiTime) {
        shiftCodeData = {
          shiftCode: this.shiftCode,
          breakHours: Number(this.breakHours),
          isFlexiTime: this.isFlexiTime,
          targetHours: this.totalHours,
        };
      } else {
        shiftCodeData = {
          shiftCode: this.shiftCode,
          breakHours: Number(this.breakHours),
          isFlexiTime: this.isFlexiTime,
          shiftTime: this.workingHours.map((hours) => ({
            startTime: hours.start,
            endTime: hours.end,
          })),
        };
      }

      this.$q.loading.show();

      api
        .post('hr-configuration/shift/create', shiftCodeData)
        .then((response) => {
          this.$q.loading.hide();
          this.$refs.dialog.hide();
          this.$nextTick(() => {
            try {
              this.$emit('close');
              this.$emit('saveDone', response.data);
            } catch (error) {
              this.handleAxiosError(error);
            }
          });
        })
        .catch((error) => {
          this.$q.loading.hide();
          this.handleAxiosError(error);
        });
    },
    fetchData() {
      this.$q.loading.show();

      this.shiftCode = '';
      this.isFlexiTime = false;
      this.totalHours = 8;
      this.workingHours = [{ start: '09:00', end: '05:00' }];
      this.breakHours = 1;
      this.start = '00:00';
      this.end = '00:00';

      this.$q.loading.hide();
    },
  },
};
</script>

<style scoped lang="scss" src="./ManpowerNewSchedule-ShiftCode.scss"></style>
