import VueApexCharts from 'vue3-apexcharts';
import { boot } from 'quasar/wrappers';

export default boot(({ app }) => {
  // Register apexchart component globally
  app.component('ApexChart', VueApexCharts);
});