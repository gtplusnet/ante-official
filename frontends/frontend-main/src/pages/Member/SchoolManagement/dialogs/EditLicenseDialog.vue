<template>
  <q-dialog ref="dialog" v-model="model">
    <q-card style="max-width: 500px; width: 100%; min-width: 400px">
      <q-bar class="bg-primary text-white cursor-default" dark>
        <q-icon name="edit" />
        <div>Edit License</div>

        <q-space />

        <q-btn dense flat icon="close" v-close-popup>
          <q-tooltip>Close</q-tooltip>
        </q-btn>
      </q-bar>

      <q-card-section class="q-pa-lg">
        <q-form @submit.prevent="onSubmit" class="row q-col-gutter-md">
          <!-- License Information Section -->
          <div class="col-12 q-mb-md">
            <div class="text-h6 text-primary">License Information</div>
            <q-separator class="q-mt-sm" />
          </div>

          <!-- License Key Display -->
          <div class="col-12">
            <div class="q-mb-sm">
              <div class="text-body2 text-grey-7">License Key</div>
              <div class="row items-center q-mt-xs">
                <code class="license-key q-mr-sm">{{ licenseData?.licenseKey || '' }}</code>
                <q-btn
                  flat
                  dense
                  round
                  icon="content_copy"
                  size="sm"
                  color="grey-6"
                  @click="copyLicenseKey"
                />
              </div>
            </div>
          </div>

          <!-- Gate -->
          <div class="col-12">
            <q-select
              v-model="formData.gateId"
              label="Gate"
              :options="gateOptions"
              option-value="id"
              option-label="gateName"
              emit-value
              map-options
              outlined
              dense
              :loading="loadingGates"
              :rules="[(val: any) => !!val || 'Gate is required']"
              hint="Select the gate this license is assigned to"
            />
          </div>

          <!-- Status -->
          <div class="col-12">
            <div class="text-body2 text-grey-7 q-mb-sm">Status</div>
            <q-toggle
              v-model="formData.isActive"
              color="green"
              :true-value="true"
              :false-value="false"
              :label="formData.isActive ? 'Active' : 'Inactive'"
            />
          </div>

          <!-- Connected Device Info -->
          <div class="col-12" v-if="licenseData?.connectedDevice">
            <div class="text-body2 text-grey-7 q-mb-sm">Connected Device</div>
            <q-card flat bordered class="q-pa-md">
              <div class="row items-center q-gutter-md">
                <q-icon name="wifi" color="green" size="md" />
                <div>
                  <div class="text-weight-medium">{{ licenseData.connectedDevice.deviceName }}</div>
                  <div class="text-caption text-grey-6">MAC: {{ licenseData.connectedDevice.macAddress }}</div>
                  <div class="text-caption text-grey-6">
                    Last seen: {{ formatDate(licenseData.connectedDevice.lastSeen) }}
                  </div>
                </div>
              </div>
            </q-card>
          </div>

          <!-- Usage Information -->
          <div class="col-12" v-if="licenseData?.dateFirstUsed || licenseData?.dateLastUsed">
            <div class="text-body2 text-grey-7 q-mb-sm">Usage Information</div>
            <q-card flat bordered class="q-pa-md">
              <div class="row q-gutter-md">
                <div class="col">
                  <div class="text-caption text-grey-6">First Used</div>
                  <div class="text-body2">
                    {{ licenseData.dateFirstUsed ? formatDate(licenseData.dateFirstUsed) : 'Never' }}
                  </div>
                </div>
                <div class="col">
                  <div class="text-caption text-grey-6">Last Used</div>
                  <div class="text-body2">
                    {{ licenseData.dateLastUsed ? formatDate(licenseData.dateLastUsed) : 'Never' }}
                  </div>
                </div>
              </div>
            </q-card>
          </div>

          <!-- Submit Button -->
          <div class="col-12 q-mt-lg">
            <q-btn 
              type="submit" 
              color="primary" 
              unelevated 
              no-caps 
              :loading="isLoading"
              :disabled="!formData.gateId"
              class="full-width"
            >
              <q-icon name="save" class="q-mr-sm" />
              Save Changes
            </q-btn>
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script lang="ts">
import { defineComponent, ref, computed, watch } from 'vue';
import { useQuasar } from 'quasar';
import { api } from 'src/boot/axios';
import { AxiosError } from 'axios';
import { handleAxiosError } from 'src/utility/axios.error.handler';

