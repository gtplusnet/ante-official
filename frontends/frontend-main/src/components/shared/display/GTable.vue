<template>
  <div>
    <div v-if="tableSettings">
      <div v-if="tableSettings && !noFilter" class="filters q-mb-md">
        <div class="left-side">
          <template v-for="filter in filters" :key="filter.key">
            <div v-if="filter.hasOwnProperty('selectBoxAPI')">
              <g-input
                class="q-mr-sm text-body-medium"
                :storeCache="true"
                :nullOption="`All ${filter.label}`"
                required
                ref="paymentTermsSelect"
                type="select"
                :apiUrl="filter.selectBoxAPI"
                v-model="filterData[filter.key]"
              ></g-input>
            </div>
          </template>
        </div>
        <div class="right-side">
          <!-- search by -->
          <select v-if="searchBy" v-model="searchBy" class="filter-option text-body-medium">
            <option v-for="search in tableSettings.search" :key="search.key" :value="search.column || search.key">
              {{ search.label }}
            </option>
          </select>

          <!-- search input -->
          <q-input v-if="searchBy" v-model="searchKeyword" outlined dense class="text-body-medium" placeholder="Search">
            <template v-slot:append>
              <q-icon name="search" />
            </template>
          </q-input>

          <slot name="actions"></slot>
        </div>
      </div>
      <div class="g-table">
        <table v-if="tableSettings">
          <thead>
            <tr >
              <th v-for="column in tableSettings.columns" :key="column.key" :class="column.class" class="text-title-small" >
                {{ column.label }}
              </th>
              <th v-if="isRowActionEnabled" class="text-title-small">Actions</th>
            </tr>
          </thead>
          <tbody class="text-body-small" :class="isLoading ? 'loading' : ''">
            <tr class="text-label-medium" v-if="isLoading && !tableData">
              <td :colspan="tableSettings.columns.length" class="text-center">
                <GlobalLoader />
              </td>
            </tr>
            <template v-if="tableData">
              <tr class="text-label-medium" v-if="tableData.length == 0">
                <td :colspan="tableSettings.columns.length + (isRowActionEnabled ? 1 : 0)" class="text-center text-label-medium">No data</td>
              </tr>

              <tr  :class="isClickableRow ? 'clickable' : 'not-clickable'" v-for="data in tableData" :key="data.id" @click="$emit('row-click', data)">
                <td v-for="column in tableSettings.columns" :key="column.key" :class="column.class">
                  <template v-if="column.hasOwnProperty('slot')">
                    <!-- badge -->
                    <table-badges v-if="column.slot == 'badge'" :badgeData="getNestedValue(data, column.key)"></table-badges>

                    <!-- percentage -->
                    <table-percentage v-if="column.slot == 'percentage'" :data="getNestedValue(data, column.key)"></table-percentage>

                    <slot v-else :name="column.slot" :data="data"></slot>
                  </template>
                  <template v-else>
                    {{ getNestedValue(data, column.key) }}
                  </template>
                </td>
                <td class="text-center" v-if="isRowActionEnabled">
                  <slot name="row-actions" :data="data"></slot>
                </td>
              </tr>
            </template>
          </tbody>
        </table>

        <div class="pagination q-pa-md text-center">
          <template v-for="page in tablePagination" :key="page">
            <button
              v-if="typeof page == 'number'"
              @click="changePage(page)"
              rounded
              :class="tableCurrentPage == page ? 'active' : ''"
              class="page q-ma-xs text-label-medium"
              color="grey-8"
            >
              {{ page }}
            </button>
            <div class="not-page" v-else>{{ page }}</div>
          </template>
        </div>
        <!-- <pre>{{ tableSettings }}</pre> -->
      </div>
    </div>
    <div v-if="!tableSettings">
      <div class="q-pa-lg q-mt-lg">
        <GlobalLoader />
      </div>
    </div>
  </div>
</template>

