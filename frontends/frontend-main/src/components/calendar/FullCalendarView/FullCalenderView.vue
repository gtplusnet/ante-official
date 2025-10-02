<template>
  <div class="full-calendar-wrapper q-pa-md">
    <FullCalendar :options="calendarOptions" />
  </div>
</template>

<style scoped src="./FullCalendarView.scss"></style>

<script>
import FullCalendar from '@fullcalendar/vue3';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';

export default {
  name: 'FullCalendarView',
  components: {
    FullCalendar,
  },
  props: {
    events: {
      type: Array,
      default: () => [],
    },
  },
  data() {
    return {
      calendarOptions: {
        plugins: [dayGridPlugin, interactionPlugin],
        initialView: 'dayGridMonth',
        headerToolbar: {
          start: '',
          center: '',
          end: '',
        },
        height: 'auto',
        contentHeight: 'auto',
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
