<template>
  <div class="global-widget-card-box-title">
    <q-icon
      v-if="icon"
      :name="icon"
      :style="{ color: iconColor, fontSize: iconSize }"
    />
    <span class="text-label-large text-dark">{{ title }}</span>
  </div>
</template>

<script setup lang="ts">
interface Props {
  icon?: string
  iconColor?: string
  iconSize?: string
  title: string
}

withDefaults(defineProps<Props>(), {
  iconColor: '#000000',
  iconSize: '20px'
})
</script>

<style scoped>
.global-widget-card-box-title {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
}
</style>
