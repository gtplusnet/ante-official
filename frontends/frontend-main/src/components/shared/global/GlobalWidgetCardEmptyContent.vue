<template>
  <div class="empty-content-container">
    <div class="empty-content">
      <slot name="icon">
        <img 
          v-if="!icon" 
          :src="emptyImage" 
          alt="Empty content"
          class="empty-image"
        />
        <q-icon 
          v-else
          :name="icon" 
          :size="iconSize" 
          :color="iconColor" 
          class="empty-icon" 
        />
      </slot>
      <div class="text-title-medium text-grey">
        <slot name="title"></slot>
      </div>
      <div class="announcement-description text-body-medium">
        <slot name="description"></slot>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue';

export default defineComponent({
  name: 'GlobalWidgetCardEmptyContent',
  props: {
    icon: {
      type: String,
      default: '',
    },
    iconSize: {
      type: String,
      default: '64px',
    },
    iconColor: {
      type: String,
      default: 'grey-5',
    },
    image: {
      type: String,
      default: '/src/assets/img/empty-content-1.png',
    },
  },
  setup(props) {
    const emptyImage = computed(() => {
      return props.image;
    });

    return {
      emptyImage,
    };
  },
});
</script>

<style scoped lang="scss">
.empty-content-container {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  width: 100%;
  height: 100%;

  .empty-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;

    .announcement-description {
      width: 350px;
      color: var(--q-grey-icon);
    }
  }

  .empty-icon {
    margin-bottom: 16px;
  }

  .empty-image {
    width: 120px;
    height: 120px;
    margin-bottom: 12px;
  }
}
</style>
