<template>
  <q-dialog ref="dialog" @before-show="fetchData">
    <TemplateDialog minWidth="300px">
      <template #DialogTitle>
        {{ localHolidayData ? 'Edit' : 'Create' }} Local Holiday
      </template>

      <template #DialogContent>
        <form v-if="initialDataLoaded" @submit.prevent="save" class="q-px-md q-pt-md">
          <div class="col q-gutter-y-md">
            <!-- Name -->
            <div class="col-6">
              <g-input
                required
                type="text"
                label="Holiday Name"
                v-model="form.name"
              ></g-input>
            </div>

            <!-- Type -->
            <div class="col-6">
              <g-input
                required
                type="select"
                apiUrl="/select-box/holiday-type"
                label="Type"
                v-model="form.type"
              ></g-input>
            </div>

            <!-- Region -->
            <div class="col-6">
              <g-input
                required
                type="select"
                apiUrl="/select-box/location-region-list"
                label="Region"
                v-model="form.region"
              ></g-input>
            </div>

            <!-- province -->
            <div class="col-6">
              <g-input
                required
                type="select"
                :apiUrl="provinceApi"
                label="Province"
                v-model="form.province"
              ></g-input>
            </div>

            <!-- Date -->
            <div class="col-6">
              <g-input
                required
                type="date"
                label="Date"
                v-model="form.date"
              ></g-input>
            </div>
            <div class="col-12 text-right q-pb-md">
              <div class="row justify-end q-gutter-sm">
                <GButton
                  label="Close"
                  type="button"
                  color="primary"
                  variant="outline"
                  v-close-popup
                  class="text-label-large"
                />
                <GButton
                  type="submit"
                  :label="localHolidayData ? 'Update' : 'Save'"
                  color="primary"
                  class="text-label-large"
                />
              </div>
            </div>
          </div>
        </form>
      </template>
    </TemplateDialog>
  </q-dialog>
</template>

<style scoped lang="scss">
.schedule-card {
  max-width: 400px;
}
</style>
<script lang="ts">
import { LocalHolidayRequest } from '@shared/request/holiday.request';
import { QDialog, useQuasar } from 'quasar';
import { api } from 'src/boot/axios';
import GInput from "../../../../../components/shared/form/GInput.vue";
import { handleAxiosError } from "../../../../../utility/axios.error.handler";
import { computed, ref } from 'vue';
import { defineAsyncComponent } from 'vue';
import GButton from "src/components/shared/buttons/GButton.vue";

// Lazy-loaded dialogs (ALL dialogs must be lazy loaded - CLAUDE.md)
const TemplateDialog = defineAsyncComponent(() =>
  import('src/components/dialog/TemplateDialog.vue')
);

function formatDateForSubmit(date: string): string {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
    2,
    '0'
  )}-${String(d.getDate()).padStart(2, '0')}`;
}

export default {
  name: 'AddEditLocalHolidayDialog',
  components: {
    GInput,
    TemplateDialog,
    GButton,
  },
  props: {
    localHolidayData: {
      type: Object || null,
      default: null,
    },
  },
  setup(props, { emit }) {
    const $q = useQuasar();
    const dialog = ref<InstanceType<typeof QDialog> | null>(null);
    const initialDataLoaded = ref(false);
    const form = ref({
      name: '',
      type: '',
      region: '',
      province: '',
      date: '',
    });

    const provinceApi = computed(() => {
      return `/select-box/location-province-list?regionId=${form.value.region}`;
    });

    const save = async () => {
      $q.loading.show();

      if (props.localHolidayData) {
        await apiUpdate();
      } else {
        await apiSave();
      }
    };

    const apiSave = () => {
      const params: Omit<LocalHolidayRequest, 'id'> = {
        name: form.value.name,
        type: form.value.type,
        provinceId: Number(form.value.province),
        date: formatDateForSubmit(form.value.date),
      };
      api
        .post('/hr-configuration/holiday/local-holiday/create', params)
        .then(() => {
          if (dialog.value) {
            dialog.value.hide();
          }
          emit('saveDone');
        })
        .finally(() => {
          $q.loading.hide();
        });
    };

    const apiUpdate = () => {
      const updatedParams: LocalHolidayRequest = {
        id: props.localHolidayData.id,
        name: form.value.name,
        type: form.value.type,
        provinceId: Number(form.value.province),
        date: formatDateForSubmit(form.value.date),
      };
      api
        .patch('hr-configuration/holiday/local-holiday/edit', updatedParams)
        .then(() => {
          if (dialog.value) {
            dialog.value.hide();
          }
          emit('saveDone');
        })
        .catch((error) => {
          handleAxiosError($q, error);
        })
        .finally(() => {
          $q.loading.hide();
        });
    };

    const fetchData = () => {
      $q.loading.show();
      initialDataLoaded.value = false;

      if (props.localHolidayData) {
        const originalDate = new Date(props.localHolidayData.date.dateFull);

        const formattedDate =
          originalDate.getFullYear() +
          '-' +
          String(originalDate.getMonth() + 1).padStart(2, '0') +
          '-' +
          String(originalDate.getDate()).padStart(2, '0');

        form.value.name = props.localHolidayData.name;
        form.value.type = props.localHolidayData.type.key;
        form.value.region = props.localHolidayData.province.region.id;
        form.value.province = props.localHolidayData.province.id;
        form.value.date = formattedDate;
      } else {
        const today = new Date();
        form.value.name = '';
        form.value.type = '';
        form.value.region = '';
        form.value.province = '';
        form.value.date =
          today.getFullYear() +
          '-' +
          String(today.getMonth() + 1).padStart(2, '0') +
          '-' +
          String(today.getDate()).padStart(2, '0');
      }

      $q.loading.hide();
      initialDataLoaded.value = true;
    };

    return {
      form,
      dialog,
      initialDataLoaded,
      provinceApi,
      fetchData,
      save,
    };
  },
};
</script>
