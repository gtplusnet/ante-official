<template>
  <div class="expanded-nav-page">
    <div class="hidden-navigation"></div>
    <div class="content" :class="{ 'transparent-variant': variant === 'transparent' }">
      <slot></slot>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

export default defineComponent({
  name: 'ExpandedNavPageContainer',
  props: {
    variant: {
      type: String as PropType<'default' | 'transparent'>,
      default: 'default',
      validator: (value: string) => ['default', 'transparent'].includes(value)
    }
  }
});
</script>

<style lang="scss" scoped>
.expanded-nav-page {
  display: grid;
  grid-template-columns: 250px 1fr;
  grid-gap: 20px;
  min-height: 0;
  align-items: start;
  width: 100%;

  .hidden-navigation {
    visibility: hidden;
    width: 250px;
    flex-shrink: 0;
  }

  .content {
    border: 1px solid #eee;
    border-radius: 8px;
    min-height: 100px;
    background-color: #fff;
    box-shadow: 2px 2px 5px rgba(0, 0, 0, 0.05);
    padding: 20px;
    margin: 0px 0 0px 22px;

    :deep(.page-head) {
      align-items: center;
      display: flex;
      justify-content: space-between;

      .title {
        font-size: 20px;
      }
    }
  }

  .transparent-variant {
    padding: 0;
    background-color: transparent;
    border: none;
    box-shadow: none;
    display: flex;
    margin: 0px 0px 0px 20px;
  }
}

// Add responsive behavior for smaller screens
@media (max-width: 768px) {
  .expanded-nav-page {
    grid-template-columns: 1fr;
    .hidden-navigation {
      display: none;
    }
  }
}
</style>
