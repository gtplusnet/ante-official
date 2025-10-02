import FullCalendar from '@fullcalendar/vue3';
import { boot } from 'quasar/wrappers';

export default boot(({ app }) => {
  // Register FullCalendar component globally
  app.component('FullCalendar', FullCalendar);
});