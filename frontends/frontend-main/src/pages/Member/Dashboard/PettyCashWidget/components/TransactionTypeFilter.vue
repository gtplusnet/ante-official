<template>
  <div flat bordered class="filter-card">
    <div class="text-label-large text-grey q-mb-md">Filter By Transaction Type</div>

    <div class="filter-grid">
      <q-checkbox
        v-model="allTypes"
        label="All Types"
        dense
        size="sm"
        @update:model-value="handleAllTypesChange"
        class="filter-checkbox"
      />

      <q-checkbox
        v-model="filters.assignment"
        label="Initial Assignment"
        dense
        size="sm"
        @update:model-value="handleFilterChange"
        class="filter-checkbox"
      />

      <q-checkbox
        v-model="filters.refill"
        label="Refill"
        dense
        size="sm"
        @update:model-value="handleFilterChange"
        class="filter-checkbox"
      />

      <q-checkbox
        v-model="filters.deduction"
        label="Deduction"
        dense
        size="sm"
        @update:model-value="handleFilterChange"
        class="filter-checkbox"
      />

      <q-checkbox
        v-model="filters.return"
        label="Return"
        dense
        size="sm"
        @update:model-value="handleFilterChange"
        class="filter-checkbox"
      />

      <q-checkbox
        v-model="filters.transfer"
        label="Transfer"
        dense
        size="sm"
        @update:model-value="handleFilterChange"
        class="filter-checkbox"
      />

      <q-checkbox
        v-model="filters.liquidation"
        label="Liquidation"
        dense
        size="sm"
        @update:model-value="handleFilterChange"
        class="filter-checkbox"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, watch } from 'vue';

export default defineComponent({
  name: 'TransactionTypeFilter',
  emits: ['update:filters'],
  setup(props, { emit }) {
    const allTypes = ref(false);
    const filters = ref({
      assignment: true,
      refill: true,
      deduction: true,
      return: true,
      transfer: true,
      liquidation: true,
    });

    const handleAllTypesChange = (value: boolean) => {
      if (value) {
        Object.keys(filters.value).forEach((key) => {
          filters.value[key as keyof typeof filters.value] = false;
        });
      }
      emitFilters();
    };

    const handleFilterChange = () => {
      const hasAnyFilter = Object.values(filters.value).some((v) => v);
      allTypes.value = !hasAnyFilter;
      emitFilters();
    };

    const emitFilters = () => {
      const activeFilters = allTypes.value
        ? []
        : Object.entries(filters.value)
            .filter(([, value]) => value)
            .map(([key]) => key);

      emit('update:filters', activeFilters);
    };

    watch(
      filters,
      () => {
        const hasAnyFilter = Object.values(filters.value).some((v) => v);
        allTypes.value = !hasAnyFilter;
      },
      { deep: true }
    );

    emitFilters();

    return {
      allTypes,
      filters,
      handleAllTypesChange,
      handleFilterChange,
    };
  },
});
</script>

<style scoped lang="scss">
.filter-card {
  background-color: var(--q-extra-lighter);
  border-radius: 12px;
  padding: 24px;

  .filter-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;

    .filter-checkbox {
      font-size: 13px;
      white-space: nowrap;

      :deep(.q-checkbox__label) {
        font-size: var(--font-body-small);
        color: #5a5a5a;
        padding-left: 6px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      :deep(.q-checkbox__inner--truthy .q-checkbox__bg),
      :deep(.q-checkbox__inner--indet .q-checkbox__bg) {
        background: var(--q-info);
      }

      :deep(.q-checkbox__bg) {
        border-radius: 4px;
        border: 1px solid var(--q-gray-light);
        width: 16px !important;
        height: 16px !important;
      }

      :deep(.q-checkbox__inner) {

        .q-checkbox__svg {
          color: #fff;
          width: 12px !important;
          height: 12px !important;
          position: absolute !important;
          top: 1px !important;
          left: 1px !important;
        }
      }
    }
  }
}
</style>
