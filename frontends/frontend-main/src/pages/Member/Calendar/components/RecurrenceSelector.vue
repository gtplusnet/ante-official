<template>
  <div class="recurrence-selector">
    <!-- Main Dropdown -->
    <q-select
      v-model="selectedOption"
      :options="quickOptions"
      label="Recurrence"
      outlined
      dense
      emit-value
      map-options
      @update:model-value="handleQuickSelect"
    >
      <template v-slot:prepend>
        <q-icon name="repeat" size="20px" />
      </template>
    </q-select>

    <!-- Live Preview -->
    <div v-if="recurrenceText" class="recurrence-preview q-mt-sm">
      <q-icon name="info_outline" size="16px" color="primary" />
      <span class="text-caption text-grey-7">{{ recurrenceText }}</span>
    </div>

    <!-- Custom Recurrence Dialog -->
    <q-dialog v-model="showCustomDialog" persistent>
      <q-card style="min-width: 500px; max-width: 600px">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">Custom Recurrence</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section>
          <!-- Frequency -->
          <div class="row q-gutter-sm items-center q-mb-md">
            <span class="text-body2">Repeat every</span>
            <q-input
              v-model.number="customForm.frequency"
              type="number"
              outlined
              dense
              min="1"
              style="width: 80px"
            />
            <q-select
              v-model="customForm.recurrenceType"
              :options="frequencyOptions"
              outlined
              dense
              emit-value
              map-options
              style="width: 150px"
            />
          </div>

          <!-- Days of Week (for weekly) -->
          <div v-if="customForm.recurrenceType === 'weekly'" class="q-mb-md">
            <div class="text-caption text-grey-7 q-mb-xs">Repeat on:</div>
            <div class="row q-gutter-xs">
              <q-btn
                v-for="day in weekDays"
                :key="day.value"
                :label="day.short"
                :outline="!customForm.byDay.includes(day.value)"
                :unelevated="customForm.byDay.includes(day.value)"
                :color="customForm.byDay.includes(day.value) ? 'primary' : 'grey-5'"
                size="sm"
                @click="toggleDay(day.value)"
                style="min-width: 40px"
              />
            </div>
          </div>

          <!-- End Options -->
          <div class="q-mb-md">
            <div class="text-caption text-grey-7 q-mb-xs">Ends:</div>
            <q-radio v-model="endType" val="never" label="Never" dense />
            <div class="q-mt-sm">
              <q-radio v-model="endType" val="until" label="On" dense />
              <q-input
                v-if="endType === 'until'"
                v-model="customForm.until"
                type="date"
                outlined
                dense
                class="q-ml-lg q-mt-xs"
                style="max-width: 200px"
              />
            </div>
            <div class="q-mt-sm">
              <q-radio v-model="endType" val="count" label="After" dense />
              <div v-if="endType === 'count'" class="row q-gutter-sm items-center q-ml-lg q-mt-xs">
                <q-input
                  v-model.number="customForm.count"
                  type="number"
                  outlined
                  dense
                  min="1"
                  style="width: 100px"
                />
                <span class="text-caption">occurrences</span>
              </div>
            </div>
          </div>

          <!-- Summary Preview -->
          <q-card flat bordered class="bg-blue-1">
            <q-card-section class="q-pa-md">
              <div class="text-subtitle2 q-mb-sm">
                <q-icon name="event_repeat" class="q-mr-xs" color="primary" />
                Summary
              </div>
              <div class="text-body2">{{ previewText }}</div>
              <div v-if="previewOccurrences.length" class="q-mt-sm">
                <div class="text-caption text-grey-7">Next occurrences:</div>
                <ul class="text-caption q-mt-xs" style="margin: 0; padding-left: 20px">
                  <li v-for="(date, i) in previewOccurrences" :key="i">
                    {{ formatDate(date) }}
                  </li>
                </ul>
              </div>
            </q-card-section>
          </q-card>
        </q-card-section>

        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat label="Cancel" v-close-popup />
          <q-btn
            unelevated
            color="primary"
            label="Done"
            @click="saveCustom"
            :disable="!isValidCustom"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { RRule } from 'rrule';
import { date as qDate } from 'quasar';