<style scoped src="./GTable.scss"></style>
<script>
import { api } from 'src/boot/axios';
import GlobalLoader from "../../../components/shared/common/GlobalLoader.vue";
import GInput from "../../../components/shared/form/GInput.vue";
import TableBadges from './TableBadges.vue';
import TablePercentage from './TablePercentage.vue';
import tableSettings from 'src/references/table.reference';

export default {
  name: 'GTable',
  components: {
    GlobalLoader,
    GInput,
    TableBadges,
    TablePercentage,
  },
  expose: ['refetch', 'reload', 'refresh'],
  props: {
    noFilter: {
      type: Boolean,
      default: false,
    },
    isRowActionEnabled: {
      type: Boolean,
      default: false,
    },
    apiUrl: {
      type: String,
      required: true,
    },
    tableKey: {
      type: String,
      required: true,
    },
    apiFilters: {
      type: Array,
      default: () => [],
    },
    isClickableRow: {
      type: Boolean,
      default: false,
    },
    query: {
      type: Object,
      default: () => ({}),
    },
  },
  data: () => ({
    isLoading: true,
    tableSettings: null,
    tableData: null,
    tablePagination: null,
    tableCurrentPage: 1,
    searchBy: '',
    searchKeyword: '',
    filters: [],
    filterData: {},
    apiDynamicFilters: [],
  }),
  mounted() {
    this.apiDynamicFilters = JSON.parse(JSON.stringify(this.apiFilters));
    this.getTableSettings();
  },
  watch: {
    searchKeyword() {
      this.page = 1;
      this.getTableData();
    },
    filterData: {
      handler() {
        this.apiDynamicFilters = JSON.parse(JSON.stringify(this.apiFilters));
        for (const [key, value] of Object.entries(this.filterData)) {
          if (value) {
            let dataPush = {};
            dataPush[key] = value;
            this.apiDynamicFilters.push(dataPush);
          }
        }

        this.page = 1;
        this.getTableData();
      },
      deep: true,
    },
  },
  methods: {
    getNestedValue(obj, keyString) {
      return keyString.split('.').reduce((o, k) => (o || {})[k], obj) || '-';
    },
    async changePage(page) {
      this.tableCurrentPage = page;
      this.getTableData();
    },
    async getTableSettings() {
      try {
        this.isLoading = true;
        this.tableSettings = tableSettings[this.tableKey];

        if (!this.tableSettings) {
          console.error(`Table settings not found for key: ${this.tableKey}`);
          this.isLoading = false;
          return;
        }

        if (this.tableSettings.hasOwnProperty('search')) {
          this.searchBy = this.tableSettings.search[0].column || this.tableSettings.search[0].key;
        }

        if (this.tableSettings.hasOwnProperty('filter')) {
          this.filters = this.tableSettings.filter;
        }

        this.getTableData();
      } catch (error) {
        console.log(error);
        this.handleAxiosError(error);
      }
    },
    async refetch() {
      this.getTableData();
    },
    async reload() {
      this.getTableData();
    },
    async refresh() {
      this.getTableData();
    },
    async getTableData() {
      this.isLoading = true;

      try {
        const query = this.query;
        query.page = this.tableCurrentPage;
        query.perPage = this.tableSettings.perPage || 10;
        const queryString = new URLSearchParams(query).toString();

        const params = {
          searchKeyword: this.searchKeyword,
          searchBy: this.searchBy,
          filters: this.apiDynamicFilters,
          settings: this.tableSettings,
        };

        let response = await api.put(this.apiUrl + '?' + queryString, params);
        let tableData = null;

        if (response.data.hasOwnProperty('pagination')) {
          tableData = response.data;
        } else {
          tableData = response.data.hasOwnProperty('table') ? response.data.table : response.data.data;
        }

        this.tableData = tableData.list;
        this.tablePagination = tableData.pagination;
        this.tableCurrentPage = tableData.currentPage;
      } catch (error) {
        console.log(error);
        this.handleAxiosError(error);
      }

      this.isLoading = false;
    },
  },
  computed: {},
};
</script>
