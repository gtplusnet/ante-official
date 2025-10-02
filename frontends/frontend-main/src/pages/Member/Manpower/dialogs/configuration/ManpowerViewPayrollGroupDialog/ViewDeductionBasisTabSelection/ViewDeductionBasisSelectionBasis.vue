<template>
  <div class="q-pb-sm q-px-md">
    <!-- SSS Basis -->
    <div class="label q-pl-xs text-label-large">SSS Basis</div>
    <div class="row wrap">
      <GButton
        class="q-ma-xs text-label-large"
        :variant="selectedSssBasis === 'BASIC_SALARY' ? 'filled' : 'outline'"
        :color="selectedSssBasis === 'BASIC_SALARY' ? 'primary' : 'grey'"
        :disabled="selectedSssBasis !== 'BASIC_SALARY'"
        label="Basic Salary"
      />
      <GButton
        class="q-ma-xs text-label-large"
        :variant="selectedSssBasis === 'BASIC_PAY' ? 'filled' : 'outline'"
        :color="selectedSssBasis === 'BASIC_PAY' ? 'primary' : 'grey'"
        :disabled="selectedSssBasis !== 'BASIC_PAY'"
        label="Basic Pay"
      />
      <GButton
        class="q-ma-xs text-label-large"
        :variant="selectedSssBasis === 'PRO_RATED_BASIC_PAY' ? 'filled' : 'outline'"
        :color="selectedSssBasis === 'PRO_RATED_BASIC_PAY' ? 'primary' : 'grey'"
        :disabled="selectedSssBasis !== 'PRO_RATED_BASIC_PAY'"
        label="Pro-Rated Basic Pay"
      />
      <GButton
        class="q-ma-xs text-label-large"
        :variant="selectedSssBasis === 'GROSS_PAY' ? 'filled' : 'outline'"
        :color="selectedSssBasis === 'GROSS_PAY' ? 'primary' : 'grey'"
        :disabled="selectedSssBasis !== 'GROSS_PAY'"
        label="Gross Pay"
      />
    </div>
    <!-- PHIC Basis -->
    <div class="label q-pl-xs text-label-large">PHIC Basis</div>
    <div class="row wrap">
      <GButton
        class="q-ma-xs text-label-large"
        :variant="selectedPHICBasis === 'BASIC_SALARY' ? 'filled' : 'outline'"
        :color="selectedPHICBasis === 'BASIC_SALARY' ? 'primary' : 'grey'"
        :disabled="selectedPHICBasis !== 'BASIC_SALARY'"
        label="Basic Salary"
      />
      <GButton
        class="q-ma-xs text-label-large"
        :variant="selectedPHICBasis === 'BASIC_PAY' ? 'filled' : 'outline'"
        :color="selectedPHICBasis === 'BASIC_PAY' ? 'primary' : 'grey'"
        :disabled="selectedPHICBasis !== 'BASIC_PAY'"
        label="Basic Pay"
      />
      <GButton
        class="q-ma-xs text-label-large"
        :variant="selectedPHICBasis === 'PRO_RATED_BASIC_PAY' ? 'filled' : 'outline'"
        :color="selectedPHICBasis === 'PRO_RATED_BASIC_PAY' ? 'primary' : 'grey'"
        :disabled="selectedPHICBasis !== 'PRO_RATED_BASIC_PAY'"
        label="Pro-Rated Basic Pay"
      />
      <GButton
        class="q-ma-xs text-label-large"
        :variant="selectedPHICBasis === 'GROSS_PAY' ? 'filled' : 'outline'"
        :color="selectedPHICBasis === 'GROSS_PAY' ? 'primary' : 'grey'"
        :disabled="selectedPHICBasis !== 'GROSS_PAY'"
        label="Gross Pay"
      />
    </div>
  </div>
</template>

<script>
import GButton from 'src/components/shared/buttons/GButton.vue';

export default {
  name: 'ViewBasisSelectionButton',
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
      selectedSssBasis: '',
      selectedPHICBasis: '',
    };
  },
  mounted() {
    this.fetchData();
  },
  methods: {
    fetchData() {
      this.$q.loading.show();
      if (this.payrollGroupData) {
        this.selectedSssBasis =
          this.payrollGroupData.data.deductionBasisSSS.key;
        this.selectedPHICBasis =
          this.payrollGroupData.data.deductionBasisPhilhealth.key;
      }
      this.$q.loading.hide();
    },
  },
};
</script>
