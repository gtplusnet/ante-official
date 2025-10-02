<template>
  <q-dialog ref="dialog" v-model="model">
    <q-card style="max-width: 900px; width: 100%; min-width: 600px">
      <q-bar class="bg-primary text-white cursor-default" dark>
        <q-icon name="o_family_restroom" />
        <div>{{ isEdit ? 'Edit' : 'Create' }} Guardian</div>

        <q-space />

        <q-btn dense flat icon="close" v-close-popup>
          <q-tooltip>Close</q-tooltip>
        </q-btn>
      </q-bar>

      <q-card-section class="q-pa-lg">
        <q-form @submit.prevent="onSubmit" class="row q-col-gutter-md">
          <!-- Personal Information Section -->
          <div class="col-12 q-mb-md">
            <div class="text-h6 text-primary">Personal Information</div>
            <q-separator class="q-mt-sm" />
          </div>

          <!-- First Name -->
          <div class="col-12 col-md-4">
            <GInput required type="text" label="First Name" v-model="formData.firstName"></GInput>
          </div>

          <!-- Last Name -->
          <div class="col-12 col-md-4">
            <GInput required type="text" label="Last Name" v-model="formData.lastName"></GInput>
          </div>

          <!-- Middle Name -->
          <div class="col-12 col-md-4">
            <GInput type="text" label="Middle Name" v-model="formData.middleName"></GInput>
          </div>

          <!-- Date of Birth -->
          <div class="col-12 col-md-6">
            <GInput required type="date" label="Date of Birth" v-model="formData.dateOfBirth"></GInput>
          </div>

          <!-- Contact Number -->
          <div class="col-12 col-md-6">
            <GInput required type="text" label="Contact Number" v-model="formData.contactNumber"></GInput>
          </div>

          <!-- Address -->
          <div class="col-12">
            <GInput type="text" label="Address" v-model="formData.address"></GInput>
          </div>

          <!-- Account Information Section -->
          <div class="col-12 q-mb-md q-mt-lg">
            <div class="text-h6 text-primary">Account Information</div>
            <q-separator class="q-mt-sm" />
          </div>

          <!-- Email -->
          <div class="col-12" :class="{ 'col-md-6': !isEdit }">
            <GInput required type="text" label="Email" v-model="formData.email"></GInput>
          </div>

          <!-- Password (only for new guardians) -->
          <div class="col-12 col-md-6" v-if="!isEdit">
            <GInput required type="password" label="Password" v-model="formData.password"></GInput>
          </div>

          <div class="col-12 text-right q-mt-xl">
            <q-btn no-caps class="q-mr-sm" outline label="Close" type="button" color="primary" v-close-popup />
            <q-btn no-caps unelevated label="Save Guardian" type="submit" color="primary" :loading="loading" />
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
import GInput from 'src/components/shared/form/GInput.vue';
import type { GuardianResponse } from '@shared/response';
import type { GuardianRequest } from '@shared/request';
import { AxiosError } from 'axios';

export default defineComponent({
  name: 'AddEditGuardianDialog',
  components: {
    GInput,
  },
  props: {
    modelValue: {
      type: Boolean,
      required: true,
    },
    guardianData: {
      type: Object as () => { data: GuardianResponse } | null,
      default: null,
    },
  },
  emits: ['update:modelValue', 'close', 'saveDone'],
  setup(props, { emit }) {
    const $q = useQuasar();
    const loading = ref(false);
    const dialog = ref();

    const model = computed({
      get: () => props.modelValue,
      set: (value) => emit('update:modelValue', value),
    });

    const isEdit = computed(() => !!props.guardianData);

    const formData = ref<Partial<GuardianRequest>>({
      firstName: '',
      lastName: '',
      middleName: '',
      dateOfBirth: '',
      email: '',
      password: '',
      contactNumber: '',
      address: '',
    });

    const resetForm = () => {
      if (props.guardianData) {
        let dateOfBirth = '';
        if (props.guardianData.data.dateOfBirth) {
          // Backend returns date in MM/DD/YYYY (hh:mm A) format
          const dateString = props.guardianData.data.dateOfBirth;
          
          // Extract date part and convert to YYYY-MM-DD for input
          const datePart = dateString.split(' ')[0]; // Get MM/DD/YYYY part
          if (datePart && datePart.includes('/')) {
            const [month, day, year] = datePart.split('/');
            dateOfBirth = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
          } else if (dateString.includes('T')) {
            // Fallback for ISO format
            dateOfBirth = dateString.split('T')[0];
          }
        }
        
        formData.value = {
          firstName: props.guardianData.data.firstName,
          lastName: props.guardianData.data.lastName,
          middleName: props.guardianData.data.middleName || '',
          dateOfBirth: dateOfBirth,
          email: props.guardianData.data.email,
          contactNumber: props.guardianData.data.contactNumber,
          address: props.guardianData.data.address || '',
        };
      } else {
        formData.value = {
          firstName: '',
          lastName: '',
          middleName: '',
          dateOfBirth: '',
          email: '',
          password: '',
          contactNumber: '',
          address: '',
        };
      }
    };

    const onSubmit = async () => {
      loading.value = true;
      try {
        let payload: any = {
          ...formData.value,
        };

        // Convert date to ISO 8601 format if present
        if (payload.dateOfBirth) {
          // The date is in YYYY-MM-DD format from the input
          // Convert to ISO 8601 format with time
          const date = new Date(payload.dateOfBirth);
          payload.dateOfBirth = date.toISOString();
        }

        // Remove password from payload if in edit mode
        if (isEdit.value) {
          delete payload.password;
        }


        if (isEdit.value && props.guardianData) {
          await api.put(`school/guardian/update?id=${props.guardianData.data.id}`, payload);
          $q.notify({
            type: 'positive',
            message: 'Guardian updated successfully',
          });
        } else {
          if (!payload.password) {
            $q.notify({
              type: 'negative',
              message: 'Password is required for new guardians',
            });
            loading.value = false;
            return;
          }
          await api.post('school/guardian/create', payload);
          $q.notify({
            type: 'positive',
            message: 'Guardian created successfully',
          });
        }

        handleSuccess();
      } catch (error) {
        const axiosError = error as AxiosError<{ message: string }>;
        $q.notify({
          type: 'negative',
          message: axiosError.response?.data?.message || 'Failed to save guardian',
        });
      } finally {
        loading.value = false;
      }
    };

    const handleSuccess = () => {
      emit('saveDone');
      emit('close');
      if ((dialog.value as any)?.$refs?.dialog) {
        (dialog.value as any).$refs.dialog.hide();
      }
    };

    watch(() => props.modelValue, (newVal) => {
      if (newVal) {
        resetForm();
      }
    });

    return {
      dialog,
      model,
      isEdit,
      loading,
      formData,
      onSubmit,
    };
  },
});
</script>