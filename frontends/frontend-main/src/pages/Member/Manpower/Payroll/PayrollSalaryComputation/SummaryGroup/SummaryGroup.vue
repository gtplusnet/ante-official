<template>
  <div class="breakdown-group">
    <div class="indention">
      <div v-for="n in indention" :key="n" class="indent"></div>
    </div>
    <div class="description">{{ description }}</div>
    <div class="amount">
      <AmountView v-if="typeof amount === 'number'" :amount="amount"></AmountView>
      <div v-else>{{ amount }}</div>
    </div>
  </div>
</template>

<style scoped src="../PayrollSalaryComputation.scss"></style>

<script lang="ts">
import AmountView from "../../../../../../components/shared/display/AmountView.vue";

export default {
  name: 'SummaryGroup',
  components: {
    AmountView,
  },
  props: {
    description: {
      type: String,
      required: true,
    },
    amount: {
      type: [Number, String],
      required: false,
    },
    indention: {
      type: Number,
      default: 0,
    },
  },
};
</script>
