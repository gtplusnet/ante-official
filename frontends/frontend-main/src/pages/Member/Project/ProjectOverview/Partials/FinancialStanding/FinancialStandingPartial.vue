<template>
  <div>
    <!-- Wrapped version with card -->
    <q-card v-if="!hideWrapper" class="card">
      <q-card-section>
        <div class="row items-center no-wrap">
          <!-- title -->
          <div class="col">
            <div class="text-title-large">Financial Standing</div>
          </div>
        </div>
      </q-card-section>
      <q-separator />
      <q-card-section>
        <div v-if="isLoading">
          <GlobalLoader />
        </div>
        <div class="row items-center" v-else>
          <div class="col-md-6 col-12">
            <chart-partial />
          </div>
          <div class="col-md-6 col-12">
            <summary-partial />
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- Unwrapped version for embedding -->
    <div v-else class="financial-content">
      <div v-if="isLoading">
        <GlobalLoader />
      </div>
      <div class="financial-row" v-else>
        <div class="chart-section">
          <chart-partial />
        </div>
        <div class="summary-section">
          <summary-partial />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import GlobalLoader from "../../../../../../components/shared/common/GlobalLoader.vue";
import ChartPartial from './Partials/ChartPartial/ChartPartial.vue';
import SummaryPartial from './Partials/SummaryPartial/SummaryPartial.vue';

export default {
  name: 'FinancialStandingPartial',
  components: {
    GlobalLoader,
    'chart-partial': ChartPartial,
    'summary-partial': SummaryPartial,
  },
  props: {
    hideWrapper: {
      type: Boolean,
      default: false,
    },
  },
  data: () => ({
    isLoading: false,
  }),
  mounted() {},
  methods: {},
  computed: {},
};
</script>

<style scoped>
.financial-content {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;

  .financial-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    gap: 24px;
    padding: 8px;

    .chart-section {
      flex: 1.5;
      display: flex;
      justify-content: center;
      align-items: center;
      min-width: 200px;
    }

    .summary-section {
      flex: 1;
      display: flex;
      justify-content: flex-start;
      align-items: center;
    }

    @media (max-width: 768px) {
      flex-direction: column;

      .chart-section,
      .summary-section {
        width: 100%;
      }
    }
  }
}
</style>
