<template>
  <div class="employment-info-item" @click="$emit('click')">
    <div class="item-content">
      <div class="icon-wrapper">
        <q-icon :name="icon" :style="{ color: iconColor }" size="24px" />
      </div>
      <div class="info-content">
        <div class="text-title-small text-dark">{{ title }}</div>
        <div class="text-grey-light text-body-small">{{ subtitle }}</div>
      </div>
      <div class="action-wrapper">
        <GButton :label="actionText" type="secondary" variant="tonal" color="secondary" />
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent } from 'vue';
import GButton from 'src/components/shared/buttons/GButton.vue';

export default defineComponent({
  name: 'EmploymentInfoItem',
  components: {
    GButton,
  },
  props: {
    icon: {
      type: String,
      required: true,
    },
    iconColor: {
      type: String,
      default: '#615FF6',
    },
    title: {
      type: String,
      required: true,
    },
    subtitle: {
      type: String,
      required: true,
    },
    actionText: {
      type: String,
      default: 'Review',
    },
  },
  emits: ['click'],
});
</script>

<style scoped>
.employment-info-item {
  border-radius: 12px;
  padding: 16px;
  transition: all 0.3s ease;

  &:hover {
    background-color: var(--q-extra-lighter);
  }
}

.item-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.icon-wrapper {
  display: flex;
  align-items: start;
  justify-content: start;
  height: 35px;
}

.info-content {
  flex: 1;
  min-width: 0;
}
</style>
