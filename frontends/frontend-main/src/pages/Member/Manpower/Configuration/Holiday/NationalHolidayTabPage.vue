<template>
  <div class="page-content q-mt-md">
    <div class="flex justify-end">
      <q-select
        class="q-mb-md text-label-large"
        v-model="selectModel"
        dense
        outlined
        :options="options"
        option-label="year"
        option-value="year"
        map-options
        emit-value
        @update:model-value="fetchNationalHoliday"
      >
        <template v-slot:prepend>
          <q-icon name="event" /><span class="text-label-medium">Year</span>
        </template>
      </q-select>
    </div>
    <table class="global-table">
      <thead>
        <tr>
          <th v-for="col in columns" :key="col.name" class="text-left text-title-small">
            {{ col.label }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(row, index) in tableData" :key="index">
          <td class="text-left text-body-small">{{ row.name }}</td>
          <td class="text-left text-body-small">{{ row.type.label }}</td>
          <td class="text-left text-body-small">{{ formatDate(row.date) }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script lang="ts">
import { NationalHolidayResponse } from "@shared/response";
import { useQuasar } from 'quasar';
import { api } from 'src/boot/axios';
import { handleAxiosError } from "../../../../../utility/axios.error.handler";
import { onMounted, ref } from 'vue';

export default {
  name: 'NationalHoliday',

  setup() {
    const $q = useQuasar();
    const selectModel = ref<string | null>(null);

    const tableData = ref<NationalHolidayResponse[]>([]);
    const options = ref<{ year: string }[]>([]);
    const columns = ref([
      { name: 'name', label: 'Name' },
      { name: 'type', label: 'Type' },
      { name: 'date', label: 'Date' },
    ]);

    onMounted(() => {
      fetchSelectYear();
    });

    const fetchSelectYear = () => {
      $q.loading.show();
      api
        .get('/hr-configuration/holiday/national-holiday/select-date')
        .then((response) => {
          if (Array.isArray(response.data) && response.data.length > 0) {
            options.value = response.data;
            selectModel.value = options.value[0].year;
          }
        })
        .catch((error) => {
          console.error('Error fetching year options:', error);
        })
        .finally(() => {
          $q.loading.hide();
          loadDefaultData();
        });
    };

    const fetchNationalHoliday = () => {
      if (!selectModel.value) {
        loadDefaultData();
        return;
      }

      $q.loading.show();

      api
        .get(
          `hr-configuration/holiday/national-holiday/list?year=${selectModel.value}`
        )
        .then((response) => {
          if (Array.isArray(response.data) && response.data.length > 0) {
            tableData.value = response.data;
          } else {
            tableData.value = [];
          }
        })
        .catch((error) => {
          handleAxiosError($q, error);
        })
        .finally(() => {
          $q.loading.hide();
        });
    };

    const loadDefaultData = () => {
      $q.loading.show();

      api
        .get(
          `hr-configuration/holiday/national-holiday/list?year=${selectModel.value}`
        )
        .then((response) => {
          if (Array.isArray(response.data) && response.data.length > 0) {
            tableData.value = response.data;
          } else {
            tableData.value = [];
          }
        })
        .catch((error) => {
          handleAxiosError($q, error);
        })
        .finally(() => {
          $q.loading.hide();
        });
    };

    const formatDate = (dateObj: { dateFull?: string } | string) => {
      if (typeof dateObj === 'string') {
        return dateObj || 'N/A';
      }
      return dateObj?.dateFull || 'N/A';
    };

    return {
      selectModel,
      tableData,
      options,
      columns,
      fetchNationalHoliday,
      formatDate,
    };
  },
};
</script>
