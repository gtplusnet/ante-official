<template>
  <div class="q-px-md">
    <!-- SSS Basis -->
    <div class="label q-pl-xs q-pt-sm text-label-large">SSS Basis</div>
    <div class="row wrap">
      <GButton
        class="q-ma-xs text-label-large"
        :variant="selectedSssBasis === 'BASIC_SALARY' ? 'filled' : 'outline'"
        :color="selectedSssBasis === 'BASIC_SALARY' ? 'primary' : 'grey'"
        @click="updateSSSBasisSelection('BASIC_SALARY')"
        label="Basic Salary"
      />
      <GButton
        class="q-ma-xs text-label-large"
        :variant="selectedSssBasis === 'BASIC_PAY' ? 'filled' : 'outline'"
        :color="selectedSssBasis === 'BASIC_PAY' ? 'primary' : 'grey'"
        @click="updateSSSBasisSelection('BASIC_PAY')"
        label="Basic Pay"
      />
      <GButton
        class="q-ma-xs text-label-large"
        :variant="selectedSssBasis === 'PRO_RATED_BASIC_PAY' ? 'filled' : 'outline'"
        :color="selectedSssBasis === 'PRO_RATED_BASIC_PAY' ? 'primary' : 'grey'"
        @click="updateSSSBasisSelection('PRO_RATED_BASIC_PAY')"
        label="Pro-Rated Basic Pay"
      />
      <GButton
        class="q-ma-xs text-label-large"
        :variant="selectedSssBasis === 'GROSS_PAY' ? 'filled' : 'outline'"
        :color="selectedSssBasis === 'GROSS_PAY' ? 'primary' : 'grey'"
        @click="updateSSSBasisSelection('GROSS_PAY')"
        label="Gross Pay"
      />
    </div>
    <!-- PHIC Basis -->
    <div class="label q-pl-xs q-pt-sm">PHIC Basis</div>
    <div class="row wrap">
      <GButton
        class="q-ma-xs text-label-large"
        :variant="selectedPHICBasis === 'BASIC_SALARY' ? 'filled' : 'outline'"
        :color="selectedPHICBasis === 'BASIC_SALARY' ? 'primary' : 'grey'"
        @click="updatePHICSelection('BASIC_SALARY')"
        label="Basic Salary"
      />
      <GButton
        class="q-ma-xs text-label-large"
        :variant="selectedPHICBasis === 'BASIC_PAY' ? 'filled' : 'outline'"
        :color="selectedPHICBasis === 'BASIC_PAY' ? 'primary' : 'grey'"
        @click="updatePHICSelection('BASIC_PAY')"
        label="Basic Pay"
      />
      <GButton
        class="q-ma-xs text-label-large"
        :variant="selectedPHICBasis === 'PRO_RATED_BASIC_PAY' ? 'filled' : 'outline'"
        :color="selectedPHICBasis === 'PRO_RATED_BASIC_PAY' ? 'primary' : 'grey'"
        @click="updatePHICSelection('PRO_RATED_BASIC_PAY')"
        label="Pro-Rated Basic Pay"
      />
      <GButton
        class="q-ma-xs text-label-large"
        :variant="selectedPHICBasis === 'GROSS_PAY' ? 'filled' : 'outline'"
        :color="selectedPHICBasis === 'GROSS_PAY' ? 'primary' : 'grey'"
        @click="updatePHICSelection('GROSS_PAY')"
        label="Gross Pay"
      />
    </div>
  </div>
</template>

<script>
import GButton from 'src/components/shared/buttons/GButton.vue';

export default {
  name: 'BasisSelectionButton',
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
      selectedSssBasis: 'BASIC_SALARY',
      selectedPHICBasis: 'BASIC_SALARY',
    };
  },
  mounted() {
    this.fetchData();
  },
  methods: {
    updateSSSBasisSelection(value) {
      this.selectedSssBasis = value;
      this.$emit('update-sssbasis', value);
    },
    updatePHICSelection(value) {
      this.selectedPHICBasis = value;
      this.$emit('update-phicbasis', value);
    },
    fetchData() {
      this.$q.loading.show();
      if (this.payrollGroupData) {
        this.selectedSssBasis =
          this.payrollGroupData.data.deductionBasisSSS.key;
        this.selectedPHICBasis =
          this.payrollGroupData.data.deductionBasisPhilhealth.key;
      } else {
        this.selectedSssBasis = 'BASIC_SALARY';
        this.selectedPHICBasis = 'BASIC_SALARY';
      }
      this.$q.loading.hide();
    },
  },
};
</script>
