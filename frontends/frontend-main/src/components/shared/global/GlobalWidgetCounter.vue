<template>
  <div
    class="global-widget-counter"
    :class="[cardClass, { 'clickable': clickable }]"
    @click="handleClick"
    v-ripple="clickable ? { color: 'primary', center: false } : false"
  >
    <template v-if="loading">
      <q-skeleton type="circle" width="64px" height="64px" class="q-mb-md skeleton-icon" />
      <q-skeleton type="text" width="80px" height="32px" class="q-mb-xs skeleton-value" />
      <q-skeleton type="text" width="120px" height="20px" class="skeleton-label" />
    </template>
    <template v-else>
      <div
        class="icon-container text-white mobile-icon"
        :style="{ backgroundColor: iconColor }"
      >
        <q-icon :name="icon" size="24px" />
      </div>
      <div class="counter-content">
        <div class="text-dark text-title-medium counter-value">{{ value }}</div>
        <div class="text-label-large text-grey counter-label">{{ label }}</div>
      </div>
    </template>
    <div v-if="clickable" class="state-layer"></div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  icon: string;
  iconColor: string;
  value: string | number;
  label: string;
  cardClass?: string;
  loading?: boolean;
  clickable?: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  click: []
}>();

const handleClick = () => {
  if (props.clickable) {
    emit('click');
  }
};
</script>

<style scoped lang="scss">
.global-widget-counter {
  flex: 1;
  border-radius: 24px;
  padding: 20px;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  position: relative;
  transition: all 200ms cubic-bezier(0.4, 0.0, 0.2, 1);
  overflow: hidden;
  min-height: 140px;
  display: flex;
  flex-direction: column;
  justify-content: center;

  @media (min-width: 1366px) and (max-width: 1920px) {
    padding: 14px;
  }

  @media (max-width: 768px) {
    padding: 14px;
    border-radius: 20px;
    min-height: 100px;
    background-size: 55%;
    background-position: right top;
  }

  @media (max-width: 480px) {
    padding: 12px;
    border-radius: 16px;
    background-size: cover;
    gap: 6px;
  }

  &.dashboard-card-1 {
    background-image: url('../../../assets/img/card1.png');
    background-color: #e0ecf8;
  }

  &.dashboard-card-2 {
    background-image: url('../../../assets/img/card2.png');
    background-color: #e8e3f9;
  }

  &.dashboard-card-3 {
    background-image: url('../../../assets/img/card3.png');
    background-color: #ceefeb;
  }

  .icon-container {
    padding: 10px 20px;
    width: fit-content;
    border-radius: 50px;
    margin-bottom: 16px;

    @media (max-width: 768px) {
      padding: 8px 12px;
      margin-bottom: 8px;

      .q-icon {
        font-size: 18px !important;
      }
    }

    @media (max-width: 480px) {
      padding: 6px 10px;
      margin-bottom: 0;
      border-radius: 8px;

      .q-icon {
        font-size: 16px !important;
      }
    }
  }

  // Mobile layout adjustments
  @media (max-width: 480px) {
    .counter-content {
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .mobile-icon {
      margin-bottom: 8px;
    }
  }

  // Responsive text sizes
  @media (max-width: 768px) {
    .counter-value {
      font-size: 1rem !important;
      font-weight: 600;
      margin-bottom: 0;
      line-height: 1.2;
    }

    .counter-label {
      font-size: 0.75rem !important;
      line-height: 1.2;
    }
  }

  @media (max-width: 480px) {
    .counter-value {
      font-size: 1rem !important;
      font-weight: 600;
      margin-bottom: 0;
      line-height: 1;
    }

    .counter-label {
      font-size: 0.75rem !important;
      line-height: 1.1;
    }
  }

  // MD3 clickable states
  &.clickable {
    cursor: pointer;
    user-select: none;

    &:hover {
      box-shadow: 0px 1px 4px 0px rgba(133, 146, 173, 0.2);

      .state-layer {
        opacity: 0.01;
      }
    }

    &:active {
      box-shadow: none;
    }

    &:focus-visible {
      outline: 2px solid var(--q-primary);
      outline-offset: 2px;
    }
  }

  .state-layer {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: var(--q-primary);
    opacity: 0;
    transition: opacity 200ms cubic-bezier(0.4, 0.0, 0.2, 1);
    pointer-events: none;
  }

  // Responsive skeleton sizes
  @media (max-width: 768px) {
    .skeleton-icon {
      width: 56px !important;
      height: 56px !important;
    }

    .skeleton-value {
      width: 70px !important;
      height: 28px !important;
    }

    .skeleton-label {
      width: 100px !important;
    }
  }

  @media (max-width: 480px) {
    .skeleton-icon {
      width: 64px !important;
      height: 64px !important;
    }

    .skeleton-value {
      width: 80px !important;
      height: 32px !important;
    }

    .skeleton-label {
      width: 120px !important;
    }
  }
}
</style>
