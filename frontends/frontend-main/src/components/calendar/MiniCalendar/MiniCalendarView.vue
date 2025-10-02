<template>
  <div class="mini-calendar-wrapper">
    <FullCalendar :options="calendarOptions" />
  </div>
</template>

<style scoped src="./MiniCalendarView.scss"></style>

<script>
import FullCalendar from '@fullcalendar/vue3';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';

export default {
  name: 'MiniCalendarView',
  components: {
    FullCalendar,
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
        dayCellClassNames: 'mini-calendar-day',
      },
    };
  },
};
</script>
