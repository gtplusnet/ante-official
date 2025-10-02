<template>
  <q-dialog ref="dialog" @before-show="fetchData" persistent>
    <TemplateDialog minWidth="400px">
      <template #DialogTitle>
        Allowance Settings
      </template>
      <template #DialogContent>
        <q-form @submit.prevent="submitForm" class="q-pa-md">
          <div class="row items-end justify-end q-pb-sm">
            <q-checkbox label="Pro-Rated Allowance" size="xs" class="text-label-medium" v-model="detailsRow.proRatedAllowance" />
          </div>
          <div class="column q-gutter-md">
            <div>
              <label class="text-label-large">Allowance Amount</label>
              <q-input
                class="q-pt-xs"
                required
                v-model="detailsRow.allowanceAmount"
                type="number"
                min="0"
                dense
                placeholder="Enter Allowance Amount"
                outlined
              />
            </div>

            <div>
              <label class="text-label-large">Receive Every</label>
              <q-select
                required
                class="q-pt-xs"
                v-model="detailsRow.allowancePeriod"
                :options="allowancePeriodList"
                option-value="key"
                option-label="label"
                emit-value
                map-options
                dense
                outlined
              />
            </div>

            <div>
              <g-input required label="Effectivity Date" class="text-label-large input-selection" v-model="detailsRow.effectivityDate" type="date" dense outlined />
            </div>
          </div>
          <div class="text-right q-mt-md q-gutter-x-sm">
            <GButton class="text-label-large" variant="outline" label="Cancel" type="button" color="primary" v-close-popup />
            <GButton class="text-label-large" label="Save" type="submit" color="primary" />
          </div>
        </q-form>
      </template>
    </TemplateDialog>
  </q-dialog>
</template>

<style lang="scss" scoped>
.allowance-card {
  min-width: 400px;
}
</style>

<script lang="ts">
import { useQuasar } from 'quasar';
import { api } from 'src/boot/axios';
import GInput from "../../../../../components/shared/form/GInput.vue";
import { handleAxiosError } from "../../../../../utility/axios.error.handler";
import { onMounted, ref, computed, watch } from 'vue';
import TemplateDialog from "src/components/dialog/TemplateDialog.vue";
import GButton from 'src/components/shared/buttons/GButton.vue';

export default {
  name: 'CreateAllowanceDialog',
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
  },

  setup(props, { emit }) {
    const $q = useQuasar();
    const allowancePeriodList = ref<{ label: string; key: string }[]>([]);
    const detailsRow = ref({
      proRatedAllowance: false,
      allowanceAmount: '',
      allowancePeriod: '',
      effectivityDate: '',
    });
    const defaultAllowancePeriod = ref('');
    const updateAllowancePeriod = computed(() => {
      return detailsRow.value.allowancePeriod || defaultAllowancePeriod.value;
    });

    watch(
      () => detailsRow.value.allowancePeriod,
      (newValue) => {
        if (!newValue) {
          detailsRow.value.allowancePeriod = defaultAllowancePeriod.value;
        }
      },
      { immediate: true }
    );

    watch(
      () => allowancePeriodList.value,
      (newList) => {
        if (newList.length > 0) {
          defaultAllowancePeriod.value = newList[0].key;
          detailsRow.value.allowancePeriod = defaultAllowancePeriod.value;
        }
      },
      { immediate: true }
    );

    const submitForm = () => {
      emit('save-allowance-details', {
        allowanceData: detailsRow.value,
        selectedEmployee: props.selectedEmployees,
      });
    };

    onMounted(() => {
      fetchAllowancePeriod();
    });

    const fetchAllowancePeriod = () => {
      $q.loading.show();
      api
        .get('hr-configuration/allowance/plan/cutoff-period-type')
        .then((response) => {
          if (response.data) {
            allowancePeriodList.value = (response.data || []).map((item: { label: string; key: string }) => ({
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
        proRatedAllowance: false,
        allowanceAmount: '',
        allowancePeriod: '',
        effectivityDate: today.toISOString().split('T')[0],
      };
    };

    return {
      updateAllowancePeriod,
      allowancePeriodList,
      detailsRow,
      fetchData,
      submitForm,
    };
  },
};
</script>
