<template>
  <div>
    <q-card class="card full-height">
      <q-card-section>
        <div class="row items-center no-wrap">
          <!-- title -->
          <div class="col">
            <div class="text-title-large q-my-xs">Schedule</div>
          </div>
        </div>
      </q-card-section>
      <q-separator />
      <q-card-section>
        <div>
          <calendar-partial :events="events" />
        </div>
      </q-card-section>
    </q-card>
  </div>
</template>

<script>
import CalendarPartial from './Partials/CalendarPartial/CalendarPartial.vue';

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
  name: 'ScheduleWidget',
  components: {
    CalendarPartial,
  },
  data: () => ({
    dummyData,
    events: dummyData,
  }),
  mounted() { },
  methods: {},
  computed: {},
};
</script>
