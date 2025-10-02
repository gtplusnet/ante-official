<template>
  <div class="calendar-dashboard-widget-wrapper">
    <FullCalendar :options="calendarOptions" />
  </div>
</template>

<!-- <style scoped src="./CalendarDashboardWidget.scss"></style> -->

<script>
import FullCalendar from '@fullcalendar/vue3';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';

export default {
  name: 'CalendarPartial',
  components: {
    FullCalendar,
  },
  props: {
    events: {
      type: Array,
    },
  },
  data() {
    return {
      calendarOptions: {
        plugins: [dayGridPlugin, interactionPlugin],
        initialView: 'dayGridMonth',
        headerToolbar: {
          start: 'prev',
          center: 'title',
          end: 'next',
        },
        height: 'auto',
        contentHeight: 'auto',
        events: [],
      },
    };
  },
  watch: {
    events: {
      handler() {
        this.calendarOptions.events = this.events;
      },
      deep: true,
    },
  },
  beforeMount() {
    this.calendarOptions.events = this.events;
  },
};
</script>
