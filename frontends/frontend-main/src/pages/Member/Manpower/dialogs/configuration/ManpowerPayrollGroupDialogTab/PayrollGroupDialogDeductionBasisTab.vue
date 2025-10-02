<template>
  <q-card-section>
    <div class="col-6">
      <!-- Period Selection -->
      <DeductionBasisSelectionPeriodButton
        @update-withholding="handleWithholdingUpdate"
        @update-sss="handleSssUpdate"
        @update-pagibig="handlePagibigUpdate"
        @update-philhealth="handlePhilhealthUpdate"
        :payroll-group-data="payrollGroupData"
      />
      <!-- Basis Selection -->
      <DeductionBasisSelectionBasisButton
        @update-sssbasis="handleSSSBasisUpdate"
        @update-phicbasis="handlePHICBasisUpdate"
        :payroll-group-data="payrollGroupData"
      />
      <!-- Late and UnderTime Deduction -->
      <DeductionBasisLateUnderTimeSelectionButton
        @update-late="selectedLateDeduction = $event"
        @update-late-data="updateLateData"
        @update-undertime="selectedUndertimeDeduction = $event"
        @update-undertime-data="updateUnderData"
        :payroll-group-data="payrollGroupData"
      />

      <!-- Absent Deduction -->
      <div class="q-px-md">
        <div class="q-px-xs">
          <GInput
            required
            type="text"
            v-model="absentAmount"
            placeholder="Enter absent target hours amount."
            label="Absent Deduction (Hours)"
          ></GInput>
        </div>
      </div>
    </div>
  </q-card-section>
</template>

<style scoped src="../ManpowerPayrollGroupDialog.scss"></style>

<script>
import GInput from "../../../../../../components/shared/form/GInput.vue";
import DeductionBasisSelectionPeriodButton from './DeductionSelectionButton/DeductionBasisSelectionPeriodButton.vue';
import DeductionBasisSelectionBasisButton from './DeductionSelectionButton/DeductionBasisSelectionBasisButton.vue';
import DeductionBasisLateUnderTimeSelectionButton from './DeductionSelectionButton/DeductionBasisLateUnderTimeSelectionButton.vue';

export default {
  name: 'PayrollGroupDeductionBasis',
  components: {
    DeductionBasisSelectionPeriodButton,
    DeductionBasisSelectionBasisButton,
    DeductionBasisLateUnderTimeSelectionButton,
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
      selectedWithholding: 'EVERY_PERIOD',
      selectedSss: 'EVERY_PERIOD',
      selectedPhilhealth: 'EVERY_PERIOD',
      selectedPagibig: 'EVERY_PERIOD',
      selectedSSSBasis: 'BASIC_SALARY',
      selectedPHICBasis: 'BASIC_SALARY',
      selectedLateDeduction: 'BASED_ON_SALARY',
      selectedUndertimeDeduction: 'BASED_ON_SALARY',
      lateAmount: '',
      lateTimeBasis: 'PER_MINUTE',
      underAmount: '',
      underTimeBasis: 'PER_MINUTE',
      absentAmount: '1',
    };
  },
  mounted() {
    this.emitDeductionData();
    this.fetchData();
  },
  watch: {
    absentAmount(newValue) {
      this.emitDeductionData(newValue);
    },
  },
  methods: {
    handleWithholdingUpdate(value) {
      this.selectedWithholding = value;
      this.emitDeductionData();
    },
    handleSssUpdate(value) {
      this.selectedSss = value;
      this.emitDeductionData();
    },
    handlePhilhealthUpdate(value) {
      this.selectedPhilhealth = value;
      this.emitDeductionData();
    },
    handlePagibigUpdate(value) {
      this.selectedPagibig = value;
      this.emitDeductionData();
    },
    handleSSSBasisUpdate(value) {
      this.selectedSSSBasis = value;
      this.emitDeductionData();
    },
    handlePHICBasisUpdate(value) {
      this.selectedPHICBasis = value;
      this.emitDeductionData();
    },
    updateLateData(data) {
      this.lateAmount = data.amount;
      this.lateTimeBasis = data.timeBasis;
      this.emitDeductionData();
    },
    updateUnderData(data) {
      this.underAmount = data.amount;
      this.underTimeBasis = data.timeBasis;
      this.emitDeductionData();
    },
    emitDeductionData() {
      this.$emit('update-deduction-data', {
        withholding: this.selectedWithholding,
        sss: this.selectedSss,
        philhealth: this.selectedPhilhealth,
        pagibig: this.selectedPagibig,
        SSSBasis: this.selectedSSSBasis,
        phicBasis: this.selectedPHICBasis,
        lateDeduction: {
          type: this.selectedLateDeduction,
          amount: this.lateAmount,
          timeBasis: this.lateTimeBasis,
        },
        undertimeDeduction: {
          type: this.selectedUndertimeDeduction,
          amount: this.underAmount,
          timeBasis: this.underTimeBasis,
        },
        absentAmount: this.absentAmount,
      });
    },
    fetchData() {
      this.$q.loading.show();

      if (this.payrollGroupData) {
        this.selectedWithholding =
          this.payrollGroupData.data.deductionPeriodWitholdingTax.key;
        this.selectedSss = this.payrollGroupData.data.deductionPeriodSSS.key;
        this.selectedPhilhealth =
          this.payrollGroupData.data.deductionPeriodPhilhealth.key;
        this.selectedPagibig =
          this.payrollGroupData.data.deductionPeriodPagibig.key;
        this.selectedPHICBasis =
          this.payrollGroupData.data.deductionBasisPhilhealth.key;
        this.selectedSSSBasis =
          this.payrollGroupData.data.deductionBasisSSS.key;
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
        this.absentAmount = this.payrollGroupData.data.absentDeductionHours;
      } else {
        this.selectedWithholding = 'EVERY_PERIOD';
        this.selectedSss = 'EVERY_PERIOD';
        this.selectedPhilhealth = 'EVERY_PERIOD';
        this.selectedPagibig = 'EVERY_PERIOD';
        this.selectedSSSBasis = 'BASIC_SALARY';
        this.selectedPHICBasis = 'BASIC_SALARY';
        this.selectedLateDeduction = 'BASED_ON_SALARY';
        this.selectedUndertimeDeduction = 'BASED_ON_SALARY';
        this.lateAmount = '';
        this.lateTimeBasis = '';
        this.underAmount = '';
        this.underTimeBasis = '';
        this.absentAmount = '';
        this.absentAmount = '1';
      }
      this.$q.loading.hide();
    },
  },
};
</script>
