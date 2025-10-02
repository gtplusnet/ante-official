<template>
  <div class="q-pb-sm q-px-md">
    <div class="label q-pl-xs text-label-large">Late Deduction</div>
    <div class="row wrap">
      <GButton
        class="q-ma-xs"
        :variant="selectedLateDeduction === 'BASED_ON_SALARY' ? 'filled' : 'outline'"
        :color="selectedLateDeduction === 'BASED_ON_SALARY' ? 'primary' : 'grey'"
        :disabled="selectedComputation !== 'BASED_ON_SALARY'"
        label="Based On Salary"
      />
      <GButton
        class="q-ma-xs"
        :variant="selectedLateDeduction === 'NOT_DEDUCTED' ? 'filled' : 'outline'"
        :color="selectedLateDeduction === 'NOT_DEDUCTED' ? 'primary' : 'grey'"
        :disabled="selectedComputation !== 'NOT_DEDUCTED'"
        label="Not Deducted"
      />
      <GButton
        class="q-ma-xs"
        :variant="selectedLateDeduction === 'CUSTOM' ? 'filled' : 'outline'"
        :color="selectedLateDeduction === 'CUSTOM' ? 'primary' : 'grey'"
        :disabled="selectedComputation !== 'CUSTOM'"
        label="Custom"
      />
    </div>
    <div class="q-px-xs">
      <div
        v-if="selectedLateDeduction === 'CUSTOM'"
        class="custom-container q-mt-xs q-pa-md"
      >
        <div class="row">
          <div class="col-6 q-px-xs">
            <GInput
              required
              type="readonly"
              v-model="lateAmount"
              label="Amount"
            ></GInput>
          </div>
          <div class="col-6 q-px-xs">
            <label class="label text-label-large">Time Basis</label>
            <q-select
              readonly
              class="q-pt-xs"
              required
              type="text"
              v-model="lateTimeBasis"
              :options="lateTimeBasisList"
              option-label="label"
              option-value="value"
              emit-value
              map-options
              outlined
              dense
            ></q-select>
          </div>
        </div>
      </div>
    </div>
    <div class="label q-pl-xs text-label-large">Undertime Deduction</div>
    <div class="row wrap">
      <GButton
        class="q-ma-xs"
        :variant="selectedUndertimeDeduction === 'BASED_ON_SALARY' ? 'filled' : 'outline'"
        :color="selectedUndertimeDeduction === 'BASED_ON_SALARY' ? 'primary' : 'grey'"
        :disabled="selectedComputation !== 'BASED_ON_SALARY'"
        label="Based On Salary"
      />
      <GButton
        class="q-ma-xs"
        :variant="selectedUndertimeDeduction === 'NOT_DEDUCTED' ? 'filled' : 'outline'"
        :color="selectedUndertimeDeduction === 'NOT_DEDUCTED' ? 'primary' : 'grey'"
        :disabled="selectedComputation !== 'NOT_DEDUCTED'"
        label="Not Deducted"
      />
      <GButton
        class="q-ma-xs"
        :variant="selectedUndertimeDeduction === 'CUSTOM' ? 'filled' : 'outline'"
        :color="selectedUndertimeDeduction === 'CUSTOM' ? 'primary' : 'grey'"
        :disabled="selectedComputation !== 'CUSTOM'"
        label="Custom"
      />
    </div>
    <div class="q-px-xs">
      <div
        v-if="selectedUndertimeDeduction === 'CUSTOM'"
        class="custom-container q-mt-xs q-pa-md"
      >
        <div class="row">
          <div class="col-6 q-px-xs">
            <GInput
              required
              type="readonly"
              v-model="underAmount"
              label="Amount"
            ></GInput>
          </div>
          <div class="col-6 q-px-xs">
            <label class="label text-label-large">Time Basis</label>
            <q-select
              readonly
              class="q-pt-xs"
              required
              type="text"
              v-model="underTimeBasis"
              :options="underTimeBasisList"
              option-label="label"
              option-value="value"
              emit-value
              map-options
              outlined
              dense
            ></q-select>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped src="../../ManpowerPayrollGroupDialog.scss"></style>

<script>
import GButton from 'src/components/shared/buttons/GButton.vue';
import GInput from "../../../../../../../components/shared/form/GInput.vue";

export default {
  name: 'ViewDeductionBasisLateUnderTime',
  components: {
    GButton,
    GInput,
  },
  props: {
    payrollGroupData: {
      type: Object || null,
      default: null,
    },
  },
  data() {
    return {
      lateTimeBasisList: [
        { label: 'Per Minute', value: 'PER_MINUTE' },
        { label: 'Per Hour', value: 'PER_HOUR' },
      ],
      underTimeBasisList: [
        { label: 'Per Minute', value: 'PER_MINUTE' },
        { label: 'Per Hour', value: 'PER_HOUR' },
      ],
      selectedLateDeduction: '',
      selectedUndertimeDeduction: '',
      lateAmount: '',
      lateTimeBasis: '',
      underAmount: '',
      underTimeBasis: '',
    };
  },

  mounted() {
    this.fetchData();
  },
  methods: {
    fetchData() {
      this.$q.loading.show();

      if (this.payrollGroupData) {
        this.selectedLateDeduction =
          this.payrollGroupData.data.lateDeductionType.key;
        if (this.selectedLateDeduction === 'CUSTOM') {
          this.lateAmount =
            this.payrollGroupData.data.lateDeductionCustom.amount;
          this.lateTimeBasis =
            this.payrollGroupData.data.lateDeductionCustom.timeBasis.key;
        }
        this.selectedUndertimeDeduction =
          this.payrollGroupData.data.undertimeDeductionType.key;
        if (this.selectedUndertimeDeduction === 'CUSTOM') {
          this.underAmount =
            this.payrollGroupData.data.undertimeDeductionCustom.amount;
          this.underTimeBasis =
            this.payrollGroupData.data.undertimeDeductionCustom.timeBasis.key;
        }
      }

      this.$q.loading.hide();
    },
  },
};
</script>
