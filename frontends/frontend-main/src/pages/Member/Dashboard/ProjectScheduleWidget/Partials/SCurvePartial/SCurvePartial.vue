<template>
  <div class="s-curve-container">
    <apexchart
      :height="chartHeight"
      type="area"
      :options="options"
      :series="series"
    ></apexchart>
  </div>
</template>

<style scoped>
.s-curve-container {
  width: 100%;
  height: 100%;
  position: relative;
}
</style>

<script>
import { defineComponent } from 'vue';
import { getCssVar } from 'quasar';
import VueApexCharts from 'vue3-apexcharts';

export default defineComponent({
  name: 'SCurvePartial',
  components: {
    apexchart: VueApexCharts,
  },
  props: {
    chartHeight: {
      type: Number,
      default: 500,
    },
  },
  data() {
    return {
      options: {
        chart: {
          id: 'apex-column',
          toolbar: {
            show: true,
            tools: {
              download: true,
              selection: false,
              zoom: false,
              zoomin: false,
              zoomout: false,
              pan: false,
            },
          },
          parentHeightOffset: 0,
          sparkline: {
            enabled: false,
          },
        },
        colors: [
          getCssVar('positive'),
          getCssVar('secondary'),
          getCssVar('negative'),
        ],
        dataLabels: {
          enabled: true,
          style: {
            fontSize: '10px',
            fontWeight: 'bold',
          },
        },
        stroke: {
          curve: 'smooth',
          width: 2,
        },
        fill: {
          type: 'gradient',
          gradient: {
            shadeIntensity: 1,
            opacityFrom: 0.7,
            opacityTo: 0.3,
            stops: [0, 100],
          },
        },
        grid: {
          borderColor: '#e7e7e7',
          padding: {
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
          },
        },
        xaxis: {
          categories: [
            'Task A',
            'Task B',
            'Task C',
            'Task D',
            'Task E',
            'Task A',
            'Task B',
            'Task C',
            'Task D',
            'Task E',
          ],
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
          data: [5, 14, 32, 48, 55, 59, 63, 66, 79, 90, 70],
        },
      ],
    };
  },
  mounted() {},
  methods: {},
});
</script>
