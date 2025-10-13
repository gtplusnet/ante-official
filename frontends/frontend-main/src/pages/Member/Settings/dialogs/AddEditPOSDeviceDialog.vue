<template>
  <q-dialog v-model="dialogModel" persistent>
    <q-card flat bordered class="md3-dialog-dense" style="min-width: 500px;">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">{{ isEditMode ? 'Edit' : 'Add' }} POS Device</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section class="q-pt-md">
        <q-form @submit="saveDevice" class="q-gutter-md">
          <q-input
            v-model="form.name"
            label="Device Name *"
            outlined
            dense
            :rules="[val => !!val || 'Device name is required']"
            hint="Example: Main Counter POS, Kitchen Display, etc."
          />

          <q-input
            v-model="form.location"
            label="Location"
            outlined
            dense
            hint="Where is this device located?"
          />

          <BranchTreeSelect
            v-model="selectedBranchArray"
            label="Branch *"
            placeholder="Select a branch"
            :include-children="false"
            :show-all-option="false"
            outlined
            dense
          />

          <q-toggle
            v-if="isEditMode"
            v-model="form.isActive"
            label="Device Active"
            color="primary"
          />

          <div class="row q-gutter-sm q-pt-md">
            <q-btn
              type="submit"
              unelevated
              color="primary"
              :label="isEditMode ? 'Update' : 'Create'"
              :loading="saving"
            />
            <q-btn
              flat
              color="grey"
              label="Cancel"
              v-close-popup
            />
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, computed, watch, getCurrentInstance } from 'vue';
import { useQuasar } from 'quasar';
import BranchTreeSelect from 'src/components/selection/BranchTreeSelect.vue';

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
  device: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(['update:modelValue', 'saved']);

const { proxy } = getCurrentInstance();
const $q = useQuasar();

// Data
const saving = ref(false);

const form = ref({
  name: '',
  location: '',
  branchId: null,
  isActive: true,
});

// Computed
const dialogModel = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
});

const isEditMode = computed(() => !!props.device);

// Computed property to convert between single branchId and array format for BranchTreeSelect
const selectedBranchArray = computed({
  get: () => {
    // Convert single branchId to array format
    return form.value.branchId ? [form.value.branchId] : [];
  },
  set: (value) => {
    // Convert array to single branchId (take first element)
    form.value.branchId = value && value.length > 0 ? value[0] : null;
  },
});

// Methods

const resetForm = () => {
  form.value = {
    name: '',
    location: '',
    branchId: null,
    isActive: true,
  };
};

const saveDevice = async () => {
  // Validate branch selection
  if (!form.value.branchId) {
    $q.notify({
      type: 'negative',
      message: 'Please select a branch',
    });
    return;
  }

  saving.value = true;
  try {
    let response;

    if (isEditMode.value) {
      // Update existing device
      response = await proxy.$api.put(`/pos-device/${props.device.id}`, {
        name: form.value.name,
        location: form.value.location,
        branchId: form.value.branchId,
        isActive: form.value.isActive,
      });

      $q.notify({
        type: 'positive',
        message: 'POS device updated successfully',
      });

      emit('saved', { device: response.data });
    } else {
      // Create new device
      response = await proxy.$api.post('/pos-device', {
        name: form.value.name,
        location: form.value.location,
        branchId: form.value.branchId,
      });

      $q.notify({
        type: 'positive',
        message: response.data.message || 'POS device created successfully',
      });

      emit('saved', response.data);
    }

    resetForm();
  } catch (error) {
    console.error('Error saving device:', error);
    $q.notify({
      type: 'negative',
      message: error.response?.data?.message || 'Failed to save POS device',
    });
  } finally {
    saving.value = false;
  }
};

// Watchers
watch(() => props.device, (newDevice) => {
  if (newDevice) {
    form.value = {
      name: newDevice.name,
      location: newDevice.location || '',
      branchId: newDevice.branchId,
      isActive: newDevice.isActive,
    };
  } else {
    resetForm();
  }
}, { immediate: true });
</script>

<style scoped lang="scss">
.md3-dialog-dense {
  .q-card__section {
    padding: 16px;
  }
}
</style>
