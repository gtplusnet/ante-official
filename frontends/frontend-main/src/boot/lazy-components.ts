import { boot } from 'quasar/wrappers';
import { defineAsyncComponent } from 'vue';

/**
 * Lazy-loaded components boot file
 * Registers heavy components as async components to reduce initial bundle size
 * Components are only loaded when actually used in the app
 */
export default boot(({ app }) => {
  // Lazy load ApexCharts (528KB) - only loads when used
  app.component('ApexChart', defineAsyncComponent({
    loader: () => import('vue3-apexcharts').then((m) => m.default),
    delay: 200,
    timeout: 10000,
  }));

  // Lazy load FullCalendar (100KB+) - only loads when used
  app.component('FullCalendar', defineAsyncComponent({
    loader: () => import('@fullcalendar/vue3').then((m) => m.default),
    delay: 200,
    timeout: 10000,
  }));
});
