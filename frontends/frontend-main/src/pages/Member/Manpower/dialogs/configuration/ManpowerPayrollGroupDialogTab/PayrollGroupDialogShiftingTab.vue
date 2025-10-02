<template>
  <q-card-section>
    <div class="col-6 q-px-md">
      <label class="text-label-large">Working Days (Per Week)</label>
      <q-select
        class="q-pt-xs q-pb-md text-body-medium"
        required
        type="number"
        v-model="workingDays"
        :options="workingDaysList"
        map-options
        emit-value
        outlined
        dense
      ></q-select>
    </div>
    <!-- GRACE TIME (LATE) -->
    <div class="bg-grey-3 rounded-container q-pa-md q-mb-md q-mx-md">
      <div class="text-label-large q-pb-xs">GRACE TIME (LATE)</div>
      <div>
        <div>
          <label class="text-label-large">Minutes</label>
          <q-input
            required
            type="number"
            v-model="late"
            class="bg-white"
            placeholder="Enter grace time per minutes."
            dense
            outlined
            @input="emitShiftingData"
          ></q-input>
        </div>
      </div>
    </div>
    <!-- GRACE TIME (UNDER TIME) -->
    <div class="bg-grey-3 rounded-container q-pa-md q-mx-md">
      <div class="text-label-large q-pb-xs">GRACE TIME (UNDERTIME)</div>
      <div>
        <div>
          <label class="text-label-large">Minutes</label>
          <q-input
            required
            type="number"
            v-model="under"
            class="bg-white"
            placeholder="Enter grace time per minutes."
            dense
            outlined
            @input="emitShiftingData"
          ></q-input>
        </div>
      </div>
    </div>
    <!-- GRACE TIME (OVERTIME) -->
    <div class="bg-grey-3 rounded-container q-pa-md q-mt-md q-mx-md">
      <div class="text-label-large q-pb-xs">GRACE TIME (OVERTIME)</div>
      <div>
        <div>
          <label class="text-label-large">Minutes</label>
          <q-input
            required
            type="number"
            v-model="overTime"
            class="bg-white"
            placeholder="Enter grace time per minutes."
            dense
            outlined
            @input="emitShiftingData"
          ></q-input>
        </div>
      </div>
    </div>
  </q-card-section>
</template>

<style scoped src="../ManpowerPayrollGroupDialog.scss"></style>

<script>
export default {
  name: 'PayrollGroupShifting',
  components: {},
  props: {
    payrollGroupData: {
      type: Object,
      default: null,
    },
  },
  data() {
    return {
      workingDaysList: [
        { label: 'Auto (Based on Working Days in a Year)', value: 0 },
        { label: '1 Day/Week (4 days/month)', value: 1 },
        { label: '2 Days/Week (9 days/month)', value: 2 },
        { label: '3 Days/Week (13 days/month)', value: 3 },
        { label: '4 Days/Week (17 days/month)', value: 4 },
        { label: '5 Days/Week (22 days/month)', value: 5 },
        { label: '6 Days/Week (26 days/month)', value: 6 },
        { label: '7 Days/Week (30 days/month)', value: 7 },
      ],
      workingDays: 5,
      late: '15',
      under: '15',
      overTime: '15',
    };
  },
  watch: {
    workingDays(newValue) {
      this.emitShiftingData(newValue);
    },
    late(newValue) {
      this.emitShiftingData(newValue);
    },
    under(newValue) {
      this.emitShiftingData(newValue);
    },
    overTime(newValue) {
      this.emitShiftingData(newValue);
    },
  },
  mounted() {
    this.fetchData();
  },
  methods: {
    emitShiftingData() {
      this.$emit('update-shifting-data', {
        workingDays: this.workingDays,
        late: this.late,
        under: this.under,
        overTime: this.overTime,
      });
    },
    fetchData() {
      this.$q.loading.show();

      if (this.payrollGroupData) {
        this.workingDays =
          this.payrollGroupData.data.shiftingWorkingDaysPerWeek;
        this.late = this.payrollGroupData.data.lateGraceTimeMinutes;
        this.under = this.payrollGroupData.data.undertimeGraceTimeMinutes;
        this.overTime = this.payrollGroupData.data.overtimeGraceTimeMinutes;
      } else {
        this.workingDays = '5 Days';
        this.late = '15';
        this.under = '15';
        this.overTime = '15';
      }

      this.$q.loading.hide();
    },
  },
};
</script>
