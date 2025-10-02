<template>
  <q-dialog v-model="isOpen" persistent @hide="onDialogHide">
    <q-card class="edit-dialog-card">
      <q-card-section class="dialog-header">
        <div class="dialog-title">Edit Scheduler Settings</div>
        <q-btn icon="close" flat round dense v-close-popup class="close-button" />
      </q-card-section>

      <q-card-section class="dialog-content">
        <q-form @submit="onSubmit" class="scheduler-form">
          <div class="form-field">
            <label class="field-label">Scheduler Name</label>
            <q-input
              v-model="form.name"
              outlined
              dense
              readonly
              class="readonly-input"
            />
          </div>

          <div class="form-field">
            <label class="field-label">Description</label>
            <q-input
              v-model="form.description"
              outlined
              dense
              type="textarea"
              rows="2"
              readonly
              class="readonly-input"
            />
          </div>

          <div class="form-field">
            <label class="field-label">Task Type</label>
            <q-input
              v-model="form.taskType"
              outlined
              dense
              readonly
              class="readonly-input"
            />
          </div>

          <div class="form-field">
            <label class="field-label">Schedule Frequency</label>
            <q-input
              v-model="form.cronExpression"
              outlined
              dense
              placeholder="Enter cron expression"
              class="cron-input"
            >
              <template v-slot:append>
                <q-btn
                  icon="schedule"
                  flat
                  round
                  dense
                  @click="openCronBuilder"
                  class="cron-builder-btn"
                >
                  <q-tooltip>Open Schedule Builder</q-tooltip>
                </q-btn>
              </template>
            </q-input>
            <div class="field-hint">
              {{ getCronDescription(form.cronExpression) }}
            </div>
          </div>

          <div v-if="form.taskType" class="form-field">
            <label class="field-label">Task Configuration</label>
            <component
              v-if="taskConfigComponent"
              :is="taskConfigComponent"
              v-model="form.taskConfig"
            />
            <div v-else>
              <q-input
                v-model="taskConfigJson"
                outlined
                dense
                type="textarea"
                rows="4"
                :rules="[validateJson]"
                placeholder="Enter JSON configuration"
                class="config-input"
              />
            </div>
          </div>

          <div class="form-field">
            <div class="toggle-wrapper">
              <q-toggle
                v-model="form.isActive"
                color="primary"
                :keep-color="true"
              />
              <div class="toggle-label">
                <div class="toggle-title">Active</div>
                <div class="toggle-subtitle">Enable or disable this scheduler</div>
              </div>
            </div>
          </div>
        </q-form>
      </q-card-section>

      <q-card-section class="dialog-actions">
        <q-btn label="Cancel" flat v-close-popup class="cancel-btn" />
        <q-btn
          label="Update Settings"
          color="primary"
          unelevated
          text-color="white"
          class="save-btn"
          @click="onSubmit"
          :loading="loading"
        />
      </q-card-section>
    </q-card>
  </q-dialog>

  <!-- Cron Builder Dialog -->
  <CronBuilderDialog
    v-model="showCronBuilder"
    :initial-cron="form.cronExpression"
    @apply="onCronApply"
  />
</template>

<script>
import { defineComponent, ref, computed, watch } from 'vue';
import { useQuasar } from 'quasar';
import { api } from 'src/boot/axios';
import CronBuilderDialog from './CronBuilderDialog.vue';
import { getCronDescription } from 'src/utils/cronHelper';

