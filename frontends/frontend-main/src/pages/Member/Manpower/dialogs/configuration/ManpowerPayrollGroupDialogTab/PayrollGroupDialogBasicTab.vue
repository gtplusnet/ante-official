<template>
  <div class="q-px-md">
    <div class="col-6 q-px-md">
      <GInput
        :type="!this.payrollGroupData ? 'text' : 'readonly'"
        class="q-mb-md"
        v-model="payrollCode"
        label="Payroll Code"
        @input="updatePayrollCodeData"
      ></GInput>
    </div>
    <div class="col-6 q-px-md">
      <div class="label text-label-large">Salary Computation</div>
      <div class="salary row wrap">
        <GButton
          :variant="selectedComputation === 'FIXED_RATE' ? 'filled' : 'outline'"
          class="text-label-large q-mr-sm"
          :color="selectedComputation === 'FIXED_RATE' ? 'primary' : 'grey'"
          @click="updateSelection('FIXED_RATE')"
          label="Fixed Rate"
        />
        <GButton
          :variant="selectedComputation === 'DAILY_RATE' ? 'filled' : 'outline'"
          class="text-label-large q-mr-sm"
          :color="selectedComputation === 'DAILY_RATE' ? 'primary' : 'grey'"
          @click="updateSelection('DAILY_RATE')"
          label="Daily Rate"
        />
        <GButton
          :variant="selectedComputation === 'MONTHLY_RATE' ? 'filled' : 'outline'"
          class="text-label-large"
          :color="selectedComputation === 'MONTHLY_RATE' ? 'primary' : 'grey'"
          @click="updateSelection('MONTHLY_RATE')"
          label="Monthly Rate"
        />
      </div>
    </div>
    <div class="q-mx-md q-pt-md">
      <label class="label text-label-large">Cut-off</label>
      <div class="row items-center q-pt-xs">
        <q-select
          required
          class="custom-select col-6 q-mr-sm text-body-medium"
          v-model="cutOff"
          :options="cutOffList"
          option-label="label"
          option-value="value"
          emit-value
          map-options
          outlined
          dense
        ></q-select>
        <GButton
          class="button"
          color="accent"
          variant="outline"
          @click="openAddCutoff"
          icon="add"
        />
      </div>
    </div>
  </div>

  <!-- ADD Cutoff Dialog -->
  <AddEditCutOffDialog
    @close="openCutOffDialog = false"
    @saveDone="
      (data) => {
        this.$nextTick(() => newSelect(data));
      }
    "
    v-model="openCutOffDialog"
  />
</template>

<style scoped src="../ManpowerPayrollGroupDialog.scss"></style>

<script>
import { api } from 'src/boot/axios';
import GInput from 'src/components/shared/form/GInput.vue';
import GButton from 'src/components/shared/buttons/GButton.vue';
import AddEditCutOffDialog from '../ManpowerAddEditCutOffDialog.vue';

export default {
  name: 'PayrollGroupBasic',
  components: {
    AddEditCutOffDialog,
    GInput,
    GButton,
  },
  emits: ['update-computation', 'update-payroll-code'],

  props: {
    payrollGroupData: {
      type: Object || null,
      default: null,
    },
  },
  data() {
    return {
      openCutOffDialog: false,
      cutOffList: [],
      cutOff: null,
      payrollCode: '',
      selectedComputation: '',
    };
  },
  mounted() {
    this.fetchCutOffList();
    this.fetchData();
  },
  watch: {
    cutOff(newValue) {
      this.updatePayrollCodeData(newValue);
    },
    payrollCode(newValue) {
      this.updatePayrollCodeData(newValue);
    },
    selectedComputation(newValue) {
      this.updatePayrollCodeData(newValue);
    },
  },
  methods: {
    newSelect(newCutOffData) {
      try {
        this.fetchCutOffList()
          .then(() => {
            const cutOOffName = newCutOffData.data.cutoffCode.toLowerCase();
            const existsInList = this.cutOffList.find(
              (item) => item.label.toLowerCase() === cutOOffName
            );

            if (existsInList && newCutOffData.data && newCutOffData.data.id) {
              this.$nextTick(() => {
                this.cutOff = newCutOffData.data.id;
                console.log('Updated cutOff:', this.cutOff);
              });
            }
          })
          .catch((error) => {
            this.handleAxiosError(error);
          });
      } catch (error) {
        this.handleAxiosError(error);
      }
    },
    openAddCutoff() {
      this.openCutOffDialog = true;
    },
    updateSelection(value) {
      this.selectedComputation = value;
      this.$emit('update-computation', value);
    },
    updatePayrollCodeData() {
      this.$emit('update-payroll-code', {
        payrollCode: this.payrollCode,
        cutOff: this.cutOff,
      });
    },
    fetchCutOffList() {
      this.$q.loading.show();

      api
        .put('hr-configuration/cutoff/table?page=1&perPage=999')
        .then((response) => {
          if (response.data && response.data.list) {
            const list = response.data.list;

            this.cutOffList = list.map((cutoff) => ({
              label: cutoff.cutoffCode,
              value: cutoff.id,
            }));

            const latestCutOff = list.reduce((latest, current) => {
              return current.id > latest.id ? current : latest;
            });

            if (!this.payrollGroupData) {
              this.cutOff = latestCutOff.id;
            }
          } else {
            this.cutOffList = [];
          }
        })
        .catch((error) => {
          this.handleAxiosError(error);
        })
        .finally(() => {
          this.$q.loading.hide();
        });
    },
    fetchData() {
      this.$q.loading.show();

      if (this.payrollGroupData) {
        this.payrollCode = this.payrollGroupData.data.payrollGroupCode;
        this.cutOff = this.payrollGroupData.data.cutoff.id;
        this.selectedComputation =
          this.payrollGroupData.data.salaryRateType.key;
      } else {
        this.payrollCode = '';
        this.cutOff = this.latestCutoffId || 1;
        this.selectedComputation = 'FIXED_RATE';
        this.$emit('update-computation', 'FIXED_RATE');
      }
      this.$q.loading.hide();
    },
  },
};
</script>
