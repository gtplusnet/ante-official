<template>
  <q-card-section>
    <!-- OVERTIME RATE FACTOR -->
    <div class="table-container q-pa-md q-ma-sm">
      <div class="label q-mb-sm text-title-small">OVERTIME RATE FACTORS</div>
      <table class="overtime-table">
        <thead class="text-title-small">
          <tr>
            <td
              v-for="col in columns"
              :key="col.name"
              class="text-left q-pa-xs"
            >
              {{ col.label }}
            </td>
          </tr>
        </thead>
        <tbody class="text-body-medium">
          <tr v-for="(row, index) in workDay" :key="index">
            <td class="text-left q-pr-md">{{ row.blank }}</td>
            <td>
              <q-input
                min="0"
                bg-color="white"
                type="number"
                class="input text-body-medium"
                v-model="row.blank_ot"
                step="any"
                dense
                standout="bg-grey-5 text-white"
              />
            </td>
            <td>
              <q-input
                min="0"
                bg-color="white"
                type="number"
                class="input text-body-medium"
                v-model="row.ot"
                step="any"
                dense
                standout="bg-grey-5 text-white"
              />
            </td>
            <td>
              <q-input
                min="0"
                bg-color="white"
                type="number"
                class="input text-body-medium"
                v-model="row.night_diff"
                step="any"
                dense
                standout="bg-grey-5 text-white"
              />
            </td>
            <td>
              <q-input
                min="0"
                bg-color="white"
                type="number"
                class="input text-body-medium"
                v-model="row.night_diff_ot"
                step="any"
                dense
                standout="bg-grey-5 text-white"
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <!-- REST DAY OVERTIME RATE FACTORS -->
    <div class="table-container q-pa-md q-ma-sm">
      <div class="label q-mb-sm">REST DAY OVERTIME RATE FACTORS</div>
      <table class="overtime-table">
        <thead class="text-title-small">
          <tr>
            <td
              v-for="col in columns"
              :key="col.name"
              class="text-left q-pa-sm"
            >
              {{ col.label }}
            </td>
          </tr>
        </thead>
        <tbody class="text-body-medium">
          <tr v-for="(row, index) in restDay" :key="index">
            <td class="text-left q-pr-md">{{ row.blank }}</td>
            <td>
              <q-input
                min="0"
                bg-color="white"
                type="number"
                name="blank_ot"
                class="input text-body-medium"
                v-model="row.blank_ot"
                step="any"
                dense
                standout="bg-grey-5 text-white"
              />
            </td>
            <td>
              <q-input
                min="0"
                bg-color="white"
                type="number"
                name="ot"
                class="input text-body-medium"
                v-model="row.ot"
                step="any"
                dense
                standout="bg-grey-5 text-white"
              />
            </td>
            <td>
              <q-input
                min="0"
                bg-color="white"
                type="number"
                name="night_diff"
                class="input text-body-medium"
                v-model="row.night_diff"
                step="any"
                dense
                standout="bg-grey-5 text-white"
              />
            </td>
            <td>
              <q-input
                min="0"
                bg-color="white"
                type="number"
                name="night_diff_ot"
                class="input text-body-medium"
                v-model="row.night_diff_ot"
                step="any"
                dense
                standout="bg-grey-5 text-white"
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </q-card-section>
</template>

<style scoped src="../ManpowerPayrollGroupDialog.scss"></style>

<script>
import { api } from 'src/boot/axios';

