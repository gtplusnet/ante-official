<template>
  <q-card-section>
    <div class="col-6 q-px-md">
      <GInput
        required
        :type="!this.payrollGroupData ? 'text' : 'readonly'"
        class="q-mb-md"
        v-model="payrollCode"
        label="Payroll Code"
      ></GInput>
    </div>
    <div class="col-6 q-px-md">
      <div class="label text-label-large">Salary Computation</div>
      <div class="salary row wrap">
        <q-btn
          no-caps
          outline
          :color="selectedComputation === 'FIXED_RATE' ? 'primary' : 'grey'"
          :disable="selectedComputation !== 'FIXED_RATE'"
          class="text-label-large"
        >
          Fixed Rate
        </q-btn>
        <q-btn
          no-caps
          outline
          :color="selectedComputation === 'DAILY_RATE' ? 'primary' : 'grey'"
          :disable="selectedComputation !== 'DAILY_RATE'"
          class="text-label-large"
        >
          Daily Rate
        </q-btn>
        <q-btn
          no-caps
          outline
          :color="selectedComputation === 'MONTHLY_RATE' ? 'primary' : 'grey'"
          :disable="selectedComputation !== 'MONTHLY_RATE'"
          class="text-label-large"
        >
          Monthly Rate
        </q-btn>
      </div>
    </div>
    <div class="q-mx-md q-pt-md">
      <label class="label text-label-large">Cut-off</label>
      <div class="row items-center q-pt-xs">
        <q-select
          readonly
          required
          class="text-left col-6 q-pr-sm text-body-medium"
          v-model="cutOff"
          :options="cutOffList"
          option-label="label"
          option-value="value"
          emit-value
          map-options
          outlined
          dense
        ></q-select>
      </div>
    </div>
  </q-card-section>
</template>

<style scoped src="../ManpowerPayrollGroupDialog.scss"></style>

<script>
import GInput from "../../../../../../components/shared/form/GInput.vue";

export default {
  name: 'ViewPayrollGroupBasic',
  components: {
    GInput,
  },
  props: {
    payrollGroupData: {
      type: Object || null,
      default: null,
    },
  },
  data() {
    return {};
  },
  mounted() {
    this.fetchData();
  },
  methods: {
    fetchData() {
      this.$q.loading.show();

      if (this.payrollGroupData) {
        this.payrollCode = this.payrollGroupData.data.payrollGroupCode;
        this.cutOff = this.payrollGroupData.data.cutoff.cutoffCode;
        this.selectedComputation =
          this.payrollGroupData.data.salaryRateType.key;
      }
      this.$q.loading.hide();
    },
  },
};
</script>
