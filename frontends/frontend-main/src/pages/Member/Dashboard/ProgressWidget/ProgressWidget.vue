<template>
  <div>
    <q-card class="card">
      <q-card-section>
        <div class="row items-center no-wrap">
          <!-- title -->
          <div class="col">
            <div class="text-title-large">Progress Overview</div>
          </div>
        </div>
      </q-card-section>
      <q-separator />
      <q-card-section>
        <!-- task loading -->
        <div class="task-content">
          <template v-if="isProjectProgressLoading">
            <GlobalLoader />
          </template>
          <template v-else>
            <!-- no task loaded -->
            <div class="task-empty" v-if="projectProgressReport.length == 0">No projects yet</div>
            <div v-else>
              <chart-partial :report="projectProgressReport" />
              <summary-partial :completedProject="projectSummary.completedPercentage" :inProgressProject="projectSummary.inProgressPercentage" />
            </div>
          </template>
        </div>
      </q-card-section>
    </q-card>
  </div>
</template>

<style scoped src="./ProgressWidget.scss"></style>

<script>
import GlobalLoader from '../../../../components/shared/common/GlobalLoader.vue';
import ChartPartial from './Partials/ChartPartial/ChartPartial.vue';
import SummaryPartial from './Partials/SummaryPartial/SummaryPartial.vue';

const dummyData = [
  {
    id: 1,
    projectName: 'Project A',
    progressPercentage: 50,
    type: 'Development',
  },
  {
    id: 2,
    projectName: 'Project B',
    progressPercentage: 20,
    type: 'Development',
  },
  {
    id: 3,
    projectName: 'Project C',
    progressPercentage: 80,
    type: 'Development',
  },
  {
    id: 4,
    projectName: 'Project D',
    progressPercentage: 30,
    type: 'Development',
  },
  {
    id: 5,
    projectName: 'Project E',
    progressPercentage: 60,
    type: 'Development',
  },
  {
    id: 6,
    projectName: 'Project F',
    progressPercentage: 40,
    type: 'Development',
  },
];

export default {
  name: 'ProgressWidget',
  components: {
    ChartPartial,
    SummaryPartial,
    GlobalLoader,
  },
  data: () => ({
    isProjectProgressLoading: false,
    projectProgressReport: dummyData,
    projectSummary: {
      inProgressPercentage: 40,
      completedPercentage: 30,
    },
  }),
  mounted() {},
  methods: {},
  computed: {},
};
</script>
