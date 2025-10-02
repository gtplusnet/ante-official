<template>
  <div>
    <apexchart
      height="350"
      type="bar"
      :options="options"
      :series="series"
    ></apexchart>
  </div>
</template>

<script>
import { defineComponent } from 'vue';
import { getCssVar } from 'quasar';
import VueApexCharts from 'vue3-apexcharts';

export default defineComponent({
  name: 'ChartPartial',
  components: {
    apexchart: VueApexCharts,
  },
  props: {
    report: {
      type: Array,
      required: true,
    },
  },
  data() {
    return {
      options: {
        chart: {
          id: 'apex-column',
        },
        colors: [
          getCssVar('primary'),
          getCssVar('secondary'),
          getCssVar('negative'),
        ],
        xaxis: {
          categories: [],
        },
        plotOptions: {
          bar: {
            horizontal: false,
            columnWidth: '55%',
            endingShape: 'rounded',
          },
        },
      },
      series: [
        {
          name: 'Development',
          data: [],
        },
      ],
    };
  },
  mounted() {
    this.generateChartCategories();
    this.generateSeries();
  },
  methods: {
    generateChartCategories() {
      // Populate projectNames array using map
      this.options.xaxis.categories = this.report.map(
        (project) => project.projectName
      );
    },
    generateSeries() {
      this.series[0].data = this.report.map(
        (project) => project.progressPercentage
      );
    },
  },
});
</script>