export default {
  name: 'PayrollGroupOvertimeRates',
  components: {},
  emits: ['update-overtime-rates'],
  props: {
    payrollGroupData: {
      type: Object || null,
      default: null,
    },
  },
  data() {
    return {
      form: {},
      columns: [
        {
          name: 'blank',
          label: '',
        },
        {
          name: 'blank_ot',
          label: '',
        },
        {
          name: 'ot',
          label: 'OT',
        },
        {
          name: 'night_diff',
          label: 'Night Diff',
        },
        {
          name: 'night_diff_ot',
          label: 'Night Diff OT',
        },
      ],

      workDay: [],
      restDay: [],
    };
  },
  watch: {
    workDay: {
      handler() {
        this.emitOvertimeRates();
      },
      deep: true,
    },
    restDay: {
      handler() {
        this.emitOvertimeRates();
      },
      deep: true,
    },
  },
  mounted() {
    this.fetchData();
  },
  methods: {
    fetchOvertimeDefaults() {
      this.$q.loading.show();

      api
        .get('hr-configuration/payroll-group/overtime-default')
        .then((response) => {
          const data = response.data;
          this.workDay = [
            {
              blank: 'Ordinary Day',
              blank_ot: data.workDay.nonHoliday.noOvertime,
              ot: data.workDay.nonHoliday.withOvertime,
              night_diff: data.workDay.nonHoliday.withNightDifferential,
              night_diff_ot:
                data.workDay.nonHoliday.withNightDifferentialAndOvertime,
            },
            {
              blank: 'Regular Holiday',
              blank_ot: data.workDay.regularHoliday.noOvertime,
              ot: data.workDay.regularHoliday.withOvertime,
              night_diff: data.workDay.regularHoliday.withNightDifferential,
              night_diff_ot:
                data.workDay.regularHoliday.withNightDifferentialAndOvertime,
            },
            {
              blank: 'Special Holiday',
              blank_ot: data.workDay.specialHoliday.noOvertime,
              ot: data.workDay.specialHoliday.withOvertime,
              night_diff: data.workDay.specialHoliday.withNightDifferential,
              night_diff_ot:
                data.workDay.specialHoliday.withNightDifferentialAndOvertime,
            },
            {
              blank: 'Double Holiday',
              blank_ot: data.workDay.doubleHoliday.noOvertime,
              ot: data.workDay.doubleHoliday.withOvertime,
              night_diff: data.workDay.doubleHoliday.withNightDifferential,
              night_diff_ot:
                data.workDay.doubleHoliday.withNightDifferentialAndOvertime,
            },
          ];
          this.restDay = [
            {
              blank: 'Rest Day',
              blank_ot: data.restDay.nonHoliday.noOvertime,
              ot: data.restDay.nonHoliday.withOvertime,
              night_diff: data.restDay.nonHoliday.withNightDifferential,
              night_diff_ot:
                data.restDay.nonHoliday.withNightDifferentialAndOvertime,
            },
            {
              blank: 'Regular Holiday',
              blank_ot: data.restDay.regularHoliday.noOvertime,
              ot: data.restDay.regularHoliday.withOvertime,
              night_diff: data.restDay.regularHoliday.withNightDifferential,
              night_diff_ot:
                data.restDay.regularHoliday.withNightDifferentialAndOvertime,
            },
            {
              blank: 'Special Holiday',
              blank_ot: data.restDay.specialHoliday.noOvertime,
              ot: data.restDay.specialHoliday.withOvertime,
              night_diff: data.restDay.specialHoliday.withNightDifferential,
              night_diff_ot:
                data.restDay.specialHoliday.withNightDifferentialAndOvertime,
            },
            {
              blank: 'Double Holiday',
              blank_ot: data.restDay.doubleHoliday.noOvertime,
              ot: data.restDay.doubleHoliday.withOvertime,
              night_diff: data.restDay.doubleHoliday.withNightDifferential,
              night_diff_ot:
                data.restDay.doubleHoliday.withNightDifferentialAndOvertime,
            },
          ];
        })
        .catch((error) => {
          this.handleAxiosError(error);
        });

      this.$q.loading.hide();
    },

    emitOvertimeRates() {
      const mapToOvertimeRateFactors = (data) => {
        const safeNum = (val) => Number(val) || 0;

        return {
          nonHoliday: {
            noOvertime: safeNum(data[0].blank_ot),
            withOvertime: safeNum(data[0].ot),
            withNightDifferential: safeNum(data[0].night_diff),
            withNightDifferentialAndOvertime: safeNum(data[0].night_diff_ot),
          },
          regularHoliday: {
            noOvertime: safeNum(data[1].blank_ot),
            withOvertime: safeNum(data[1].ot),
            withNightDifferential: safeNum(data[1].night_diff),
            withNightDifferentialAndOvertime: safeNum(data[1].night_diff_ot),
          },
          specialHoliday: {
            noOvertime: safeNum(data[2].blank_ot),
            withOvertime: safeNum(data[2].ot),
            withNightDifferential: safeNum(data[2].night_diff),
            withNightDifferentialAndOvertime: safeNum(data[2].night_diff_ot),
          },
          doubleHoliday: {
            noOvertime: safeNum(data[3].blank_ot),
            withOvertime: safeNum(data[3].ot),
            withNightDifferential: safeNum(data[3].night_diff),
            withNightDifferentialAndOvertime: safeNum(data[3].night_diff_ot),
          },
        };
      };

      const payload = {
        workDay: mapToOvertimeRateFactors(this.workDay),
        restDay: mapToOvertimeRateFactors(this.restDay),
      };

      this.$emit('update-overtime-rates', payload);
    },
    fetchData() {
      this.$q.loading.show();
      if (
        this.payrollGroupData &&
        this.payrollGroupData.data &&
        this.payrollGroupData.data.overtimeRateFactors
      ) {
        const data = this.payrollGroupData.data.overtimeRateFactors;
        const mapToTableData = (source) => [
          {
            blank: 'Ordinary Day',
            blank_ot: source.nonHoliday?.noOvertime,
            ot: source.nonHoliday?.withOvertime,
            night_diff: source.nonHoliday?.withNightDifferential,
            night_diff_ot: source.nonHoliday?.withNightDifferentialAndOvertime,
          },
          {
            blank: 'Regular Holiday',
            blank_ot: source.regularHoliday?.noOvertime,
            ot: source.regularHoliday?.withOvertime,
            night_diff: source.regularHoliday?.withNightDifferential,
            night_diff_ot:
              source.regularHoliday?.withNightDifferentialAndOvertime,
          },
          {
            blank: 'Special Holiday',
            blank_ot: source.specialHoliday?.noOvertime,
            ot: source.specialHoliday?.withOvertime,
            night_diff: source.specialHoliday?.withNightDifferential,
            night_diff_ot:
              source.specialHoliday?.withNightDifferentialAndOvertime,
          },
          {
            blank: 'Double Holiday',
            blank_ot: source.doubleHoliday?.noOvertime,
            ot: source.doubleHoliday?.withOvertime,
            night_diff: source.doubleHoliday?.withNightDifferential,
            night_diff_ot:
              source.doubleHoliday?.withNightDifferentialAndOvertime,
          },
        ];

        this.workDay = mapToTableData(data.workDay || {});
        this.restDay = mapToTableData(data.restDay || {});
      } else {
        this.fetchOvertimeDefaults();
      }
      this.$q.loading.hide();
    },
  },
};
</script>
