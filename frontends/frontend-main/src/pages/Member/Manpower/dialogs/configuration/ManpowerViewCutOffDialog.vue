<template>
  <q-dialog ref="dialog" @before-show="fetchData">
    <TemplateDialog minWidth="400px">
    <template #DialogIcon>
      <q-icon name="visibility" size="22px" class="q-pr-xs" />
    </template>
    <template #DialogTitle>
      View Cut-Off
    </template>
    <template #DialogContent>
      <section class="q-gutter-y-md q-pa-md">
        <div>
          <label class="text-label-large">Cut-Off Code</label>
          <q-input
            readonly
            v-model="cutoffCode"
            outlined
            dense
            required
            type="text"
            class="text-body-medium"
          />
        </div>

        <div>
          <label class="text-label-large">Payroll Period</label>
          <q-select
            readonly
            outlined
            dense
            v-model="selectedPayrollPeriod"
            :options="payrollPeriods"
            option-value="key"
            option-label="label"
            emit-value
            map-options
            class="full-width text-body-medium"
            required
          />
        </div>

        <!-- Weekly Selection -->
        <div v-if="selectedPayrollPeriod === 'WEEKLY'">
          <div>
            <label class="text-label-large">Day</label>
            <q-select
              readonly
              outlined
              dense
              v-model="selectedCutoffDay"
              :options="weeklyCutoffOptions"
              option-value="key"
              option-label="label"
              emit-value
              map-options
              class="full-width q-pt-xs text-body-medium"
              required
            />
          </div>
        </div>

        <!-- Semi-Monthly Selection -->
        <div v-if="selectedPayrollPeriod === 'SEMIMONTHLY'" class="q-gutter-y-md">
          <div>
            <label class="text-label-large">First Period</label>
            <q-select
              readonly
              outlined
              dense
              v-model="selectedFirstCutoff"
              :options="firstCutoffOptions"
              option-value="label"
              option-label="label"
              emit-value
              map-options
              class="full-width q-pt-xs text-body-medium"
              required
            />
          </div>

          <div>
            <label class="text-label-large">Last Period</label>
            <q-select
              readonly
              outlined
              dense
              v-model="selectedLastCutoff"
              :options="lastCutoffOptions"
              option-value="label"
              option-label="label"
              emit-value
              map-options
              class="full-width q-pt-xs text-body-medium"
              required
            />
          </div>
        </div>

        <!-- Monthly Selection -->
        <div v-if="selectedPayrollPeriod === 'MONTHLY'">
          <div>
            <label class="text-label-large">Period</label>
            <q-select
              readonly
              outlined
              dense
              v-model="selectedCutoffDay"
              :options="monthlyCutoffOptions"
              option-value="label"
              option-label="label"
              emit-value
              map-options
              class="full-width q-pt-xs text-body-medium"
              required
            />
          </div>
        </div>

        <!-- Processing Period (Days) for WEEKLY, MONTHLY, and SEMI_MONTHLY -->
        <div
          v-if="
            selectedPayrollPeriod === 'WEEKLY' ||
            selectedPayrollPeriod === 'SEMIMONTHLY' ||
            selectedPayrollPeriod === 'MONTHLY'
          "
        >
          <div>
            <label class="text-label-large">Processing Period (Days)</label>
            <q-input
              readonly
              v-model="releaseProcessingDays"
              outlined
              dense
              type="number"
              min="0"
              required
              class="full-width q-pt-xs text-body-medium"
            />
          </div>
        </div>
        <div class="col-12 text-right q-mt-md">
          <GButton
            class="text-label-large"
            variant="outline"
            label="Close"
            type="button"
            color="primary"
            v-close-popup
          />
        </div>
      </section>
      </template>
    </TemplateDialog>
  </q-dialog>
</template>

<style scoped lang="scss">
.dialog-card {
  max-width: 400px;
}
</style>

<script lang="ts">
import { CutoffTypeReferenceResponse } from '@shared/response/cutoff.response';
import { useQuasar } from 'quasar';
import { ref } from 'vue';
import TemplateDialog from 'src/components/dialog/TemplateDialog.vue';
import GButton from 'src/components/shared/buttons/GButton.vue';

enum CutoffType {
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  SEMIMONTHLY = 'SEMIMONTHLY',
}

export default {
  name: 'ViewCutOffManagementDialog',
  components: {
    TemplateDialog,
    GButton,
  },
  props: {
    cutOffData: {
      type: Object || null,
      default: null,
    },
  },

  setup(props) {
    const $q = useQuasar();
    const cutoffCode = ref('');
    const selectedPayrollPeriod = ref<CutoffType>(CutoffType.SEMIMONTHLY);
    const releaseProcessingDays = ref(3);
    const payrollPeriods = ref<CutoffTypeReferenceResponse[]>([]);
    const firstCutoffOptions = ref([]);
    const lastCutoffOptions = ref([]);
    const weeklyCutoffOptions = ref([]);
    const monthlyCutoffOptions = ref([]);
    const selectedFirstCutoff = ref(null);
    const selectedLastCutoff = ref(null);
    const selectedCutoffDay = ref(null);

    const fetchData = () => {
      $q.loading.show();
      if (props.cutOffData) {
        cutoffCode.value = props.cutOffData.cutoffCode;
        selectedPayrollPeriod.value = props.cutOffData.cutoffType;
        releaseProcessingDays.value = props.cutOffData.releaseProcessingDays;

        switch (props.cutOffData.cutoffType) {
          case 'WEEKLY':
            selectedCutoffDay.value = props.cutOffData.cutoffConfig.cutoffDay;
            break;
          case 'SEMIMONTHLY':
            selectedFirstCutoff.value =
              props.cutOffData.cutoffConfig.firstCutoffPeriod;
            selectedLastCutoff.value =
              props.cutOffData.cutoffConfig.lastCutoffPeriod;
            break;
          case 'MONTHLY':
            selectedCutoffDay.value =
              props.cutOffData.cutoffConfig.cutoffPeriod;
            break;
        }
      } else {
        cutoffCode.value = '';
        selectedPayrollPeriod.value = CutoffType.SEMIMONTHLY;
        releaseProcessingDays.value = 3;
        selectedCutoffDay.value = null;
        selectedFirstCutoff.value = null;
        selectedLastCutoff.value = null;
        selectedCutoffDay.value = null;
      }
      $q.loading.hide();
    };

    return {
      cutoffCode,
      selectedPayrollPeriod,
      releaseProcessingDays,
      payrollPeriods,
      firstCutoffOptions,
      lastCutoffOptions,
      weeklyCutoffOptions,
      monthlyCutoffOptions,
      selectedFirstCutoff,
      selectedLastCutoff,
      selectedCutoffDay,
      fetchData,
    };
  },
};
</script>
