<template>
  <q-dialog ref="dialog" @before-show="fetchData" persistent>
    <TemplateDialog>
    <template #DialogIcon>
      <q-icon name="add" size="22px"/>
    </template>
    <template #DialogTitle>
      Deduction Details
    </template>
    <template #DialogContent>
      <section>
        <q-form @submit.prevent="submitForm" class="q-pa-md">
          <div class="column q-gutter-sm">
            <div v-if="selectedDeduction.hasTotalAmount == true">
              <label class="label text-label-large">Loan Amount</label>
              <q-input
                class="q-pt-xs text-body-medium"
                required
                v-model="detailsRow.loanAmount"
                type="number"
                min="0"
                dense
                placeholder="Enter Loan Amount"
                outlined
              />
            </div>

            <div>
              <label class="label text-label-large">Monthly Amortization</label>
              <q-input
                required
                class="q-pt-xs text-body-medium"
                v-model="detailsRow.monthlyAmortization"
                type="number"
                min="0"
                dense
                placeholder="Enter Monthly Amortization"
                outlined
              />
            </div>

            <div>
              <label class="label text-label-large">Deduction Period</label>
              <q-select
                required
                class="q-pt-xs text-body-medium"
                v-model="detailsRow.deductionPeriod"
                :options="deductionPeriodList"
                option-value="key"
                option-label="label"
                emit-value
                map-options
                dense
                outlined
              />
            </div>

            <div>
              <g-input required label="Effectivity Date" class="input-selection text-body-medium" v-model="detailsRow.effectivityDate" type="date" dense outlined />
            </div>
          </div>
          <div class="text-right q-gutter-x-sm q-pt-md">
            <GButton variant="outline" label="Cancel" type="button" color="primary" class="text-label-large" v-close-popup />
            <GButton label="Save" type="submit" color="primary" class="text-label-large" />
          </div>
        </q-form>
      </section>
    </template>
    </TemplateDialog>
  </q-dialog>
</template>

<script lang="ts">
import { useQuasar } from 'quasar';
import { api } from 'src/boot/axios';
import GInput from "../../../../../components/shared/form/GInput.vue";
import GButton from 'src/components/shared/buttons/GButton.vue';
import { handleAxiosError } from "../../../../../utility/axios.error.handler";
import { onMounted, ref, computed, watch } from 'vue';
import TemplateDialog from 'src/components/dialog/TemplateDialog.vue';

export default {
  name: 'CreateDeductionDialog',
  components: {
    GInput,
    TemplateDialog,
    GButton,
  },
  props: {
    selectedEmployees: {
      type: Object,
      default: () => ({}),
    },
    selectedDeduction: {
      type: Object,
      default: () => ({}),
    },
  },

  setup(props, { emit }) {
    const $q = useQuasar();
    const deductionPeriodList = ref<{ label: string; key: string }[]>([]);
    const detailsRow = ref({
      loanAmount: '',
      monthlyAmortization: '',
      deductionPeriod: '',
      effectivityDate: '',
    });

    const defaultDeductionPeriod = ref('');

    const updateDeductionPeriod = computed(() => {
      return detailsRow.value.deductionPeriod || defaultDeductionPeriod.value;
    });

    watch(
      () => detailsRow.value.deductionPeriod,
      (newValue) => {
        if (!newValue) {
          detailsRow.value.deductionPeriod = defaultDeductionPeriod.value;
        }
      },
      { immediate: true }
    );

    watch(
      () => deductionPeriodList.value,
      (newList) => {
        if (newList.length > 0) {
          defaultDeductionPeriod.value = newList[0].key;
          detailsRow.value.deductionPeriod = defaultDeductionPeriod.value;
        }
      },
      { immediate: true }
    );

    const submitForm = () => {
      emit('save-deduction-details', {
        deductionData: detailsRow.value,
        selectedEmployee: props.selectedEmployees,
      });
    };

    onMounted(() => {
      fetchDeductionPeriod();
    });

    const fetchDeductionPeriod = () => {
      $q.loading.show();
      api
        .get('hr-configuration/deduction/plan/cutoff-period-type')
        .then((response) => {
          if (response.data) {
            deductionPeriodList.value = (response.data || []).map((item: { label: string; key: string }) => ({
              label: item.label,
              key: item.key,
            }));
          }
        })
        .catch((error) => {
          handleAxiosError($q, error);
        })
        .finally(() => {
          $q.loading.hide();
        });
    };

    const fetchData = () => {
      const today = new Date();
      detailsRow.value = {
        loanAmount: '',
        monthlyAmortization: '',
        deductionPeriod: '',
        effectivityDate: today.toISOString().split('T')[0],
      };
    };

    return {
      updateDeductionPeriod,
      deductionPeriodList,
      detailsRow,
      fetchData,
      submitForm,
    };
  },
};
</script>
