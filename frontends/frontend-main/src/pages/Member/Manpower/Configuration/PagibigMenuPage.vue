<template>
  <expanded-nav-page-container>
    <div class="page-head">
      <div>
        <div class="text-title-large">Pagibig</div>
        <q-breadcrumbs class="text-body-small">
          <q-breadcrumbs-el label="Manpower" :to="{ name: 'member_manpower' }" />
          <q-breadcrumbs-el label="Configuration" />
          <q-breadcrumbs-el label="Pagibig" />
        </q-breadcrumbs>
      </div>
    </div>
  <div class="page-content q-mt-md">
    <table class="global-table text-center">
      <thead class="text-title-small-f-[12px]">
        <tr>
          <th v-for="col in columns" :key="col.name">
            {{ col.label }}
          </th>
        </tr>
      </thead>
      <tbody class="text-body-small">
        <tr v-for="(row, index) in tableData" :key="index">
          <td>{{ row.dateStart || 0 }}</td>
          <td>{{ row.employeeMinimumShare || 0 }}</td>
          <td>{{ row.employeeMinimumPercentage || 0 }}%</td>
          <td>{{ row.percentage || 0 }}%</td>
          <td>{{ row.maximumEmployerShare || 0 }}</td>
          <td>{{ row.maximumEmployeeShare || 0 }}</td>
        </tr>
        </tbody>
      </table>
    </div>
  </expanded-nav-page-container>
</template>

<script>
import { api } from 'src/boot/axios';
import ExpandedNavPageContainer from '../../../../components/shared/ExpandedNavPageContainer.vue';
export default {
  name: 'PagIbigMenuPage',
  components: {
    ExpandedNavPageContainer,
  },
  data() {
    return {
      tableData: [],
      isLoading: false,
      columns: [
        { name: 'dateStart', label: 'Date Start' },
        { name: 'employeeMinimumShare', label: 'EE Minimum' },
        { name: 'employeeMinimumPercentage', label: 'EE Percentage Minimum' },
        { name: 'percentage', label: 'Percentage' },
        { name: 'maximumEmployerShare', label: 'Max ER Share' },
        { name: 'maximumEmployeeShare', label: 'Max EE Share' },
      ],
    };
  },
  created() {
    this.fetchSSSData();
  },
  methods: {
    fetchSSSData() {
      this.isLoading = true;
      this.$q.loading.show();

      api
        .get('/hr-configuration/pagibig')
        .then((response) => {
          console.log('API Response:', response.data);
          if (Array.isArray(response.data) && response.data.length > 0) {
            this.tableData = response.data;
          }
        })
        .catch((error) => {
          handleAxiosError(error);
        })
        .finally(() => {
          this.$q.loading.hide();
        });
    },
  },
};
</script>
