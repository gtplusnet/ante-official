<template>
  <div class="q-pb-sm q-px-md">
    <!-- Withholding Tax Period -->
    <div class="label q-pl-xs text-label-large">Withholding Tax</div>
    <div class="row wrap">
      <GButton
        class="q-ma-xs text-label-large"
        variant="outline"
        :color="selectedWithholding === 'FIRST_PERIOD' ? 'primary' : 'grey'"
        :disabled="selectedWithholding !== 'FIRST_PERIOD'"
        label="First Period"
      />
      <GButton
        class="q-ma-xs text-label-large"
        variant="outline"
        :color="selectedWithholding === 'LAST_PERIOD' ? 'primary' : 'grey'"
        :disabled="selectedWithholding !== 'LAST_PERIOD'"
        label="Last Period"
      />
      <GButton
        class="q-ma-xs text-label-large"
        variant="outline"
        :color="selectedWithholding === 'EVERY_PERIOD' ? 'primary' : 'grey'"
        :disabled="selectedWithholding !== 'EVERY_PERIOD'"
        label="Every Period"
      />
      <GButton
        class="q-ma-xs text-label-large"
        variant="outline"
        :color="selectedWithholding === 'NOT_DEDUCTED' ? 'primary' : 'grey'"
        :disabled="selectedWithholding !== 'NOT_DEDUCTED'"
        label="Not Deducted"
      />
    </div>
    <!-- SSS Period -->
    <div class="label q-pl-xs text-label-large">SSS</div>
    <div class="row wrap">
      <GButton
        class="q-ma-xs text-label-large"
        variant="outline"
        :color="selectedSss === 'FIRST_PERIOD' ? 'primary' : 'grey'"
        :disabled="selectedSss !== 'FIRST_PERIOD'"
        label="First Period"
      />
      <GButton
        class="q-ma-xs text-label-large"
        variant="outline"
        :color="selectedSss === 'LAST_PERIOD' ? 'primary' : 'grey'"
        :disabled="selectedSss !== 'LAST_PERIOD'"
        label="Last Period"
      />
      <GButton
        class="q-ma-xs text-label-large"
        variant="outline"
        :color="selectedSss === 'EVERY_PERIOD' ? 'primary' : 'grey'"
        :disabled="selectedSss !== 'EVERY_PERIOD'"
        label="Every Period"
      />
      <GButton
        class="q-ma-xs text-label-large"
        variant="outline"
        :color="selectedSss === 'NOT_DEDUCTED' ? 'primary' : 'grey'"
        :disabled="selectedSss !== 'NOT_DEDUCTED'"
        label="Not Deducted"
      />
    </div>
    <!-- Philhealth Period -->
    <div class="label q-pl-xs text-label-large">Philhealth</div>
    <div class="row wrap">
      <GButton
        class="q-ma-xs text-label-large"
        variant="outline"
        :color="selectedPhilhealth === 'FIRST_PERIOD' ? 'primary' : 'grey'"
        :disabled="selectedPhilhealth !== 'FIRST_PERIOD'"
        label="First Period"
      />
      <GButton
        class="q-ma-xs text-label-large"
        variant="outline"
        :color="selectedPhilhealth === 'LAST_PERIOD' ? 'primary' : 'grey'"
        :disabled="selectedPhilhealth !== 'LAST_PERIOD'"
        label="Last Period"
      />
      <GButton
        class="q-ma-xs text-label-large"
        variant="outline"
        :color="selectedPhilhealth === 'EVERY_PERIOD' ? 'primary' : 'grey'"
        :disabled="selectedPhilhealth !== 'EVERY_PERIOD'"
        label="Every Period"
      />
      <GButton
        class="q-ma-xs text-label-large"
        variant="outline"
        :color="selectedPhilhealth === 'NOT_DEDUCTED' ? 'primary' : 'grey'"
        :disabled="selectedPhilhealth !== 'NOT_DEDUCTED'"
        label="Not Deducted"
      />
    </div>
    <!-- Pag-ibig Period -->
    <div class="label q-pl-xs text-label-large">Pag-Ibig</div>
    <div class="row wrap">
      <GButton
        class="q-ma-xs text-label-large"
        variant="outline"
        :color="selectedPagibig === 'FIRST_PERIOD' ? 'primary' : 'grey'"
        :disabled="selectedPagibig !== 'FIRST_PERIOD'"
        label="First Period"
      />
      <GButton
        class="q-ma-xs text-label-large"
        variant="outline"
        :color="selectedPagibig === 'LAST_PERIOD' ? 'primary' : 'grey'"
        :disabled="selectedPagibig !== 'LAST_PERIOD'"
        label="Last Period"
      />
      <GButton
        class="q-ma-xs text-label-large"
        variant="outline"
        :color="selectedPagibig === 'EVERY_PERIOD' ? 'primary' : 'grey'"
        :disabled="selectedPagibig !== 'EVERY_PERIOD'"
        label="Every Period"
      />
      <GButton
        class="q-ma-xs text-label-large"
        variant="outline"
        :color="selectedPagibig === 'NOT_DEDUCTED' ? 'primary' : 'grey'"
        :disabled="selectedPagibig !== 'NOT_DEDUCTED'"
        label="Not Deducted"
      />
    </div>
  </div>
</template>

<script>
import GButton from 'src/components/shared/buttons/GButton.vue';

export default {
  name: 'ViewPeriodSelectionButton',
  components: {
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
      selectedWithholding: '',
      selectedSss: '',
      selectedPhilhealth: '',
      selectedPagibig: '',
    };
  },
  mounted() {
    this.fetchData();
  },
  methods: {
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
      }
      this.$q.loading.hide();
    },
  },
};
</script>