interface DeviceLicenseResponse {
  id: number;
  licenseKey: string;
  gateId: string | null;
  gate: {
    id: string;
    gateName: string;
  } | null;
  isActive: boolean;
  dateFirstUsed: string | null;
  dateLastUsed: string | null;
  connectedDevice: {
    deviceName: string;
    macAddress: string;
    lastSeen: string;
  } | null;
}

interface FormData {
  gateId: string;
  isActive: boolean;
}

interface Gate {
  id: string;
  gateName: string;
}

export default defineComponent({
  name: 'EditLicenseDialog',
  components: {
    // No additional components needed since we're using q-select directly
  },
  props: {
    modelValue: {
      type: Boolean,
      default: false,
    },
    licenseData: {
      type: Object as () => DeviceLicenseResponse | null,
      default: null,
    },
  },
  emits: ['update:modelValue', 'saveDone'],
  setup(props, { emit }) {
    const $q = useQuasar();
    const isLoading = ref(false);

    const model = computed({
      get() {
        return props.modelValue;
      },
      set(value) {
        emit('update:modelValue', value);
      },
    });

    const formData = ref<FormData>({
      gateId: '',
      isActive: true,
    });

    const gateOptions = ref<Gate[]>([]);
    const loadingGates = ref(false);

    const loadGates = async () => {
      loadingGates.value = true;
      try {
        const response = await api.get('/school/gate/list');
        
        // Handle the direct array response
        gateOptions.value = response.data;
      } catch (error) {
        handleAxiosError($q, error as AxiosError);
      } finally {
        loadingGates.value = false;
      }
    };

    // Initialize form data when licenseData changes
    watch(
      () => props.licenseData,
      (newData) => {
        if (newData) {
          formData.value = {
            gateId: newData.gateId || '',
            isActive: newData.isActive,
          };
        }
      },
      { immediate: true }
    );

    // Load gates when dialog opens
    watch(
      () => props.modelValue,
      (newValue) => {
        if (newValue) {
          loadGates();
        }
      }
    );

    const copyLicenseKey = () => {
      if (props.licenseData?.licenseKey) {
        navigator.clipboard.writeText(props.licenseData.licenseKey).then(() => {
          $q.notify({
            type: 'positive',
            message: 'License key copied to clipboard',
            position: 'top',
          });
        }).catch(() => {
          $q.notify({
            type: 'negative',
            message: 'Failed to copy license key',
            position: 'top',
          });
        });
      }
    };

    const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    };

    const onSubmit = async () => {
      if (!formData.value.gateId || !props.licenseData) {
        $q.notify({
          type: 'negative',
          message: 'Please fill in all required fields',
          position: 'top',
        });
        return;
      }

      isLoading.value = true;

      try {
        const response = await api.put('/school/device-license/update', {
          id: props.licenseData.id,
          gateId: formData.value.gateId,
          isActive: formData.value.isActive,
        });

        if (response.data.success) {
          $q.notify({
            type: 'positive',
            message: 'License updated successfully',
            position: 'top',
          });
          
          emit('saveDone');
          emit('update:modelValue', false);
        }
      } catch (error) {
        handleAxiosError($q, error as AxiosError);
      } finally {
        isLoading.value = false;
      }
    };

    return {
      model,
      formData,
      gateOptions,
      loadingGates,
      isLoading,
      onSubmit,
      copyLicenseKey,
      formatDate,
    };
  },
});
</script>

<style scoped>
.text-h6 {
  font-weight: 600;
}

.license-key {
  font-family: 'Courier New', monospace;
  background-color: #f5f5f5;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  color: #2c3e50;
}
</style>