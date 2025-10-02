<template>
  <div
    class="badge"
    :style="`background-color: ${badgeData.backgroundColor}; color: ${badgeData.color}`"
  >
    {{ badgeData.label }}
  </div>
</template>

<style scoped lang="scss">
.badge {
  padding: 5px 10px;
  border-radius: 20px;
  display: inline-block;
  cursor: default;
  user-select: none;
}
</style>

<script>
export default {
  name: 'TableBadges',
  props: {
    badgeData: {
      type: Object,
      default: null,
    },
  },
  data: () => ({}),
  watch: {},
  methods: {},
};
</script>
