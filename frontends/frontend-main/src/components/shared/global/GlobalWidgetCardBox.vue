<template>
  <div class="global-widget-card-box">
    <slot></slot>
  </div>
</template>

<script setup lang="ts">
</script>

<style scoped>
.global-widget-card-box {
  cursor: pointer;
  background-color: #f6f8fb;
  padding: 12px;
  border-radius: 12px;
  transition: transform 0.2s ease-in-out;

  &:hover {
    box-shadow: 0px 1px 4px 0px rgba(133, 146, 173, 0.2);
  }
}
</style>
