<template>
  <q-dialog v-model="isOpen" persistent>
    <q-card class="cron-builder-card">
      <q-card-section class="dialog-header">
        <div class="dialog-title">Schedule Builder</div>
        <q-btn icon="close" flat round dense v-close-popup class="close-button" />
      </q-card-section>

      <q-card-section class="dialog-content">
        <q-tabs
          v-model="tab"
          dense
          active-color="primary"
          indicator-color="primary"
          align="left"
          narrow-indicator
        >
          <q-tab name="templates" label="Quick Templates" />
          <q-tab name="custom" label="Custom Schedule" />
        </q-tabs>

        <q-separator />

        <q-tab-panels v-model="tab" animated>
          <q-tab-panel name="templates" class="templates-panel">
            <div class="template-groups">
              <div v-for="group in templateGroups" :key="group.name" class="template-group">
                <div class="group-title">{{ group.name }}</div>
                <div class="template-options">
                  <q-btn
                    v-for="option in group.options"
                    :key="option.value"
                    @click="selectTemplate(option)"
                    :label="option.label"
                    :outline="selectedCron !== option.value"
                    :unelevated="selectedCron === option.value"
                    color="primary"
                    size="sm"
                    class="template-btn"
                  />
                </div>
              </div>
            </div>
          </q-tab-panel>

          <q-tab-panel name="custom" class="custom-panel">
            <div class="custom-builder">
              <div class="builder-row">
                <label class="builder-label">Run every</label>
                <q-select
                  v-model="customSchedule.interval"
                  :options="intervalOptions"
                  outlined
                  dense
                  emit-value
                  map-options
                  class="interval-select"
                />
              </div>

              <div v-if="customSchedule.interval === 'minute'" class="builder-row">
                <label class="builder-label">Every</label>
                <q-input
                  v-model.number="customSchedule.minuteInterval"
                  type="number"
                  min="1"
                  max="59"
                  outlined
                  dense
                  suffix="minute(s)"
                  class="time-input"
                />
              </div>

              <div v-if="customSchedule.interval === 'hour'" class="builder-row">
                <label class="builder-label">At minute</label>
                <q-input
                  v-model.number="customSchedule.minute"
                  type="number"
                  min="0"
                  max="59"
                  outlined
                  dense
                  suffix="past the hour"
                  class="time-input"
                />
              </div>

              <div v-if="customSchedule.interval === 'day'" class="builder-row">
                <label class="builder-label">At time</label>
                <q-input
                  v-model="customSchedule.time"
                  mask="time"
                  :rules="['time']"
                  outlined
                  dense
                  class="time-input"
                >
                  <template v-slot:append>
                    <q-icon name="access_time" class="cursor-pointer">
                      <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                        <q-time v-model="customSchedule.time" />
                      </q-popup-proxy>
                    </q-icon>
                  </template>
                </q-input>
              </div>

              <div v-if="customSchedule.interval === 'week'" class="builder-row">
                <label class="builder-label">On days</label>
                <div class="weekday-selector">
                  <q-btn
                    v-for="day in weekDays"
                    :key="day.value"
                    @click="toggleWeekDay(day.value)"
                    :label="day.label"
                    :outline="!customSchedule.weekDays.includes(day.value)"
                    :unelevated="customSchedule.weekDays.includes(day.value)"
                    color="primary"
                    size="sm"
                    class="weekday-btn"
                  />
                </div>
              </div>

              <div v-if="customSchedule.interval === 'week'" class="builder-row">
                <label class="builder-label">At time</label>
                <q-input
                  v-model="customSchedule.time"
                  mask="time"
                  :rules="['time']"
                  outlined
                  dense
                  class="time-input"
                >
                  <template v-slot:append>
                    <q-icon name="access_time" class="cursor-pointer">
                      <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                        <q-time v-model="customSchedule.time" />
                      </q-popup-proxy>
                    </q-icon>
                  </template>
                </q-input>
              </div>

              <div v-if="customSchedule.interval === 'month'" class="builder-row">
                <label class="builder-label">On day</label>
                <q-input
                  v-model.number="customSchedule.dayOfMonth"
                  type="number"
                  min="1"
                  max="31"
                  outlined
                  dense
                  suffix="of the month"
                  class="time-input"
                />
              </div>

              <div v-if="customSchedule.interval === 'month'" class="builder-row">
                <label class="builder-label">At time</label>
                <q-input
                  v-model="customSchedule.time"
                  mask="time"
                  :rules="['time']"
                  outlined
                  dense
                  class="time-input"
                >
                  <template v-slot:append>
                    <q-icon name="access_time" class="cursor-pointer">
                      <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                        <q-time v-model="customSchedule.time" />
                      </q-popup-proxy>
                    </q-icon>
                  </template>
                </q-input>
              </div>
            </div>
          </q-tab-panel>
        </q-tab-panels>

        <div class="preview-section">
          <div class="preview-label">Preview</div>
          <div class="preview-content">
            <div class="cron-expression">{{ currentCron }}</div>
            <div class="cron-description">{{ currentDescription }}</div>
          </div>
        </div>
      </q-card-section>

      <q-card-section class="dialog-actions">
        <q-btn label="Cancel" flat v-close-popup class="cancel-btn" />
        <q-btn
          label="Apply Schedule"
          color="primary"
          unelevated
          @click="applySchedule"
          :disable="!currentCron"
        />
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script>
import { defineComponent, ref, computed, watch } from 'vue';
import { getCronDescription } from 'src/utils/cronHelper';

