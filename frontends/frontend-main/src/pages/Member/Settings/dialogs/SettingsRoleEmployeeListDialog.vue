<template>
  <q-dialog v-model="dialogVisible" @hide="closeDialog">
    <q-card class="full-width dialog-card">
      <q-bar class="bg-primary text-white cursor-default" dark>
        <q-icon name="people" />
        <div class="text-title-medium">Employees Assigned to Role</div>
        <q-space />
        <q-btn dense flat icon="close" v-close-popup>
          <q-tooltip class="text-label-small">Close</q-tooltip>
        </q-btn>
      </q-bar>
      <q-card-section>
        <q-table
          class="text-body-small"
          :rows="employees"
          :columns="columns"
          row-key="employeeCode"
          flat
          :loading="loading"
          :pagination="{ rowsPerPage: 10 }"
        >
          <template v-slot:body-cell-fullName="props">
            <q-td class="text-body-small">{{ props.row.fullName }}</q-td>
          </template>
        </q-table>
        <div v-if="error" class="text-negative text-label-medium q-mt-sm">{{ error }}</div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<style scoped lang="scss">
.dialog-card {
  max-width: 600px;
}
</style>

<script setup>
import { ref, watch } from 'vue';
import { api } from 'src/boot/axios';

const props = defineProps({
  modelValue: Boolean,
  roleId: {
    type: String,
    default: null,
  },
});
const emit = defineEmits(['update:modelValue']);

const dialogVisible = ref(props.modelValue);
watch(() => props.modelValue, (val) => {
  dialogVisible.value = val;
});
watch(dialogVisible, (val) => {
  if (!val) emit('update:modelValue', false);
});

function closeDialog() {
  emit('update:modelValue', false);
}

const employees = ref([]);
const loading = ref(false);
const error = ref('');

const columns = [
  { name: 'employeeCode', label: 'Employee Code', field: 'employeeCode', align: 'left' },
  { name: 'fullName', label: 'Employee Name', field: 'fullName', align: 'left' },
];

function fetchEmployees() {
  if (!props.roleId) {
    return;
  }
  loading.value = true;
  error.value = '';
  api.get('/role/employees', { params: { roleId: props.roleId } })
    .then((res) => {
      employees.value = res.data || [];
    })
    .catch((err) => {
      error.value = err?.response?.data?.message || 'Failed to fetch employees.';
    })
    .finally(() => {
      loading.value = false;
    });
}

watch(() => props.roleId, (val) => {
  if (dialogVisible.value && val) fetchEmployees();
});
watch(dialogVisible, (val) => {
  if (val) fetchEmployees();
});
</script>
