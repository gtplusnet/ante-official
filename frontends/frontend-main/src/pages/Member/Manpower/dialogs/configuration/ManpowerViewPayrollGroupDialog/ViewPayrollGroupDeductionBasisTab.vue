<template>
  <q-card-section>
    <div class="col-6">
      <!-- Period Selection -->
      <ViewDeductionBasisSelectionPeriod
        :payroll-group-data="payrollGroupData"
      />
      <!-- Basis Selection -->
      <ViewDeductionBasisSelectionBasis
        :payroll-group-data="payrollGroupData"
      />
      <!-- Late and UnderTime Deduction -->
      <ViewDeductionBasisLateUnderTime :payroll-group-data="payrollGroupData" />

      <!-- Absent Deduction -->
      <div class="q-px-md">
        <div class="q-px-xs">
          <GInput
            required
            type="readonly"
            v-model="absentAmount"
            placeholder="Enter absent target hours amount."
            label="Absent Deduction"
          ></GInput>
        </div>
      </div>
    </div>
  </q-card-section>
</template>

<style scoped src="../ManpowerPayrollGroupDialog.scss"></style>

<script>
import GInput from "../../../../../../components/shared/form/GInput.vue";
import ViewDeductionBasisSelectionPeriod from './ViewDeductionBasisTabSelection/ViewDeductionBasisSelectionPeriod.vue';
import ViewDeductionBasisSelectionBasis from './ViewDeductionBasisTabSelection/ViewDeductionBasisSelectionBasis.vue';
import ViewDeductionBasisLateUnderTime from './ViewDeductionBasisTabSelection/ViewDeductionBasisLateUnderTime.vue';

export default {
  name: 'ViewPayrollGroupDeductionBasisTab',
  components: {
    ViewDeductionBasisSelectionPeriod,
    ViewDeductionBasisSelectionBasis,
    ViewDeductionBasisLateUnderTime,
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
        this.absentAmount = this.payrollGroupData.data.absentDeductionHours;
      }
      this.$q.loading.hide();
    },
  },
};
</script>