export default defineComponent({
  name: 'CronBuilderDialog',
  props: {
    modelValue: {
      type: Boolean,
      required: true,
    },
    initialCron: {
      type: String,
      default: '0 0 * * *',
    },
  },
  emits: ['update:modelValue', 'apply'],
  setup(props, { emit }) {
    const tab = ref('templates');
    const selectedCron = ref(props.initialCron);
    
    const customSchedule = ref({
      interval: 'day',
      minute: 0,
      minuteInterval: 5,
      time: '00:00',
      weekDays: [],
      dayOfMonth: 1,
    });

    const templateGroups = [
      {
        name: 'Frequent',
        options: [
          { label: 'Every minute', value: '* * * * *' },
          { label: 'Every 5 minutes', value: '*/5 * * * *' },
          { label: 'Every 15 minutes', value: '*/15 * * * *' },
          { label: 'Every 30 minutes', value: '*/30 * * * *' },
          { label: 'Every hour', value: '0 * * * *' },
        ],
      },
      {
        name: 'Daily',
        options: [
          { label: 'Midnight', value: '0 0 * * *' },
          { label: '6:00 AM', value: '0 6 * * *' },
          { label: '9:00 AM', value: '0 9 * * *' },
          { label: 'Noon', value: '0 12 * * *' },
          { label: '6:00 PM', value: '0 18 * * *' },
        ],
      },
      {
        name: 'Weekly',
        options: [
          { label: 'Monday 9 AM', value: '0 9 * * 1' },
          { label: 'Weekdays 9 AM', value: '0 9 * * 1-5' },
          { label: 'Sunday Midnight', value: '0 0 * * 0' },
        ],
      },
      {
        name: 'Monthly',
        options: [
          { label: '1st of month', value: '0 0 1 * *' },
          { label: '15th of month', value: '0 0 15 * *' },
          { label: 'Last day', value: '0 0 L * *' },
        ],
      },
    ];

    const intervalOptions = [
      { label: 'Minute', value: 'minute' },
      { label: 'Hour', value: 'hour' },
      { label: 'Day', value: 'day' },
      { label: 'Week', value: 'week' },
      { label: 'Month', value: 'month' },
    ];

    const weekDays = [
      { label: 'Sun', value: 0 },
      { label: 'Mon', value: 1 },
      { label: 'Tue', value: 2 },
      { label: 'Wed', value: 3 },
      { label: 'Thu', value: 4 },
      { label: 'Fri', value: 5 },
      { label: 'Sat', value: 6 },
    ];

    const isOpen = computed({
      get: () => props.modelValue,
      set: (val) => emit('update:modelValue', val),
    });

    const currentCron = computed(() => {
      if (tab.value === 'templates') {
        return selectedCron.value;
      }
      
      // Build cron from custom settings
      const time = customSchedule.value.time.split(':');
      const hour = parseInt(time[0]);
      const minute = parseInt(time[1]);
      
      switch (customSchedule.value.interval) {
        case 'minute':
          return `*/${customSchedule.value.minuteInterval} * * * *`;
        case 'hour':
          return `${customSchedule.value.minute} * * * *`;
        case 'day':
          return `${minute} ${hour} * * *`;
        case 'week':
          if (customSchedule.value.weekDays.length === 0) return '';
          const days = [...customSchedule.value.weekDays].sort().join(',');
          return `${minute} ${hour} * * ${days}`;
        case 'month':
          return `${minute} ${hour} ${customSchedule.value.dayOfMonth} * *`;
        default:
          return '';
      }
    });

    const currentDescription = computed(() => {
      if (!currentCron.value) return 'Invalid schedule';
      try {
        return getCronDescription(currentCron.value);
      } catch (e) {
        return 'Invalid cron expression';
      }
    });

    const selectTemplate = (option) => {
      selectedCron.value = option.value;
      tab.value = 'templates';
    };

    const toggleWeekDay = (day) => {
      const index = customSchedule.value.weekDays.indexOf(day);
      if (index > -1) {
        customSchedule.value.weekDays = customSchedule.value.weekDays.filter(d => d !== day);
      } else {
        customSchedule.value.weekDays = [...customSchedule.value.weekDays, day];
      }
    };

    const applySchedule = () => {
      emit('apply', currentCron.value);
      isOpen.value = false;
    };

    watch(() => props.initialCron, (newVal) => {
      selectedCron.value = newVal;
    });

    return {
      isOpen,
      tab,
      selectedCron,
      customSchedule,
      templateGroups,
      intervalOptions,
      weekDays,
      currentCron,
      currentDescription,
      selectTemplate,
      toggleWeekDay,
      applySchedule,
    };
  },
});
</script>

<style lang="scss" scoped>
.cron-builder-card {
  min-width: 700px;
  max-width: 800px;
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
  padding: 0;
}

.templates-panel {
  padding: 24px;
}

.template-groups {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.template-group {
  .group-title {
    font-size: 14px;
    font-weight: 500;
    color: #616161;
    margin-bottom: 12px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
}

.template-options {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.template-btn {
  text-transform: none;
  font-weight: 400;
}

.custom-panel {
  padding: 24px;
}

.custom-builder {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.builder-row {
  display: flex;
  align-items: center;
  gap: 16px;
}

.builder-label {
  min-width: 100px;
  font-size: 14px;
  color: #616161;
}

.interval-select {
  width: 200px;
}

.time-input {
  width: 200px;
}

.weekday-selector {
  display: flex;
  gap: 4px;
}

.weekday-btn {
  min-width: 50px;
  text-transform: none;
}

.preview-section {
  background: #f5f5f5;
  padding: 20px 24px;
  border-top: 1px solid #e0e0e0;
}

.preview-label {
  font-size: 12px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #757575;
  margin-bottom: 8px;
}

.preview-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.cron-expression {
  font-family: 'Roboto Mono', monospace;
  font-size: 16px;
  color: #1a1a1a;
  font-weight: 500;
}

.cron-description {
  font-size: 14px;
  color: #616161;
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
</style>