export default defineComponent({
  name: 'SchedulerAddEditDialog',
  components: {
    CronBuilderDialog,
  },
  props: {
    modelValue: {
      type: Boolean,
      required: true,
    },
    scheduler: {
      type: Object,
      default: null,
    },
    availableTasks: {
      type: Array,
      default: () => [],
    },
  },
  emits: ['update:modelValue', 'saved'],
  setup(props, { emit }) {
    const $q = useQuasar();
    const loading = ref(false);
    const taskConfigJson = ref('{}');
    const showCronBuilder = ref(false);

    const form = ref({
      name: '',
      description: '',
      taskType: '',
      cronExpression: '0 0 * * *',
      taskConfig: {},
      isActive: true,
    });

    const openCronBuilder = () => {
      showCronBuilder.value = true;
    };

    const onCronApply = (cronExpression) => {
      form.value.cronExpression = cronExpression;
    };


    const isOpen = computed({
      get: () => props.modelValue,
      set: (val) => emit('update:modelValue', val),
    });

    const taskOptions = computed(() => {
      return props.availableTasks.map((task) => ({
        label: `${task.name} - ${task.description}`,
        value: task.name,
      }));
    });

    const taskConfigComponent = computed(() => {
      // Return custom config components based on task type
      // For now, return null to use JSON editor
      return null;
    });

    watch(() => props.scheduler, (newVal) => {
      if (newVal) {
        form.value = {
          name: newVal.name || '',
          description: newVal.description || '',
          taskType: newVal.taskType || '',
          cronExpression: newVal.cronExpression || '0 0 * * *',
          taskConfig: newVal.taskConfig || {},
          isActive: newVal.isActive !== undefined ? newVal.isActive : true,
        };
        taskConfigJson.value = JSON.stringify(newVal.taskConfig || {}, null, 2);
      } else {
        resetForm();
      }
    });

    watch(() => form.value.taskConfig, (newVal) => {
      taskConfigJson.value = JSON.stringify(newVal, null, 2);
    });

    watch(taskConfigJson, (newVal) => {
      try {
        form.value.taskConfig = JSON.parse(newVal);
      } catch (e) {
        // Invalid JSON, will be caught by validation
      }
    });

    const resetForm = () => {
      form.value = {
        name: '',
        description: '',
        taskType: '',
        cronExpression: '0 0 * * *',
        taskConfig: {},
        isActive: true,
      };
      taskConfigJson.value = '{}';
    };

    const validateJson = (val) => {
      try {
        JSON.parse(val);
        return true;
      } catch (e) {
        return 'Invalid JSON';
      }
    };

    const onSubmit = async () => {
      // Validate form
      if (!form.value.cronExpression) {
        $q.notify({
          type: 'negative',
          message: 'Please provide a valid cron expression',
          position: 'top',
        });
        return;
      }

      loading.value = true;
      try {
        // Only send fields that can be updated
        const data = {
          cronExpression: form.value.cronExpression,
          isActive: form.value.isActive,
          taskConfig: JSON.parse(taskConfigJson.value),
        };

        await api.put(`/scheduler/${props.scheduler.id}`, data);
        $q.notify({
          type: 'positive',
          message: 'Scheduler settings updated successfully',
          position: 'top',
        });

        emit('saved');
        isOpen.value = false;
      } catch (error) {
        $q.notify({
          type: 'negative',
          message: error.response?.data?.message || 'Failed to update scheduler settings',
          position: 'top',
        });
      } finally {
        loading.value = false;
      }
    };

    const onDialogHide = () => {
      resetForm();
    };

    return {
      isOpen,
      form,
      loading,
      taskOptions,
      taskConfigComponent,
      taskConfigJson,
      onSubmit,
      onDialogHide,
      validateJson,
      showCronBuilder,
      openCronBuilder,
      onCronApply,
      getCronDescription,
    };
  },
});
</script>

<style lang="scss" scoped>
.edit-dialog-card {
  min-width: 600px;
  max-width: 700px;
  border-radius: 16px;
  overflow: hidden;
}

.dialog-header {
  background: #fafafa;
  border-bottom: 1px solid #e0e0e0;
  padding: 20px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;

  .dialog-title {
    font-size: 20px;
    font-weight: 500;
    color: #1a1a1a;
  }

  .close-button {
    &:hover {
      background: #f5f5f5;
    }
  }
}

.dialog-content {
  padding: 24px;
}

.scheduler-form {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.form-field {
  .field-label {
    display: block;
    font-size: 12px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: #757575;
    margin-bottom: 8px;
  }

  .field-hint {
    font-size: 12px;
    color: #9e9e9e;
    margin-top: 6px;
  }
}

.readonly-input {
  :deep(.q-field__control) {
    background: #fafafa;
    
    &:before {
      border-color: #e0e0e0;
    }
  }

  :deep(.q-field__native) {
    color: #616161;
  }
}

.cron-input {
  :deep(.q-field__control) {
    &:before {
      border-color: #e0e0e0;
    }
    
    &:hover:before {
      border-color: #9e9e9e;
    }
  }

  .cron-builder-btn {
    color: #616161;
    
    &:hover {
      background: #f5f5f5;
      color: #1976d2;
    }
  }
}

.config-input {
  :deep(.q-field__control) {
    font-family: 'Roboto Mono', monospace;
    font-size: 13px;
    
    &:before {
      border-color: #e0e0e0;
    }
  }
}

.toggle-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #fafafa;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
}

.toggle-label {
  flex: 1;
  
  .toggle-title {
    font-size: 14px;
    font-weight: 500;
    color: #1a1a1a;
  }
  
  .toggle-subtitle {
    font-size: 12px;
    color: #757575;
    margin-top: 2px;
  }
}

.dialog-actions {
  background: #fafafa;
  border-top: 1px solid #e0e0e0;
  padding: 16px 24px;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.cancel-btn {
  color: #757575;
  
  &:hover {
    background: #f5f5f5;
  }
}

.save-btn {
  background: #1976d2;
  color: white !important;
  
  &:hover {
    background: #1565c0;
    color: white !important;
  }
}
</style>