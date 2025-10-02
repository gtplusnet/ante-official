<template>
  <q-card-section>
    <!-- OVERTIME RATE FACTOR -->
    <div class="table-container q-pa-md q-ma-sm">
      <div class="q-mb-sm text-title-small">OVERTIME RATE FACTORS</div>
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
              <input
                type="number"
                class="input bg-white q-px-sm text-body-medium"
                v-model="row.blank_ot"
                readonly
              />
            </td>
            <td>
              <input
                type="number"
                class="input bg-white q-px-sm text-body-medium"
                v-model="row.ot"
                readonly
              />
            </td>
            <td>
              <input
                type="number"
                class="input bg-white q-px-sm text-body-medium"
                v-model="row.night_diff"
                readonly
              />
            </td>
            <td>
              <input
                type="number"
                class="input bg-white q-px-sm text-body-medium"
                v-model="row.night_diff_ot"
                readonly
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <!-- REST DAY OVERTIME RATE FACTORS -->
    <div class="table-container q-pa-md q-ma-sm">
      <div class="q-mb-sm text-title-small">REST DAY OVERTIME RATE FACTORS</div>
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
              <input
                type="number"
                name="blank_ot"
                class="input bg-white q-px-sm text-body-medium"
                v-model="row.blank_ot"
                readonly
              />
            </td>
            <td>
              <input
                type="number"
                name="ot"
                class="input bg-white q-px-sm text-body-medium"
                v-model="row.ot"
                readonly
              />
            </td>
            <td>
              <input
                type="number"
                name="night_diff"
                class="input bg-white q-px-sm text-body-medium"
                v-model="row.night_diff"
                readonly
              />
            </td>
            <td>
              <input
                type="number"
                name="night_diff_ot"
                class="input bg-white q-px-sm text-body-medium"
                v-model="row.night_diff_ot"
                readonly
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
export default {
  name: 'ViewPayrollGroupOvertimeRates',
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
  mounted() {
    this.fetchData();
  },
  methods: {
    fetchData() {
      this.$q.loading.show();
      if (this.payrollGroupData) {
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
      }
      this.$q.loading.hide();
    },
  },
};
</script>
