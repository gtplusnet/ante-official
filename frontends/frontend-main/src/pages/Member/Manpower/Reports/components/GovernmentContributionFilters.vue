<template>
  <div class="government-contribution-filters">
    <div class="row q-col-gutter-md items-end">
      <div class="col-12 col-sm-6 col-md-3">
        <div class="filter-field">
          <label class="text-label-large text-grey q-mb-xs block">Start Date</label>
          <q-input
            v-model="localFilters.startDate"
            type="date"
            outlined
            dense
            class="md3-input"
            @update:model-value="onDateChange"
          >
            <template v-slot:prepend>
              <q-icon name="event" size="20px" />
            </template>
          </q-input>
        </div>
      </div>
      <div class="col-12 col-sm-6 col-md-3">
        <div class="filter-field">
          <label class="text-label-large text-grey q-mb-xs block">End Date</label>
          <q-input
            v-model="localFilters.endDate"
            type="date"
            outlined
            dense
            class="md3-input"
            @update:model-value="onDateChange"
          >
            <template v-slot:prepend>
              <q-icon name="event" size="20px" />
            </template>
          </q-input>
        </div>
      </div>
      <div class="col-12 col-sm-6 col-md-3">
        <div class="filter-field employee-field">
          <ManpowerEmployeeSelection
            v-model="localFilters.accountId"
            label="Employee"
            placeholder="All Employees"
            clearable
            dense
            outlined
            class="md3-input"
            @update:model-value="onEmployeeChange"
          />
        </div>
      </div>
      <div class="col-12 col-sm-6 col-md-3">
        <div class="filter-actions">
          <div class="row q-gutter-sm">
            <div class="col-8">
              <GButton
                class="full-width"
                color="primary"
                label="Search"
                icon="search"
                @click="$emit('search')"
                :loading="loading"
                unelevated
                no-caps
              />
            </div>
            <div class="col-auto">
              <GButton
                outline
                label="Clear"
                icon="clear"
                class="text-dark"
                @click="clearFilters"
                :disable="loading"
                no-caps
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import ManpowerEmployeeSelection from '../../components/selections/ManpowerEmployeeSelection.vue';
import GButton from 'src/components/shared/buttons/GButton.vue';
interface Filters {
  startDate: string | null;
  endDate: string | null;
  accountId: string | null;
}

const props = defineProps({
  modelValue: {
    type: Object as () => Filters,
    default: () => ({
      startDate: null,
      endDate: null,
      accountId: null
    })
  },
  loading: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:modelValue', 'search']);

const localFilters = ref<Filters>({
  startDate: props.modelValue.startDate,
  endDate: props.modelValue.endDate,
  accountId: props.modelValue.accountId
});

watch(() => props.modelValue, (newVal) => {
  localFilters.value = { ...newVal };
}, { deep: true });

const updateFilters = () => {
  emit('update:modelValue', { ...localFilters.value });
};

const clearFilters = () => {
  localFilters.value = {
    startDate: null,
    endDate: null,
    accountId: null
  };
  updateFilters();
  emit('search');
};

const onEmployeeChange = (value: string | null) => {
  localFilters.value.accountId = value;
  updateFilters();
  emit('search');
};

const onDateChange = () => {
  updateFilters();
  emit('search');
};
</script>

<style scoped lang="scss">
.government-contribution-filters {
  width: 100%;
}

.filter-field {
  width: 100%;
  
  label {
    display: block;
    color: var(--q-on-surface, #1C1B1F);
    font-size: 14px;
  }
}

.filter-actions {
  width: 100%;
}

.employee-field {
  padding-top: 20px; // Compensate for missing label to align with other fields
}

:deep(.md3-input) {
  .q-field__control {
    border-radius: 4px;
    min-height: 40px;
    
    &:hover {
      background-color: var(--q-grey-2);
    }
  }
  
  &.q-field--outlined .q-field__control:before {
    border: 1px solid var(--q-gray);
    border-radius: 4px;
  }
  
  &.q-field--focused .q-field__control {
    background-color: var(--q-surface, #FFFFFF);
    
    &:before {
      border-color: var(--q-primary);
      border-width: 2px;
    }
  }
  
  .q-field__prepend {
    color: var(--q-grey-7);
  }
}

.md3-button {
  border-radius: 100px;
  font-weight: 500;
  letter-spacing: 0.1px;
  min-height: 40px;
  
  &:hover {
    box-shadow: 0 1px 2px 0 rgba(60, 64, 67, 0.3),
                0 1px 3px 1px rgba(60, 64, 67, 0.15);
  }
}

.md3-button-outlined {
  border-radius: 100px;
  font-weight: 500;
  letter-spacing: 0.1px;
  min-height: 40px;
  border: 1px solid var(--q-grey-5);
  
  &:hover {
    background-color: var(--q-grey-2);
  }
}

@media (max-width: $breakpoint-md-max) {
  .filter-actions {
    margin-top: 24px;
  }
}

@media (max-width: $breakpoint-sm-max) {
  .filter-actions {
    margin-top: 0;
  }
}
</style>
