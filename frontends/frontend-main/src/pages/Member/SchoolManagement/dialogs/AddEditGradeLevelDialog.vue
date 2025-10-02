<template>
  <q-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)" persistent>
    <q-card style="width: 600px; max-width: 90vw">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">{{ isEdit ? 'Edit' : 'Add' }} Grade Level</div>
        <q-space />
        <q-btn icon="close" flat round dense @click="close" />
      </q-card-section>

      <q-form @submit="saveGradeLevel" ref="form">
        <q-card-section>
          <div class="row q-col-gutter-md">
            <div class="col-6">
              <g-input
                v-model="formData.code"
                label="Code"
                placeholder="e.g., G1, K1, Y1"
                :rules="[(val: any) => !!val || 'Code is required']"
                required
              />
            </div>

            <div class="col-6">
              <g-input
                v-model="formData.name"
                label="Grade Level Name"
                placeholder="e.g., Grade 1, Kindergarten 1"
                :rules="[(val: any) => !!val || 'Name is required']"
                required
              />
            </div>

            <div class="col-6">
              <q-select
                v-model="formData.educationLevel"
                label="Education Level"
                :options="educationLevelOptions"
                option-value="value"
                option-label="label"
                emit-value
                map-options
                outlined
                dense
                :rules="[(val: any) => !!val || 'Education level is required']"
              />
            </div>

            <div class="col-6">
              <g-input
                v-model.number="formData.sequence"
                label="Sequence Order"
                type="number"
                placeholder="e.g., 1, 2, 3"
                :rules="[
                  (val: any) => val !== null && val !== undefined || 'Sequence is required',
                  (val: any) => val > 0 || 'Sequence must be greater than 0'
                ]"
                required
              />
            </div>

            <div class="col-6">
              <g-input
                v-model.number="formData.ageRangeMin"
                label="Minimum Age (Optional)"
                type="number"
                placeholder="e.g., 5"
                :rules="[
                  (val: any) => val === null || val === undefined || val > 0 || 'Age must be greater than 0',
                  (val: any) => val === null || val === undefined || val <= 100 || 'Age must be less than 100'
                ]"
              />
            </div>

            <div class="col-6">
              <g-input
                v-model.number="formData.ageRangeMax"
                label="Maximum Age (Optional)"
                type="number"
                placeholder="e.g., 6"
                :rules="[
                  (val: any) => val === null || val === undefined || val > 0 || 'Age must be greater than 0',
                  (val: any) => val === null || val === undefined || val <= 100 || 'Age must be less than 100',
                  (val: any) => val === null || val === undefined || !formData.ageRangeMin || val >= formData.ageRangeMin || 'Max age must be greater than min age'
                ]"
              />
            </div>

            <div class="col-12">
              <g-input
                v-model="formData.description"
                label="Description (Optional)"
                type="textarea"
                rows="3"
                placeholder="Enter description"
              />
            </div>

            <div class="col-12" v-if="isEdit">
              <q-toggle
                v-model="formData.isActive"
                label="Active"
                color="primary"
              />
            </div>
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" color="grey" @click="close" />
          <q-btn
            unelevated
            :label="isEdit ? 'Update' : 'Save'"
            color="primary"
            type="submit"
            :loading="loading"
          />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script lang="ts">
import { defineComponent, ref, computed, watch } from 'vue';
import { api } from 'src/boot/axios';
import { useQuasar } from 'quasar';
import GInput from 'src/components/shared/form/GInput.vue';
import { AxiosError } from 'axios';
import type { GradeLevelResponse } from '@shared/response';

export default defineComponent({
  name: 'AddEditGradeLevelDialog',
  components: {
    GInput,
  },
  props: {
    modelValue: {
      type: Boolean,
      required: true,
    },
    gradeLevelData: {
      type: Object as () => { data: GradeLevelResponse } | null,
      default: null,
    },
  },
  emits: ['update:modelValue', 'close', 'saveDone'],
  setup(props, { emit }) {
    const $q = useQuasar();
    const form = ref<HTMLFormElement | null>(null);
    const loading = ref(false);
    
    const formData = ref<{
      id?: number;
      code: string;
      name: string;
      educationLevel: string;
      sequence: number | null;
      ageRangeMin: number | null;
      ageRangeMax: number | null;
      description: string;
      isActive: boolean;
    }>({
      code: '',
      name: '',
      educationLevel: '',
      sequence: null,
      ageRangeMin: null,
      ageRangeMax: null,
      description: '',
      isActive: true,
    });

    const educationLevelOptions = [
      { label: 'Nursery', value: 'NURSERY' },
      { label: 'Kindergarten', value: 'KINDERGARTEN' },
      { label: 'Elementary', value: 'ELEMENTARY' },
      { label: 'Junior High', value: 'JUNIOR_HIGH' },
      { label: 'Senior High', value: 'SENIOR_HIGH' },
      { label: 'College', value: 'COLLEGE' },
    ];

    const isEdit = computed(() => !!props.gradeLevelData?.data?.id);

    watch(() => props.modelValue, (val) => {
      if (val) {
        if (props.gradeLevelData?.data) {
          const data = props.gradeLevelData.data;
          formData.value = {
            id: data.id,
            code: data.code,
            name: data.name,
            educationLevel: data.educationLevel,
            sequence: data.sequence,
            ageRangeMin: data.ageRangeMin,
            ageRangeMax: data.ageRangeMax,
            description: data.description || '',
            isActive: data.isActive,
          };
        } else {
          formData.value = {
            code: '',
            name: '',
            educationLevel: '',
            sequence: null,
            ageRangeMin: null,
            ageRangeMax: null,
            description: '',
            isActive: true,
          };
        }
      }
    });

    const close = () => {
      emit('update:modelValue', false);
      emit('close');
    };

    const saveGradeLevel = async () => {
      const valid = await form.value?.validate();
      if (!valid) return;

      loading.value = true;

      try {
        const payload = {
          ...formData.value,
          ageRangeMin: formData.value.ageRangeMin || undefined,
          ageRangeMax: formData.value.ageRangeMax || undefined,
          description: formData.value.description || undefined,
        };

        if (isEdit.value) {
          await api.patch('school/grade-level/update', payload);
          $q.notify({
            type: 'positive',
            message: 'Grade level updated successfully',
          });
        } else {
          const createPayload = {
            code: payload.code,
            name: payload.name,
            educationLevel: payload.educationLevel,
            sequence: payload.sequence,
            ageRangeMin: payload.ageRangeMin,
            ageRangeMax: payload.ageRangeMax,
            description: payload.description,
          };
          await api.post('school/grade-level/create', createPayload);
          $q.notify({
            type: 'positive',
            message: 'Grade level created successfully',
          });
        }

        emit('saveDone');
        close();
      } catch (error) {
        const axiosError = error as AxiosError<{ message: string }>;
        $q.notify({
          type: 'negative',
          message: axiosError.response?.data?.message || 'Failed to save grade level',
        });
      } finally {
        loading.value = false;
      }
    };

    return {
      form,
      formData,
      loading,
      isEdit,
      educationLevelOptions,
      close,
      saveGradeLevel,
    };
  },
});
</script>