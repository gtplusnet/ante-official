<template>
  <div class="chart-wrapper">
    <div ref="chartEl"></div>
  </div>
</template>

<script>
import { defineComponent } from 'vue';
import ApexCharts from 'apexcharts';

export default defineComponent({
  name: 'ChartPartial',
  mounted() {
    this.renderChart();
  },
  beforeUnmount() {
    if (this.chart) {
      this.chart.destroy();
    }
  },
  methods: {
    renderChart() {
      const options = {
        series: [900000, 250000],
        chart: {
          type: 'donut',
          width: 250,
          height: 200
        },
        labels: ['Collection', 'Expenses'],
        colors: ['#1976D2', '#FF6B6B'],
        dataLabels: {
          enabled: true,
          formatter: function(val) {
            return Math.round(val) + '%';
          }
        },
        plotOptions: {
          pie: {
            donut: {
              size: '65%',
              labels: {
                show: true,
                name: {
                  show: true,
                  fontSize: '12px',
                },
                value: {
                  show: true,
                  fontSize: '14px',
                  formatter: function(val) {
                    return '₱' + Number(val).toLocaleString();
                  }
                }
              }
            }
          }
        },
        legend: {
          position: 'bottom',
          fontSize: '12px'
        }
      };

      this.chart = new ApexCharts(this.$refs.chartEl, options);
      this.chart.render();
    }
  }
});
</script>

<style scoped>
.chart-wrapper {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 8px;
  min-width: 250px;
  min-height: 200px;
}
</style>