interface Props {
  modelValue: any;
  eventStartDate: Date;
}

const props = defineProps<Props>();
const emit = defineEmits(['update:modelValue']);

// Quick options based on event date
const quickOptions = computed(() => {
  const dayName = qDate.formatDate(props.eventStartDate, 'dddd');
  const dayNum = props.eventStartDate.getDate();
  const monthName = qDate.formatDate(props.eventStartDate, 'MMMM');

  return [
    { label: 'Does not repeat', value: 'none' },
    { label: 'Daily', value: 'daily' },
    { label: 'Every weekday (Mon-Fri)', value: 'weekday' },
    { label: `Weekly on ${dayName}`, value: 'weekly' },
    { label: `Monthly on day ${dayNum}`, value: 'monthly' },
    { label: `Annually on ${monthName} ${dayNum}`, value: 'yearly' },
    { label: 'Every 2 weeks', value: 'biweekly' },
    { label: 'Custom...', value: 'custom' },
  ];
});

const selectedOption = ref('none');
const showCustomDialog = ref(false);
const endType = ref<'never' | 'until' | 'count'>('never');

const customForm = ref({
  recurrenceType: 'weekly',
  frequency: 1,
  byDay: [] as string[],
  count: null as number | null,
  until: '',
});

const weekDays = [
  { value: 'SU', short: 'S', full: 'Sunday' },
  { value: 'MO', short: 'M', full: 'Monday' },
  { value: 'TU', short: 'T', full: 'Tuesday' },
  { value: 'WE', short: 'W', full: 'Wednesday' },
  { value: 'TH', short: 'T', full: 'Thursday' },
  { value: 'FR', short: 'F', full: 'Friday' },
  { value: 'SA', short: 'S', full: 'Saturday' },
];

const frequencyOptions = [
  { label: 'day(s)', value: 'daily' },
  { label: 'week(s)', value: 'weekly' },
  { label: 'month(s)', value: 'monthly' },
  { label: 'year(s)', value: 'yearly' },
];

// Validation for custom form
const isValidCustom = computed(() => {
  if (customForm.value.recurrenceType === 'weekly' && customForm.value.byDay.length === 0) {
    return false; // Weekly must have at least one day selected
  }
  if (endType.value === 'count' && (!customForm.value.count || customForm.value.count < 1)) {
    return false; // Count must be positive
  }
  if (endType.value === 'until' && !customForm.value.until) {
    return false; // Until date must be set
  }
  return true;
});

// Live preview
const previewText = computed(() => {
  if (selectedOption.value === 'none') return '';
  try {
    const rrule = buildRRuleFromForm();
    if (!rrule) return '';
    return rrule.toText();
  } catch (error) {
    console.error('Error generating preview:', error);
    return 'Invalid recurrence';
  }
});

const previewOccurrences = computed(() => {
  if (selectedOption.value === 'none') return [];
  try {
    const rrule = buildRRuleFromForm();
    if (!rrule) return [];
    return rrule.all((date, i) => i < 3); // First 3 occurrences
  } catch (error) {
    console.error('Error generating occurrences:', error);
    return [];
  }
});

const recurrenceText = computed(() => {
  if (selectedOption.value === 'none') return '';
  try {
    const rrule = buildRRuleFromForm();
    return rrule?.toText() || '';
  } catch (error) {
    return '';
  }
});

const handleQuickSelect = (value: string) => {
  if (value === 'custom') {
    // Initialize custom form with current event date
    const dayOfWeek = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'][props.eventStartDate.getDay()];
    customForm.value = {
      recurrenceType: 'weekly',
      frequency: 1,
      byDay: [dayOfWeek],
      count: null,
      until: '',
    };
    endType.value = 'never';
    showCustomDialog.value = true;
    return;
  }

  if (value === 'none') {
    emit('update:modelValue', null);
    return;
  }

  // Build recurrence object for quick options
  const recurrence = buildQuickRecurrence(value);
  emit('update:modelValue', recurrence);
};

