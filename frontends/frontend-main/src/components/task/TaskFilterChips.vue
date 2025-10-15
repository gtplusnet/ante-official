<template>
  <div v-if="chips.length > 0" class="active-filters-bar">
    <div class="filters-label">Active Filters:</div>
    <div class="chips-container">
      <q-chip
        v-for="chip in chips"
        :key="chip.key"
        removable
        @remove="handleRemove(chip.key)"
        color="primary"
        outline
        dense
        class="filter-chip"
      >
        <span class="chip-label">{{ chip.label }}</span>
      </q-chip>
      <q-btn
        flat
        dense
        size="sm"
        label="Clear All"
        color="negative"
        class="clear-all-btn"
        @click="handleClearAll"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
// Props
interface FilterChip {
  key: string;
  label: string;
}

interface Props {
  chips: FilterChip[];
}

defineProps<Props>();

// Emits
const emit = defineEmits<{
  (e: 'remove', key: string): void;
  (e: 'clearAll'): void;
}>();

// Methods
const handleRemove = (key: string) => {
  emit('remove', key);
};

const handleClearAll = () => {
  emit('clearAll');
};
</script>

<style lang="scss" scoped>
// Material Design 3 - Active Filters Bar
.active-filters-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  background: var(--surface-container-low, #f5f5f5);
  border: 1px solid var(--outline-variant, #e0e0e0);
  border-radius: 4px;
  margin-bottom: 12px;
  flex-wrap: wrap;

  .filters-label {
    font-size: 13px;
    font-weight: 500;
    color: var(--on-surface-variant, #666);
    white-space: nowrap;
  }

  .chips-container {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    flex: 1;
  }

  .filter-chip {
    margin: 0;

    .chip-label {
      font-size: 12px;
    }

    // Chip remove icon
    :deep(.q-icon) {
      font-size: 16px;
    }
  }

  .clear-all-btn {
    font-size: 12px;
    padding: 4px 10px;
    height: 28px;
    margin-left: auto;
  }

  // Mobile: stack vertically
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;

    .filters-label {
      width: 100%;
    }

    .chips-container {
      width: 100%;
    }

    .clear-all-btn {
      margin-left: 0;
      width: 100%;
    }
  }
}
</style>
