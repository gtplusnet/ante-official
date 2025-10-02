<template>
  <q-select
    v-model="selectedEmployee"
    :options="filteredEmployees"
    :label="label"
    :dense="dense"
    :outlined="outlined"
    :clearable="clearable"
    :loading="loading"
    :disable="disable"
    option-value="value"
    option-label="label"
    emit-value
    map-options
    use-input
    input-debounce="300"
    @filter="filterEmployees"
    @update:model-value="handleUpdate"
  >
    <template v-slot:prepend>
      <q-icon name="person" size="20px" />
    </template>
    <template v-slot:no-option>
      <q-item>
        <q-item-section class="text-grey">
          No employees found
        </q-item-section>
      </q-item>
    </template>
  </q-select>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { api } from 'src/boot/axios';

interface Props {
  modelValue?: string | number | null;
  label?: string;
  placeholder?: string;
  dense?: boolean;
  outlined?: boolean;
  clearable?: boolean;
  disable?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: null,
  label: 'Employee',
  placeholder: 'All Employees',
  dense: false,
  outlined: false,
  clearable: false,
  disable: false
});

const emit = defineEmits(['update:modelValue']);

const loading = ref(false);
const employees = ref<any[]>([]);
const selectedEmployee = ref(props.modelValue);
const searchQuery = ref('');
const filteredEmployees = ref<any[]>([]);

// Watch for external changes to modelValue
watch(() => props.modelValue, (newVal) => {
  selectedEmployee.value = newVal;
});

const fetchEmployees = async () => {
  loading.value = true;
  try {
    // Try the employee-list endpoint instead of assignee-list
    const response = await api.get('/select-box/employee-list');
    
    // Start with "All Employees" option
    const options = [{
      value: null,
      label: 'All Employees'
    }];
    
    // Add employee options from API
    if (Array.isArray(response.data)) {
      response.data.forEach((emp: any) => {
        options.push({
          value: emp.key || emp.value || emp.id,
          label: emp.label || emp.name || 'Unknown Employee'
        });
      });
    }
    
    employees.value = options;
    filteredEmployees.value = options;
  } catch (error) {
    console.error('Error fetching employees:', error);
    // If error, just show "All Employees"
    employees.value = [{
      value: null,
      label: 'All Employees'
    }];
    filteredEmployees.value = employees.value;
  } finally {
    loading.value = false;
  }
};

const filterEmployees = (val: string, update: (callback: () => void) => void) => {
  searchQuery.value = val;
  
  update(() => {
    if (val === '') {
      filteredEmployees.value = employees.value;
    } else {
      const needle = val.toLowerCase();
      filteredEmployees.value = employees.value.filter(emp => 
        emp.label.toLowerCase().includes(needle)
      );
    }
  });
};

const handleUpdate = (value: any) => {
  // When cleared (value is null or undefined), ensure we emit null
  const newValue = value === undefined ? null : value;
  selectedEmployee.value = newValue;
  emit('update:modelValue', newValue);
};

onMounted(() => {
  fetchEmployees();
});
</script>
