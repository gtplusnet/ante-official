<template>
  <div class="page-container">
    <div class="page-content">
      <slot></slot>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'PageContainer',
});
</script>

<style lang="scss" scoped>
.page-container {
  width: 100%;
  height: 100%;
  
  .page-content {
    border: 1px solid #eee;
    border-radius: 8px;
    min-height: 100px;
    background-color: #fff;
    box-shadow: 2px 2px 5px rgba(0, 0, 0, 0.05);
    padding: 20px;
    
    :deep(.page-head) {
      align-items: center;
      display: flex;
      justify-content: space-between;
      margin-bottom: 20px;
      
      .title {
        font-size: 20px;
      }
    }
  }
}
</style>