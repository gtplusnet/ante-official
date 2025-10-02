<template>
  <span :class="time == 0 ? 'text-grey' : 'text-black'">{{ formattedTime }}</span>
</template>


<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'TimeView',
  props: {
    time: {
      type: Number,
      required: true,
    },
  },
  computed: {
    formattedTime(): string {
      const hours = String(Math.floor(this.time / 60)).padStart(2, '0');
      const minutes = String(this.time % 60).padStart(2, '0');
      return `${hours}:${minutes}`;
    },
  },
});
</script>
