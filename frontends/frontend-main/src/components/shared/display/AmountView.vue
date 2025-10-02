<template>
  <span v-if="amount < 0" :class="amount != 0 ? activeClass : 'text-grey'">
    <span v-if="showCurrency">₱</span>
    <span>({{ formatNumber(amount * -1) }})</span>
  </span>
  <span v-else :class="amount > 0 ? activeClass : 'text-grey'">
    <span v-if="showCurrency">₱ </span>
    <span>{{ formatNumber(amount == 0 ? 0 : amount) }}</span>
  </span>
</template>

<script lang="ts">
import { formatNumber } from "../../../utility/formatter";
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'AmountView',
  props: {
    amount: {
      type: Number,
      required: true,
    },
    activeClass: {
      type: String,
      default: 'text-black',
    },
    showCurrency: {
      type: Boolean,
      default: false,
    },
  },
  setup() {
    return {
      formatNumber,
    };
  },
});
</script>
