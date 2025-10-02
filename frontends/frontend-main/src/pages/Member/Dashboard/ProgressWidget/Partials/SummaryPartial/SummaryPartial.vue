<template>
  <div class="q-pa-md example-column-vertical-alignment" @keydown.f9="fillData">
    <div class="column justify-start">
      <div class="row q-gutter-sm">
        <div class="col row justify-between items-center summary q-pr-md q-py-lg">
          <q-icon name="star_outline" class="q-ml-md" color="black" size="20px" />
          <span class="text-label-medium label">Completed</span>
          <span class="text-label-medium label percentage">{{ completedProject }}%</span>
        </div>

        <div class="col row justify-between items-center summary q-pr-md q-py-lg">
          <q-icon name="today" class="q-ml-md" color="black" size="20px" />
          <span class="text-label-medium label">In Progress</span>
          <span class="text-label-medium label percentage">{{ inProgressProject }}%</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped src="./SummaryPartial.scss"></style>

<script>
export default {
  name: 'SummaryPartial',
  components: {},
  props: {
    completedProject: {
      type: Number,
      default: 0,
    },
    inProgressProject: {
      type: Number,
      default: 0,
    },
  },
  data: () => ({}),
  mounted() {},
  methods: {},
  computed: {},
};
</script>