const buildQuickRecurrence = (type: string) => {
  const dayOfWeek = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'][props.eventStartDate.getDay()];
  const dayOfMonth = props.eventStartDate.getDate();

  switch (type) {
    case 'daily':
      return { recurrenceType: 'daily', frequency: 1 };
    case 'weekday':
      return { recurrenceType: 'weekly', frequency: 1, byDay: ['MO', 'TU', 'WE', 'TH', 'FR'] };
    case 'weekly':
      return { recurrenceType: 'weekly', frequency: 1, byDay: [dayOfWeek] };
    case 'biweekly':
      return { recurrenceType: 'weekly', frequency: 2, byDay: [dayOfWeek] };
    case 'monthly':
      return { recurrenceType: 'monthly', frequency: 1, byMonthDay: [dayOfMonth] };
    case 'yearly':
      return { recurrenceType: 'yearly', frequency: 1 };
    default:
      return null;
  }
};

const toggleDay = (day: string) => {
  const index = customForm.value.byDay.indexOf(day);
  if (index > -1) {
    customForm.value.byDay.splice(index, 1);
  } else {
    customForm.value.byDay.push(day);
  }
};

const saveCustom = () => {
  if (!isValidCustom.value) return;

  const recurrence: any = {
    recurrenceType: customForm.value.recurrenceType,
    frequency: customForm.value.frequency,
    byDay: customForm.value.byDay,
    count: endType.value === 'count' ? customForm.value.count : null,
    until: endType.value === 'until' ? customForm.value.until : null,
  };

  emit('update:modelValue', recurrence);
  showCustomDialog.value = false;
  selectedOption.value = 'custom';
};

const buildRRuleFromForm = () => {
  const rec = selectedOption.value === 'custom'
    ? customForm.value
    : buildQuickRecurrence(selectedOption.value);

  if (!rec) return null;

  const options: any = {
    freq: mapFreq(rec.recurrenceType),
    interval: rec.frequency,
    dtstart: props.eventStartDate,
  };

  if (rec.byDay?.length) {
    options.byweekday = rec.byDay.map(mapDay);
  }
  if (rec.byMonthDay?.length) {
    options.bymonthday = rec.byMonthDay;
  }
  if (rec.count) options.count = rec.count;
  if (rec.until) options.until = new Date(rec.until);

  return new RRule(options);
};

const mapFreq = (type: string) => {
  const map: Record<string, any> = {
    daily: RRule.DAILY,
    weekly: RRule.WEEKLY,
    monthly: RRule.MONTHLY,
    yearly: RRule.YEARLY,
  };
  return map[type];
};

const mapDay = (day: string) => {
  const map: Record<string, any> = {
    SU: RRule.SU,
    MO: RRule.MO,
    TU: RRule.TU,
    WE: RRule.WE,
    TH: RRule.TH,
    FR: RRule.FR,
    SA: RRule.SA,
  };
  return map[day];
};

const formatDate = (date: Date) => {
  return qDate.formatDate(date, 'ddd, MMM D, YYYY');
};

// Watch for prop changes
watch(() => props.modelValue, (newVal) => {
  if (!newVal) {
    selectedOption.value = 'none';
  } else {
    // Try to match with quick options
    const quickMatch = findQuickMatch(newVal);
    selectedOption.value = quickMatch || 'custom';
  }
}, { immediate: true });

const findQuickMatch = (recurrence: any): string | null => {
  if (!recurrence) return null;

  const { recurrenceType, frequency, byDay, byMonthDay } = recurrence;

  if (recurrenceType === 'daily' && frequency === 1) return 'daily';
  if (recurrenceType === 'yearly' && frequency === 1) return 'yearly';

  if (recurrenceType === 'weekly') {
    if (frequency === 1 && byDay?.length === 5) {
      const weekdays = ['MO', 'TU', 'WE', 'TH', 'FR'];
      if (weekdays.every(d => byDay.includes(d))) return 'weekday';
    }
    if (frequency === 1 && byDay?.length === 1) return 'weekly';
    if (frequency === 2 && byDay?.length === 1) return 'biweekly';
  }

  if (recurrenceType === 'monthly' && frequency === 1 && byMonthDay?.length === 1) {
    return 'monthly';
  }

  return null;
};
</script>

<style scoped>
.recurrence-preview {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #f5f5f5;
  border-radius: 4px;
}
</style>
