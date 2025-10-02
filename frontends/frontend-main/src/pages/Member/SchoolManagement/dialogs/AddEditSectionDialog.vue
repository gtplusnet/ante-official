<template>
  <q-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)" persistent>
    <q-card style="width: 600px; max-width: 90vw">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">{{ isEdit ? 'Edit' : 'Add' }} Section</div>
        <q-space />
        <q-btn icon="close" flat round dense @click="close" />
      </q-card-section>

      <q-form @submit="saveSection" ref="form">
        <q-card-section>
          <div class="row q-col-gutter-md">
            <div class="col-12">
              <g-input
                v-model="formData.name"
                label="Section Name"
                placeholder="e.g., Section A, Diamond, Rose"
                :rules="[(val: any) => !!val || 'Section name is required']"
                required
              />
            </div>

            <div class="col-12">
              <g-input
                v-model="formData.gradeLevelId"
                label="Grade Level"
                type="select"
                apiUrl="school/grade-level/list"
                nullOption="Select Grade Level"
                :rules="[(val: any) => !!val || 'Grade level is required']"
                required
              />
            </div>

            <div class="col-12">
              <g-input
                v-model="formData.adviserName"
                label="Adviser Name"
                placeholder="e.g., Mr. John Doe, Ms. Jane Smith"
                :rules="[(val: any) => !!val || 'Adviser name is required']"
                required
              />
            </div>

            <div class="col-6">
              <g-input
                v-model="formData.schoolYear"
                label="School Year"
                placeholder="e.g., 2024-2025"
                :rules="[
                  (val: any) => !!val || 'School year is required',
                  (val: any) => /^\d{4}-\d{4}$/.test(val) || 'Format must be YYYY-YYYY'
                ]"
                required
              />
            </div>

            <div class="col-6">
              <g-input
                v-model.number="formData.capacity"
                label="Capacity (Optional)"
                type="number"
                placeholder="e.g., 40"
                :rules="[
                  (val: any) => val === null || val === undefined || val > 0 || 'Capacity must be greater than 0',
                  (val: any) => val === null || val === undefined || val <= 100 || 'Capacity must be less than or equal to 100'
                ]"
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

export default defineComponent({
  name: 'AddEditSectionDialog',
  components: {
    GInput,
  },
  props: {
    modelValue: {
      type: Boolean,
      required: true,
    },
    sectionData: {
      type: Object,
      default: null,
    },
  },
  emits: ['update:modelValue', 'close', 'saveDone'],
  setup(props, { emit }) {
    const $q = useQuasar();
    const form = ref<HTMLFormElement | null>(null);
    const loading = ref(false);

    const formData = ref({
      name: '',
      gradeLevelId: '',
      adviserName: '',
      schoolYear: getCurrentSchoolYear(),
      capacity: null as number | null,
      isActive: true,
    });

    const isEdit = computed(() => !!props.sectionData?.id);

    // Get current school year in YYYY-YYYY format
    function getCurrentSchoolYear() {
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth() + 1; // 0-indexed
      
      // If it's before June, we're in the previous school year
      if (currentMonth < 6) {
        return `${currentYear - 1}-${currentYear}`;
      } else {
        return `${currentYear}-${currentYear + 1}`;
      }
    }

    // Watch for changes in sectionData prop
    watch(() => props.sectionData, (newData) => {
      if (newData && newData.id) {
        // Edit mode - populate form with existing data
        formData.value = {
          name: newData.name || '',
          gradeLevelId: newData.gradeLevelId || '',
          adviserName: newData.adviserName || '',
          schoolYear: newData.schoolYear || getCurrentSchoolYear(),
          capacity: newData.capacity || null,
          isActive: newData.isActive !== false,
        };
      } else {
        // Add mode - reset form
        formData.value = {
          name: '',
          gradeLevelId: '',
          adviserName: '',
          schoolYear: getCurrentSchoolYear(),
          capacity: null,
          isActive: true,
        };
      }
    }, { immediate: true });

    const close = () => {
      emit('update:modelValue', false);
      emit('close');
    };

    const saveSection = async () => {
      const isValid = await form.value?.validate();
      if (!isValid) return;

      loading.value = true;
      try {
        const payload = {
          ...formData.value,
          capacity: formData.value.capacity || undefined, // Convert null to undefined for optional field
        };

        if (isEdit.value) {
          await api.put(`school/section/update?id=${props.sectionData.id}`, payload);
          $q.notify({
            type: 'positive',
            message: 'Section updated successfully',
          });
        } else {
          await api.post('school/section/create', payload);
          $q.notify({
            type: 'positive',
            message: 'Section created successfully',
          });
        }
        emit('saveDone');
        close();
      } catch (error) {
        const axiosError = error as AxiosError<any>;
        $q.notify({
          type: 'negative',
          message: axiosError.response?.data?.message || 'Failed to save section',
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
      close,
      saveSection,
    };
  },
});
</script>