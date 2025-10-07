<template>
  <div class="global-widget-tab">
    <div class="tab-container">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        type="button"
        class="tab-button"
        :class="{ active: modelValue === tab.key }"
        @click="$emit('update:modelValue', tab.key)"
        :aria-selected="modelValue === tab.key"
        role="tab"
      >
        <span class="tab-text">{{ tab.title }}</span>
        <span v-if="tab.badge" class="tab-badge">{{ tab.badge }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">

interface Tab {
  key: string
  title: string
  badge?: string | number
}

interface Props {
  tabs: Tab[]
  modelValue: string
  showFiltering?: boolean
  filterValue?: string
  filterOptions?: string[]
  searchValue?: string
}

defineProps<Props>()

defineEmits<{
  'update:modelValue': [key: string]
}>()
</script>

<style scoped>
.global-widget-tab {
  padding: 5px 0;
  display: flex;
  align-items: center;
  width: 100%;
  /* Desktop: align tabs to the right */
  justify-content: flex-end;

  @media (max-width: 768px) {
    /* Mobile: align tabs to the left */
    justify-content: flex-start;
  }
}

.tab-container {
  position: relative;
  display: flex;
  align-items: center;
  gap: 4px;
  /* Desktop: auto width */
  width: auto;
  /* Prevent wrapping - keep all tabs in one line */
  flex-wrap: nowrap;
  overflow-x: auto;
  overflow-y: visible; /* Changed from hidden to visible to show badges */
  padding: 5px 6px; /* Add vertical padding to accommodate badges */
  margin: -5px 0; /* Compensate for padding to maintain layout */
  /* Smooth scrolling on mobile */
  -webkit-overflow-scrolling: touch;
  /* Hide scrollbar but keep functionality */
  scrollbar-width: none;
  -ms-overflow-style: none;

  &::-webkit-scrollbar {
    display: none;
  }

  @media (max-width: 599px) {
    justify-content: start;
    width: 100%;
  }

  @media (min-width: 600px) {
    justify-content: end;
    width: 100%;
  }
}

.tab-button {
  /* Reset button styles */
  appearance: none;
  border: none;
  background: none;

  /* Tab styling */
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;

  /* Desktop: fixed sizing */
  min-width: 80px;
  background-color: #dde1f053;
  padding: 4px 12px 4px 12px;
  border-radius: 20px;
  cursor: pointer;
  font-size: 12px;
  color: #333;
  transition: all 0.2s ease;
  white-space: nowrap;

  /* Touch optimization */
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
  user-select: none;

  /* Mobile specific */
  @media (max-width: 768px) {
    /* Mobile: allow tabs to grow */
    flex: 1 1 auto;
    max-width: 100px;
    min-height: 32px;
    padding: 6px 14px 6px 10px; /* Add extra padding-right for badge space */
    font-size: 11px;
    min-width: 60px;
  }

  @media (max-width: 599px) {
    max-width: 150px;
  }

  &:hover {
    background-color: #dde1f0aa;
  }

  &:focus {
    outline: none;
  }

  &:active {
    transform: scale(0.95);
  }

  &.active {
    background-color: #dde1f0;
    font-weight: 600;

    &:hover {
      background-color: #c5cae9;
    }
  }
}

.tab-text {
  white-space: nowrap;
}

.tab-badge {
  position: absolute;
  right: -3px;
  top: -3px;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 16px;
  height: 16px;
  padding: 0 3px;
  background-color: var(--q-primary);
  color: white;
  border-radius: 8px;
  font-size: 10px;
  font-weight: 600;
}
</style>
