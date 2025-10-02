<template>
  <div class="page-content q-mt-md">
    <table class="global-table">
      <thead class="text-title-small">
        <tr>
          <th class="category-title" colspan="8">{{ label }}</th>
        </tr>
      </thead>
      <thead class="text-title-small-f-[12px]">
        <tr>
          <th class="category-title">Compensation Range</th>
          <th v-for="index in 6" :key="'header-' + index">{{ index }}</th>
        </tr>
      </thead>
      <tbody class="text-body-small">
        <tr>
          <td>Compensation Range</td>
          <td v-for="(bracket, index) in taxConfigDataValue" :key="'comp-' + index">
            {{
              bracket.min === 0
                ? `₱${formatNumber(bracket.max)} and below`
                : `₱${formatNumber(bracket.min)}`
            }}
            <template v-if="bracket.min !== 0 && bracket.max > 0"
              >- ₱{{ formatNumber(bracket.max) }}</template
            >
            <template v-if="bracket.max === 0">and above</template>
          </td>
        </tr>

        <tr>
          <td>Prescribed Withholding Tax</td>
          <td v-for="(bracket, index) in taxConfigDataValue" :key="'tax-' + index">
            <div>₱{{ formatNumber(bracket.tax) }}</div>
            <div v-if="bracket.percentage > 0">
              +{{ bracket.percentage }}% over ₱{{ formatNumber(bracket.min) }}
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script lang="ts">
import { TaxConfigDataValueResponse } from "@shared/response";
import { formatNumber } from "../../../../../utility/formatter";

export default {
  name: 'ConsolidatedTaxTableData',
  props: {
    label: {
      type: String,
      required: true,
    },
    taxConfigDataValue: {
      type: Object as () => TaxConfigDataValueResponse[],
      required: true,
    },
  },
  setup() {
    return {
      formatNumber,
    };
  },
};
</script>
