<template>
  <div class="q-mt-sm">
    <q-list class="q-gutter-md">
      <!-- Add q-gutter-md to the q-list -->
      <q-item v-for="item in events" :key="item.id" class="event-item">
        <q-item-section>
          <q-item-label>
            <div>
              <span class="text-title-small">{{ item.title }}</span>
            </div>
            <div>
              <span class="event-start-date text-label-medium">
                {{ item.startDateHumanized }}
              </span>
            </div>
          </q-item-label>
          <q-item-label>
            <q-chip
              v-for="(tag, index) in item.tags"
              :key="index"
              color="primary"
              text-color="white"
              size="sm"
              class="text-label-small"
            >
              {{ tag }}
            </q-chip>
          </q-item-label>
        </q-item-section>
      </q-item>
    </q-list>
  </div>
</template>

<style scoped src="./EventPartials.scss"></style>

<script>
export default {
  name: 'EventPartials',
  components: {},
  props: {
    events: {
      type: Array,
    },
  },
  data: () => ({}),
  mounted() {},
  methods: {},
  computed: {},
};
</script>
