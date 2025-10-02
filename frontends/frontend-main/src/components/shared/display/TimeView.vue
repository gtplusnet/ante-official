<template>
  <span :class="time.raw == 0 && override.raw == 0 ? 'text-grey' : activeClass">
    <div :class="isOverridden ? 'text-grey text-strike' : ''">{{ time.formatted }}</div>
    <div v-if="isOverridden">{{ override.formatted }}</div>
  </span>
</template>


<script lang="ts">
import { defineComponent } from 'vue';
import { HoursFormat } from "@shared/response";

export default defineComponent({
  name: 'TimeView',
  props: {
    time: {
      type: Object as () => HoursFormat,
      required: true,
    },
    activeClass: {
      type: String,
      default: 'text-black',
    },
    isOverridden: {
      type: Boolean,
      default: false,
    },
    override: {
      type: Object as () => HoursFormat,
      default: () => ({
        raw: 0,
        formatted: '00:00',
      }),
    }
  },
});
</script>
