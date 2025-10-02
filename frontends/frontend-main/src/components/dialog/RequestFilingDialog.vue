<template>
  <q-dialog v-model="isOpen">
    <TemplateDialog minWidth="400px" maxWidth="400px">
      <template #DialogTitle> Request Filing </template>
      <template #DialogContent>
        <div v-for="action in requestActions" :key="action.label" class="request-action-container">
          <GButton
            :rounded="false"
            align="left"
            color="white"
            text-color="text-dark"
            :icon="action.icon"
            :icon-color="action.color"
            :label="action.label"
            class="full-width q-py-md"
            @click="action.onClick"
          />
        </div>
      </template>
    </TemplateDialog>
  </q-dialog>
</template>

<script lang="ts">
import { computed } from 'vue';
import { defineComponent } from 'vue';
import TemplateDialog from './TemplateDialog.vue';
import GButton from 'src/components/shared/buttons/GButton.vue';

export default defineComponent({
  name: 'RequestFilingDialog',
  components: {
    TemplateDialog,
    GButton,
  },
  props: {
    modelValue: {
      type: Boolean,
      default: false,
    },
  },
  emits: [
    'update:modelValue',
    'open-leave',
    'open-overtime',
    'open-official-business',
    'open-certificate-attendance',
    'open-schedule-adjustment',
  ],

  setup(props, { emit }) {
    const isOpen = computed({
      get: () => props.modelValue,
      set: (value: boolean) => emit('update:modelValue', value),
    });
    const requestActions = [
      {
        icon: 'event_busy',
        label: 'Leave',
        color: '#00897B',
        onClick: () => emit('open-leave'),
      },
      {
        icon: 'alarm_add',
        label: 'Overtime',
        color: '#FB8C00',
        onClick: () => emit('open-overtime'),
      },
      {
        icon: 'work_history',
        label: 'Official Business',
        color: '#1E88E5',
        onClick: () => emit('open-official-business'),
      },
      {
        icon: 'event_available',
        label: 'Certificate of Attendance',
        color: '#43A047',
        onClick: () => emit('open-certificate-attendance'),
      },
      {
        icon: 'brightness_6',
        label: 'Schedule Adjustment',
        color: '#8E24AA',
        onClick: () => emit('open-schedule-adjustment'),
      },
    ];

    return {
      isOpen,
      requestActions,
    };
  },
});
</script>
