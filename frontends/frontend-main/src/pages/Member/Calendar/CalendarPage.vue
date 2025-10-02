<template>
  <div>
    <q-card class="calendar-card">
      <q-card-section>
        <div class="row items-center no-wrap">
          <div class="col">
            <div class="text-title-large">My Calendar</div>
          </div>
        </div>

        <div class="row items-start no-wrap">
          <div class="col-2 q-my-md">
            <div class="mini-calendar-container q-pa-md">
              <MiniCalendarView class="full-width" />
            </div>

            <div class="checklist">
              <div class="text-title-medium checklist-title">My Schedule</div>
              <div class="checklist-items">
                <q-checkbox v-model="filters.all" label="All" class="text-label-medium" />
                <q-checkbox
                  v-model="filters.maintenance"
                  label="Maintenance"
                  class="text-label-medium"
                />
                <q-checkbox v-model="filters.repair" label="Repair" class="text-label-medium" />
                <q-checkbox
                  v-model="filters.transfer"
                  label="Transfer Location"
                  class="text-label-medium"
                />
              </div>
            </div>
          </div>
          <div class="col-7 q-pa-md">
            <FullCalenderView :events="events" />
          </div>
          <div class="col-3 q-pa-md">
            <div class="q-mb-lg event-heading text-title-medium">Events</div>
            <div class="q-mt-md">
              <EventPartials :events="events"></EventPartials>
            </div>
          </div>
        </div>
      </q-card-section>
    </q-card>
    <div class="calendar-mobile-content">
      <!-- Calendar Widget -->
      <CalendarWidget class="calendar-widget" />
      <!-- My Schedules Widget -->
      <MySchedulesWidget class="my-schedules-widget" />
    </div>
  </div>
</template>

<style scoped src="./CalendarPage.scss"></style>

<script>
import FullCalenderView from '../../../components/calendar/FullCalendarView/FullCalenderView.vue';
import MiniCalendarView from '../../../components/calendar/MiniCalendar/MiniCalendarView.vue';
import EventPartials from './Partials/EventsPartial/EventPartials.vue';
import CalendarWidget from '../Dashboard/CalendarWidget/CalendarWidget.vue';
import MySchedulesWidget from '../Dashboard/MySchedulesWidget/MySchedulesWidget.vue';

const dummyData = [
  {
    id: 1,
    title: 'Maintenance for excavator (ZSA-123)',
    startDateHumanized: 'October 10, 2024',
    endDateHumanized: 'October 15, 2024',
    start: '2024-10-10',
    end: '2024-10-15',
    tags: ['Maintenance'],
  },
  {
    id: 2,
    title: 'Warehouse A to Warehouse B transport of yero',
    startDateHumanized: 'October 20, 2024',
    endDateHumanized: 'October 25, 2024',
    start: '2024-10-20',
    end: '2024-10-25',
    tags: ['Transport'],
  },
  {
    id: 3,
    title: 'Repair truck (ZSA-543)',
    startDateHumanized: 'October 30, 2024',
    endDateHumanized: 'November 05, 2024',
    start: '2024-10-30',
    end: '2024-11-05',
    tags: ['Repair'],
  },
  {
    id: 4,
    title: 'Warehouse A to Warehouse B transport of plywood',
    startDateHumanized: 'November 10, 2024',
    endDateHumanized: 'November 11, 2024',
    start: '2024-11-10',
    end: '2024-11-11',
    tags: ['Transport'],
  },
  {
    id: 5,
    title: 'Repair L300 for small furniture transport (ZSA-000)',
    startDateHumanized: 'November 14, 2024',
    endDateHumanized: 'November 16, 2024',
    start: '2024-11-14',
    end: '2024-11-16',
    tags: ['Repair'],
  },
];

export default {
  name: 'CalendarPage',
  components: {
    FullCalenderView,
    MiniCalendarView,
    EventPartials,
    CalendarWidget,
    MySchedulesWidget,
  },
  data() {
    return {
      dummyData,
      events: dummyData,
      filters: {
        all: true,
        maintenance: true,
        repair: true,
        transfer: true,
      },
    };
  },
};
</script>
