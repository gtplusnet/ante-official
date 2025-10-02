<template>
  <expanded-nav-page-container>
    <div class="page-head">
      <div>
        <div class="text-title-large">Philhealth</div>
        <q-breadcrumbs class="text-body-small">
          <q-breadcrumbs-el label="Manpower" :to="{ name: 'member_manpower' }" />
          <q-breadcrumbs-el label="Configuration" />
          <q-breadcrumbs-el label="Philhealth" />
        </q-breadcrumbs>
      </div>
    </div>

  <div class="page-content q-mt-md">
    <table class="global-table">
      <thead class="text-title-small-f-[12px]">
        <tr>
          <th v-for="col in columns" :key="col.name">
            {{ col.label }}
          </th>
        </tr>
      </thead>
      <tbody class="text-body-small">
        <tr v-for="data in tableData" :key="data.key">
          <td>{{ data.dateStart }}</td>
          <td>{{ data.minimumContribution }}</td>
          <td>{{ formatNumber(data.maximumContribution) }}</td>
          <td>{{ formatPercentage(data.percentage) }}</td>
        </tr>
        </tbody>
      </table>
    </div>
  </expanded-nav-page-container>
</template>

<style>
tr td {
  text-align: center;
}
</style>

<script>
import { api } from 'src/boot/axios';
import ExpandedNavPageContainer from '../../../../components/shared/ExpandedNavPageContainer.vue';
export default {
  name: 'PhilhealthMenu',
  components: {
    ExpandedNavPageContainer,
  },
  data() {
    return {
      tableData: [],
      isLoading: false,
      columns: [
        { name: 'Date Start', label: 'Date Start' },
        { name: 'Minimum', label: 'Minimum' },
        { name: 'Maximum', label: 'Maximum' },
        { name: 'Percentage', label: 'Percentage' },
      ],
    };
  },
  created() {
    this.fetchPhilhealthData();
  },
  methods: {
    fetchPhilhealthData() {
      this.$q.loading.show();

      api
        .get('/hr-configuration/philhealth')
        .then((response) => {
          console.log('API Response:', response.data);

          this.tableData =
            Array.isArray(response.data) && response.data.length > 0
              ? response.data
              : [];
        })
        .catch((error) => {
          console.error('Error fetching data:', error);
        })
        .finally(() => {
          this.$q.loading.hide();
        });
    },
    formatNumber(value) {
      return new Intl.NumberFormat('en-US').format(value);
    },
    formatPercentage(value) {
      return `${value.toFixed(2)}%`;
    },
  },
};
</script>
