<template>
  <div class="page-content q-mt-md">
    <ConsolidatedTaxTableData v-if="tableData" label="Daily" :taxConfigDataValue="tableData.DAILY"/>
    <ConsolidatedTaxTableData v-if="tableData" label="Weekly" :taxConfigDataValue="tableData.WEEKLY"/>
    <ConsolidatedTaxTableData v-if="tableData" label="Semi-Monthly" :taxConfigDataValue="tableData.SEMIMONTHLY"/>
    <ConsolidatedTaxTableData v-if="tableData" label="Monthly" :taxConfigDataValue="tableData.MONTHLY"/>
  </div>
</template>

<script lang="ts">
import { api } from 'src/boot/axios';
import { handleAxiosError } from "../../../../../utility/axios.error.handler";
import { TaxConfigDataResponse } from "@shared/response";
import { AxiosResponse } from 'axios';
import ConsolidatedTaxTableData from "../../../../../pages/Member/Manpower/components/tables/ManpowerConsolidatedTaxTableData.vue";

export default {
  name: 'TaxTablePage',
  components: {
    ConsolidatedTaxTableData,
  },
  props: {
    selectedDate: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      tableData: null as TaxConfigDataResponse | null,
    };
  },
  created() {
    this.fetchConsolidatedTaxTable();
  },
  watch: {
    selectedDate: {
      immediate: true,
      handler() {
        this.fetchConsolidatedTaxTable();
      },
    },
  },
  methods: {
    async fetchConsolidatedTaxTable() {
      this.$q.loading.show();

      api.get(`/hr-configuration/tax/consolidated/table?date=${this.selectedDate}`).then((response: AxiosResponse<TaxConfigDataResponse>) => {
        if (response && response.data) {
          this.tableData = response.data;
        }
      }).finally(() => {
        this.$q.loading.hide();
      }).catch((error) => {
        handleAxiosError(this.$q, error);
      });
    }
  },
};
</script>
