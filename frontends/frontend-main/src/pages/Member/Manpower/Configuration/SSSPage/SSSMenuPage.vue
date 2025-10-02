<template>
  <expanded-nav-page-container>
    <div>
      <div class="page-head">
        <div>
          <div class="text-title-large">SSS Contributions</div>
          <q-breadcrumbs class="text-body-small">
            <q-breadcrumbs-el label="Manpower" :to="{ name: 'member_manpower' }" />
            <q-breadcrumbs-el label="Configuration" />
            <q-breadcrumbs-el label="SSS Contributions" />
          </q-breadcrumbs>
        </div>
        <div class="q-gutter-md">
          <q-select class="q-mb-md text-label-large" v-model="selectModel" dense outlined :options="yearOptions" option-label="label"
            option-value="key" map-options emit-value @update:model-value="fetchSSSContributions">
            <template v-slot:prepend>
              <q-icon name="event" /><span class="text-body2"></span>
            </template>
          </q-select>
        </div>
      </div>

      <div class="page-content q-mt-md">
        <table class="global-table">
          <thead class="text-title-small-f-[12px]">
            <tr>
              <th width="130px" rowspan="3">Range of Compensation</th>
              <th colspan="3">Monthly Salary Credit</th>
              <th colspan="8">Amount of Contributions</th>
            </tr>
            <tr>
              <th>Regular SS</th>
              <th rowspan="2">MPF</th>
              <th rowspan="2">Total</th>
              <th colspan="4">Employer</th>
              <th colspan="3">Employee</th>
              <th rowspan="2">Total</th>
            </tr>
            <tr>
              <th>EC</th>
              <th>Regular SS</th>
              <th>MPF</th>
              <th>EC</th>
              <th>Total</th>
              <th>Regular SS</th>
              <th>MPF</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody class="text-body-small">
            <tr v-for="(row, index) in tableData" :key="index">
              <td>{{ row.compensationRangeLabel }}</td>
              <td>{{ formatNumber(row.monthlySalaryCredit.regular) }}</td>
              <td>{{ formatNumber(row.monthlySalaryCredit.mpf, 2, true) }}</td>
              <td>{{ formatNumber(row.monthlySalaryCredit.total ?? 0) }}</td>
              <td>{{ formatNumber(row.contributionAmount.employer.regular) }}</td>
              <td>
                {{ formatNumber(row.contributionAmount.employer.mpf, 2, true) }}
              </td>
              <td>{{ formatNumber(row.contributionAmount.employer.ec) }}</td>
              <td>
                {{ formatNumber(row.contributionAmount.employer.total ?? 0) }}
              </td>
              <td>{{ formatNumber(row.contributionAmount.employee.regular) }}</td>
              <td>
                {{ formatNumber(row.contributionAmount.employee.mpf, 2, true) }}
              </td>
              <td>
                {{ formatNumber(row.contributionAmount.employee.total ?? 0) }}
              </td>
              <td>{{ formatNumber(row.total ?? 0) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </expanded-nav-page-container>

</template>

<style src="./SSSMenuPage.scss" scoped></style>

<script lang="ts">
import { onMounted, ref } from 'vue';
import { useQuasar } from 'quasar';
import { api } from 'src/boot/axios';
import { handleAxiosError } from "../../../../../utility/axios.error.handler";
import { SSSDataResponse } from "@shared/response";
import { formatNumber } from "../../../../../utility/formatter";
import ExpandedNavPageContainer from '../../../../../components/shared/ExpandedNavPageContainer.vue';

export default {
  name: 'SSSMenuPage',
  components: {
    ExpandedNavPageContainer,
  },
  setup() {
    const q = useQuasar();
    const selectModel = ref<string | null>(null);
    const yearOptions = ref<{ key: string; label: string }[]>([]);
    const tableData = ref<SSSDataResponse[]>([]);

    onMounted(() => {
      fetchSelectYear();
    });

    const fetchSelectYear = () => {
      q.loading.show();
      api
        .get('hr-configuration/sss/select-date')
        .then((response) => {
          if (Array.isArray(response.data) && response.data.length > 0) {
            yearOptions.value = response.data.map((item) => ({
              key: item.dateStart,
              label: item.label,
            }));
            selectModel.value = yearOptions.value[0]?.key;
          }
        })
        .catch((error) => {
          handleAxiosError(q, error);
        })
        .finally(() => {
          q.loading.hide();
          loadDefaultData();
        });
    };

    const fetchSSSContributions = () => {
      if (!selectModel.value) {
        loadDefaultData();
        return;
      }
      q.loading.show();

      api
        .get(`hr-configuration/sss?date=${selectModel.value}`)
        .then((response) => {
          if (Array.isArray(response.data) && response.data.length > 0) {
            tableData.value = response.data;
            console.log('Table Data:', tableData.value);
          } else {
            tableData.value = [];
          }
        })
        .catch((error) => {
          handleAxiosError(q, error);
        })
        .finally(() => {
          q.loading.hide();
        });
    };

    const loadDefaultData = () => {
      q.loading.show();

      api
        .get(`hr-configuration/sss?date=${selectModel.value}`)
        .then((response) => {
          if (Array.isArray(response.data) && response.data.length > 0) {
            tableData.value = response.data;
          } else {
            tableData.value = [];
          }
        })
        .catch((error) => {
          handleAxiosError(q, error);
        })
        .finally(() => {
          q.loading.hide();
        });
    };

    return {
      q,
      selectModel,
      yearOptions,
      tableData,
      fetchSSSContributions,
      formatNumber,
    };
  },
};
</script>
