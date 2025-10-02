<template>
  <div class="q-pb-sm q-px-md">
    <div class="label q-pl-xs q-pt-sm text-label-large">Late Deduction</div>
    <div class="row wrap">
      <GButton
        class="q-ma-xs text-label-large"
        :variant="selectedLateDeduction === 'BASED_ON_SALARY' ? 'filled' : 'outline'"
        :color="selectedLateDeduction === 'BASED_ON_SALARY' ? 'primary' : 'grey'"
        @click="updateLateSelection('BASED_ON_SALARY')"
        label="Based On Salary"
      />
      <GButton
        class="q-ma-xs text-label-large"
        :variant="selectedLateDeduction === 'NOT_DEDUCTED' ? 'filled' : 'outline'"
        :color="selectedLateDeduction === 'NOT_DEDUCTED' ? 'primary' : 'grey'"
        @click="updateLateSelection('NOT_DEDUCTED')"
        label="Not Deducted"
      />
      <GButton
        class="q-ma-xs text-label-large"
        :variant="selectedLateDeduction === 'CUSTOM' ? 'filled' : 'outline'"
        :color="selectedLateDeduction === 'CUSTOM' ? 'primary' : 'grey'"
        @click="updateLateSelection('CUSTOM')"
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
              type="number"
              min="0"
              v-model="lateAmount"
              label="Amount"
              @input="updateLateData"
            ></GInput>
          </div>
          <div class="col-6 q-px-xs">
            <label class="label text-label-large">Time Basis</label>
            <q-select
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
    <div class="label q-pl-xs q-pt-sm text-label-large">Undertime Deduction</div>
    <div class="row wrap">
      <GButton
        class="q-ma-xs text-label-large"
        :variant="selectedUndertimeDeduction === 'BASED_ON_SALARY' ? 'filled' : 'outline'"
        :color="selectedUndertimeDeduction === 'BASED_ON_SALARY' ? 'primary' : 'grey'"
        @click="updateUnderSelection('BASED_ON_SALARY')"
        label="Based On Salary"
      />
      <GButton
        class="q-ma-xs text-label-large"
        :variant="selectedUndertimeDeduction === 'NOT_DEDUCTED' ? 'filled' : 'outline'"
        :color="selectedUndertimeDeduction === 'NOT_DEDUCTED' ? 'primary' : 'grey'"
        @click="updateUnderSelection('NOT_DEDUCTED')"
        label="Not Deducted"
      />
      <GButton
        class="q-ma-xs text-label-large"
        :variant="selectedUndertimeDeduction === 'CUSTOM' ? 'filled' : 'outline'"
        :color="selectedUndertimeDeduction === 'CUSTOM' ? 'primary' : 'grey'"
        @click="updateUnderSelection('CUSTOM')"
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
              type="number"
              min="0"
              v-model="underAmount"
              label="Amount"
              @input="updateUnderData"
            ></GInput>
          </div>
          <div class="col-6 q-px-xs">
            <label class="label text-label-large">Time Basis</label>
            <q-select
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
import GInput from "src/components/shared/form/GInput.vue";
import GButton from 'src/components/shared/buttons/GButton.vue';

export default {
  name: 'LateDeductionUnderTimeDeductionSelectionButton',
  components: {
    GInput,
    GButton,
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
      selectedLateDeduction: 'BASED_ON_SALARY',
      selectedUndertimeDeduction: 'BASED_ON_SALARY',
      lateAmount: '',
      lateTimeBasis: 'PER_MINUTE',
      underAmount: '',
      underTimeBasis: 'PER_MINUTE',
    };
  },
  watch: {
    lateTimeBasis(newValue) {
      this.updateLateData(newValue);
    },
    underTimeBasis(newValue) {
      this.updateUnderData(newValue);
    },
  },
  mounted() {
    this.fetchData();
  },
  methods: {
    updateLateSelection(value) {
      this.selectedLateDeduction = value;
      this.$emit('update-late', value);
      if (value !== 'CUSTOM') {
        this.lateAmount = '';
        this.lateTimeBasis = 'PER_MINUTE';
        this.$emit('update-late-data', { lateAmount: '', lateTimeBasis: '' });
      }
    },
    updateLateData() {
      this.$emit('update-late-data', {
        amount: this.lateAmount,
        timeBasis: this.lateTimeBasis,
      });
    },
    updateUnderSelection(value) {
      this.selectedUndertimeDeduction = value;
      this.$emit('update-undertime', value);
      if (value !== 'CUSTOM') {
        this.underAmount = '';
        this.underTimeBasis = 'PER_MINUTE';
        this.$emit('update-undertime-data', {
          underAmount: '',
          underTimeBasis: '',
        });
      }
    },
    updateUnderData() {
      this.$emit('update-undertime-data', {
        amount: this.underAmount,
        timeBasis: this.underTimeBasis,
      });
    },
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
      } else {
        this.selectedLateDeduction = 'BASED_ON_SALARY';
        if (this.selectedLateDeduction === 'CUSTOM') {
          this.lateAmount = '';
          this.lateTimeBasis = 'PER_MINUTE';
        }
        this.selectedUndertimeDeduction = 'BASED_ON_SALARY';
        if (this.selectedUndertimeDeduction === 'CUSTOM') {
          this.underAmount = '';
          this.underTimeBasis = 'PER_MINUTE';
        }
      }

      this.$q.loading.hide();
    },
  },
};
</script>
