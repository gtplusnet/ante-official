<template>
  <q-dialog ref="dialog" v-model="model">
    <q-card style="max-width: 500px; width: 100%; min-width: 400px">
      <q-bar class="bg-primary text-white cursor-default" dark>
        <q-icon name="o_devices" />
        <div>Generate License Keys</div>

        <q-space />

        <q-btn dense flat icon="close" v-close-popup>
          <q-tooltip>Close</q-tooltip>
        </q-btn>
      </q-bar>

      <q-card-section class="q-pa-lg">
        <q-form @submit.prevent="onSubmit" class="row q-col-gutter-md">
          <!-- License Generation Section -->
          <div class="col-12 q-mb-md">
            <div class="text-h6 text-primary">License Configuration</div>
            <q-separator class="q-mt-sm" />
          </div>

          <!-- Quantity -->
          <div class="col-12">
            <GInput 
              required 
              type="number" 
              label="Number of Licenses" 
              v-model="formData.quantity"
              :min="1"
              :max="100"
              hint="Enter the number of license keys to generate (1-100)"
            />
          </div>

          <!-- Gate Selection -->
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
              hint="Select the gate these licenses will be assigned to"
            />
          </div>

          <div class="col-12 q-mt-md">
            <div class="text-body2 text-grey-6">
              <q-icon name="info" class="q-mr-sm" />
              License keys will be automatically generated and can be used to connect tablet devices for student attendance tracking.
            </div>
          </div>

          <!-- Submit Button -->
          <div class="col-12 q-mt-lg">
            <q-btn 
              type="submit" 
              color="primary" 
              unelevated 
              no-caps 
              :loading="isLoading"
              :disabled="!formData.quantity || !formData.gateId"
              class="full-width"
            >
              <q-icon name="add" class="q-mr-sm" />
              Generate {{ formData.quantity || 0 }} License{{ (formData.quantity || 0) !== 1 ? 's' : '' }}
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
import GInput from 'src/components/shared/form/GInput.vue';

interface FormData {
  quantity: number | null;
  gateId: string;
}

interface Gate {
  id: string;
  gateName: string;
}

export default defineComponent({
  name: 'GenerateLicensesDialog',
  components: {
    GInput,
  },
  props: {
    modelValue: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['update:modelValue', 'generateDone'],
  setup(props, { emit }) {
    const $q = useQuasar();
    const dialog = ref();
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
      quantity: null,
      gateId: '',
    });

    const gateOptions = ref<Gate[]>([]);
    const loadingGates = ref(false);

    const resetForm = () => {
      formData.value = {
        quantity: null,
        gateId: '',
      };
    };

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

    // Watch for model changes and reset form when dialog closes
    watch(() => props.modelValue, (newValue) => {
      if (!newValue) {
        resetForm();
      } else {
        loadGates();
      }
    });

    const onSubmit = async () => {
      if (!formData.value.quantity || !formData.value.gateId) {
        $q.notify({
          type: 'negative',
          message: 'Please fill in all required fields',
          position: 'top',
        });
        return;
      }

      if (formData.value.quantity < 1 || formData.value.quantity > 100) {
        $q.notify({
          type: 'negative',
          message: 'Quantity must be between 1 and 100',
          position: 'top',
        });
        return;
      }

      isLoading.value = true;

      try {
        const response = await api.post('/school/device-license/generate', {
          quantity: formData.value.quantity,
          gateId: formData.value.gateId,
        });

        if (response.data.success) {
          $q.notify({
            type: 'positive',
            message: `Successfully generated ${formData.value.quantity} license key${formData.value.quantity !== 1 ? 's' : ''}`,
            position: 'top',
          });
          
          console.log('Generate success - closing dialog');
          resetForm();
          emit('generateDone');
          emit('update:modelValue', false);
          model.value = false; // Force close the dialog
        }
      } catch (error) {
        handleAxiosError($q, error as AxiosError);
      } finally {
        isLoading.value = false;
      }
    };

    return {
      dialog,
      model,
      formData,
      gateOptions,
      loadingGates,
      isLoading,
      onSubmit,
      resetForm,
    };
  },
});
</script>

<style scoped>
.text-h6 {
  font-weight: 600;
}
</style>