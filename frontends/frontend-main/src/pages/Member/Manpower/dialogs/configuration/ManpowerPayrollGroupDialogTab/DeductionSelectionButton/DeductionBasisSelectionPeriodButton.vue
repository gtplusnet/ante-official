<template>
  <div class="q-px-md">
    <!-- Withholding Tax Period -->
    <div class="label q-pl-xs text-label-large">Withholding Tax</div>
    <div class="row wrap">
      <GButton
        class="q-ma-xs text-label-large"
        :variant="selectedWithholding === 'FIRST_PERIOD' ? 'filled' : 'outline'"
        :color="selectedWithholding === 'FIRST_PERIOD' ? 'primary' : 'grey'"
        @click="updateWithholdingSelection('FIRST_PERIOD')"
        label="First Period"
      />
      <GButton
        class="q-ma-xs text-label-large"
        :variant="selectedWithholding === 'LAST_PERIOD' ? 'filled' : 'outline'"
        :color="selectedWithholding === 'LAST_PERIOD' ? 'primary' : 'grey'"
        @click="updateWithholdingSelection('LAST_PERIOD')"
        label="Last Period"
      />
      <GButton
        class="q-ma-xs text-label-large"
        :variant="selectedWithholding === 'EVERY_PERIOD' ? 'filled' : 'outline'"
        :color="selectedWithholding === 'EVERY_PERIOD' ? 'primary' : 'grey'"
        @click="updateWithholdingSelection('EVERY_PERIOD')"
        label="Every Period"
      />
      <GButton
        class="q-ma-xs text-label-large"
        :variant="selectedWithholding === 'NOT_DEDUCTED' ? 'filled' : 'outline'"
        :color="selectedWithholding === 'NOT_DEDUCTED' ? 'primary' : 'grey'"
        @click="updateWithholdingSelection('NOT_DEDUCTED')"
        label="Not Deducted"
      />
    </div>
    <!-- SSS Period -->
    <div class="label q-pl-xs q-pt-sm text-label-large">SSS</div>
    <div class="row wrap">
      <GButton
        class="q-ma-xs text-label-large"
        :variant="selectedSss === 'FIRST_PERIOD' ? 'filled' : 'outline'"
        :color="selectedSss === 'FIRST_PERIOD' ? 'primary' : 'grey'"
        @click="updateSSSSelection('FIRST_PERIOD')"
        label="First Period"
      />
      <GButton
        class="q-ma-xs text-label-large"
        :variant="selectedSss === 'LAST_PERIOD' ? 'filled' : 'outline'"
        :color="selectedSss === 'LAST_PERIOD' ? 'primary' : 'grey'"
        @click="updateSSSSelection('LAST_PERIOD')"
        label="Last Period"
      />
      <GButton
        class="q-ma-xs text-label-large"
        :variant="selectedSss === 'EVERY_PERIOD' ? 'filled' : 'outline'"
        :color="selectedSss === 'EVERY_PERIOD' ? 'primary' : 'grey'"
        @click="updateSSSSelection('EVERY_PERIOD')"
        label="Every Period"
      />
      <GButton
        class="q-ma-xs text-label-large"
        :variant="selectedSss === 'NOT_DEDUCTED' ? 'filled' : 'outline'"
        :color="selectedSss === 'NOT_DEDUCTED' ? 'primary' : 'grey'"
        @click="updateSSSSelection('NOT_DEDUCTED')"
        label="Not Deducted"
      />
    </div>
    <!-- Philhealth Period -->
    <div class="label q-pl-xs q-pt-sm text-label-large">Philhealth</div>
    <div class="row wrap">
      <GButton
        class="q-ma-xs text-label-large"
        :variant="selectedPhilhealth === 'FIRST_PERIOD' ? 'filled' : 'outline'"
        :color="selectedPhilhealth === 'FIRST_PERIOD' ? 'primary' : 'grey'"
        @click="updatePhilhealthSelection('FIRST_PERIOD')"
        label="First Period"
      />
      <GButton
        class="q-ma-xs text-label-large"
        :variant="selectedPhilhealth === 'LAST_PERIOD' ? 'filled' : 'outline'"
        :color="selectedPhilhealth === 'LAST_PERIOD' ? 'primary' : 'grey'"
        @click="updatePhilhealthSelection('LAST_PERIOD')"
        label="Last Period"
      />
      <GButton
        class="q-ma-xs text-label-large"
        :variant="selectedPhilhealth === 'EVERY_PERIOD' ? 'filled' : 'outline'"
        :color="selectedPhilhealth === 'EVERY_PERIOD' ? 'primary' : 'grey'"
        @click="updatePhilhealthSelection('EVERY_PERIOD')"
        label="Every Period"
      />
      <GButton
        class="q-ma-xs text-label-large"
        :variant="selectedPhilhealth === 'NOT_DEDUCTED' ? 'filled' : 'outline'"
        :color="selectedPhilhealth === 'NOT_DEDUCTED' ? 'primary' : 'grey'"
        @click="updatePhilhealthSelection('NOT_DEDUCTED')"
        label="Not Deducted"
      />
    </div>
    <!-- Pag-ibig Period -->
    <div class="label q-pl-xs q-pt-sm text-label-large">Pag-Ibig</div>
    <div class="row wrap">
      <GButton
        class="q-ma-xs text-label-large"
        :variant="selectedPagibig === 'FIRST_PERIOD' ? 'filled' : 'outline'"
        :color="selectedPagibig === 'FIRST_PERIOD' ? 'primary' : 'grey'"
        @click="updatePagibigSelection('FIRST_PERIOD')"
        label="First Period"
      />
      <GButton
        class="q-ma-xs text-label-large"
        :variant="selectedPagibig === 'LAST_PERIOD' ? 'filled' : 'outline'"
        :color="selectedPagibig === 'LAST_PERIOD' ? 'primary' : 'grey'"
        @click="updatePagibigSelection('LAST_PERIOD')"
        label="Last Period"
      />
      <GButton
        class="q-ma-xs text-label-large"
        :variant="selectedPagibig === 'EVERY_PERIOD' ? 'filled' : 'outline'"
        :color="selectedPagibig === 'EVERY_PERIOD' ? 'primary' : 'grey'"
        @click="updatePagibigSelection('EVERY_PERIOD')"
        label="Every Period"
      />
      <GButton
        class="q-ma-xs text-label-large"
        :variant="selectedPagibig === 'NOT_DEDUCTED' ? 'filled' : 'outline'"
        :color="selectedPagibig === 'NOT_DEDUCTED' ? 'primary' : 'grey'"
        @click="updatePagibigSelection('NOT_DEDUCTED')"
        label="Not Deducted"
      />
    </div>
  </div>
</template>

<script>
import GButton from 'src/components/shared/buttons/GButton.vue';

export default {
  name: 'PeriodSelectionButton',
  components: {
    GButton
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
    };
  },
  mounted() {
    this.fetchData();
  },
  methods: {
    updateWithholdingSelection(value) {
      this.selectedWithholding = value;
      this.$emit('update-withholding', value);
    },
    updateSSSSelection(value) {
      this.selectedSss = value;
      this.$emit('update-sss', value);
    },
    updatePagibigSelection(value) {
      this.selectedPagibig = value;
      this.$emit('update-pagibig', value);
    },
    updatePhilhealthSelection(value) {
      this.selectedPhilhealth = value;
      this.$emit('update-philhealth', value);
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
      } else {
        this.selectedWithholding = 'EVERY_PERIOD';
        this.selectedSss = 'EVERY_PERIOD';
        this.selectedPhilhealth = 'EVERY_PERIOD';
        this.selectedPagibig = 'EVERY_PERIOD';
      }
      this.$q.loading.hide();
    },
  },
};
</script>
