<template>
  <q-dialog v-model="dialogModel">
    <q-card flat bordered class="md3-dialog-dense" style="min-width: 600px;">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">POS Device Details</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section v-if="device">
        <div class="q-gutter-sm">
          <!-- Device ID -->
          <div class="row">
            <div class="col-4 text-grey-7 text-weight-medium">Device ID:</div>
            <div class="col-8">
              <code class="device-id">{{ device.deviceId }}</code>
              <q-btn
                flat
                dense
                icon="content_copy"
                size="sm"
                color="primary"
                @click="copyToClipboard(device.deviceId, 'Device ID')"
                class="q-ml-sm"
              >
                <q-tooltip>Copy Device ID</q-tooltip>
              </q-btn>
            </div>
          </div>

          <!-- Name -->
          <div class="row">
            <div class="col-4 text-grey-7 text-weight-medium">Name:</div>
            <div class="col-8">{{ device.name }}</div>
          </div>

          <!-- Location -->
          <div class="row">
            <div class="col-4 text-grey-7 text-weight-medium">Location:</div>
            <div class="col-8">{{ device.location || 'Not specified' }}</div>
          </div>

          <!-- Branch -->
          <div class="row">
            <div class="col-4 text-grey-7 text-weight-medium">Branch:</div>
            <div class="col-8">
              <q-badge v-if="device.branch" color="primary" text-color="white">
                {{ device.branch.name }}
              </q-badge>
              <span v-else class="text-grey-6">Not assigned</span>
            </div>
          </div>

          <!-- Status -->
          <div class="row">
            <div class="col-4 text-grey-7 text-weight-medium">Status:</div>
            <div class="col-8">
              <q-chip
                dense
                :color="device.isActive ? 'positive' : 'negative'"
                text-color="white"
                size="sm"
              >
                {{ device.isActive ? 'Active' : 'Inactive' }}
              </q-chip>
            </div>
          </div>

          <!-- Created -->
          <div class="row">
            <div class="col-4 text-grey-7 text-weight-medium">Created:</div>
            <div class="col-8">{{ formatDate(device.createdAt) }}</div>
          </div>

          <!-- Last Activity -->
          <div class="row">
            <div class="col-4 text-grey-7 text-weight-medium">Last Activity:</div>
            <div class="col-8">
              {{ device.lastActivityAt ? formatDate(device.lastActivityAt) : 'Never' }}
            </div>
          </div>

          <!-- New API Key Section (only shown after creation/regeneration) -->
          <div v-if="newApiKey" class="q-mt-md">
            <q-card flat bordered class="bg-warning-1">
              <q-card-section>
                <div class="row items-center q-mb-sm">
                  <q-icon name="warning" color="warning" size="md" class="q-mr-sm" />
                  <div class="text-weight-medium text-h6">New API Key Generated!</div>
                </div>
                <div class="text-caption text-negative q-mb-sm">
                  ⚠️ Save this key now! It won't be shown again for security reasons.
                </div>
                <q-input
                  :model-value="newApiKey"
                  readonly
                  outlined
                  dense
                  type="textarea"
                  :rows="3"
                  class="q-mb-sm"
                >
                  <template v-slot:append>
                    <q-btn
                      flat
                      dense
                      icon="content_copy"
                      @click="copyToClipboard(newApiKey, 'API Key')"
                    >
                      <q-tooltip>Copy API Key</q-tooltip>
                    </q-btn>
                  </template>
                </q-input>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Close" v-close-popup />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed, getCurrentInstance } from 'vue';
import { useQuasar } from 'quasar';

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
  device: {
    type: Object,
    default: null,
  },
  newApiKey: {
    type: String,
    default: '',
  },
});

const emit = defineEmits(['update:modelValue']);

const { proxy } = getCurrentInstance();
const $q = useQuasar();

// Computed
const dialogModel = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
});

// Methods
const copyToClipboard = (text, label = 'Text') => {
  navigator.clipboard.writeText(text);
  $q.notify({
    type: 'positive',
    message: `${label} copied to clipboard`,
    timeout: 1500,
  });
};

const formatDate = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleString();
};
</script>

<style scoped lang="scss">
.md3-dialog-dense {
  .q-card__section {
    padding: 16px;
  }
}

.device-id {
  font-family: 'Courier New', monospace;
  background-color: #f5f5f5;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 13px;
  color: #1976d2;
  word-break: break-all;
}

.bg-warning-1 {
  background-color: #fff3cd;
  border-color: #ffc107;
}
</style>
