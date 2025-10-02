<template>
  <div class="badge">
    {{ data != '-' ? data : '0' }}%
  </div>
</template>


<script>
export default {
  name: 'TableBadges',
  props: {
    data: {
      type: Number || String || null,
      default: null,
    },
  },
  data: () => ({}),
  watch: {},
  methods: {},
};
</script>
