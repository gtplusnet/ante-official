<template>
  <q-dialog v-model="dialogVisible" persistent @hide="onHide">
    <q-card style="width: 700px; max-width: 90vw">
      <q-card-section class="row items-center q-pb-none q-pt-sm">
        <div class="text-h6">{{ isEditMode ? 'Edit Field' : 'Add New Field' }}</div>
        <q-space />
        <q-btn icon="o_close" flat round dense @click="close" />
      </q-card-section>

      <q-card-section>
        <!-- Field Type Selection (only for new fields) -->
        <FieldTypeSelector
          v-if="!isEditMode"
          v-model="localField.type"
          :field-types="allFieldTypes"
          class="q-mb-lg"
        />

        <!-- Field Configuration -->
        <FieldConfiguration
          v-model="localField"
          :available-content-types="availableContentTypes"
          :content-type-id="contentTypeId"
          :auto-save="isEditMode"
        />
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Cancel" @click="close" />
        <q-btn 
          color="primary" 
          :label="isEditMode ? 'Save' : 'Add Field'" 
          @click="handleSave"
          :disable="!isValid"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script lang="ts">
import { defineComponent, ref, computed, watch, PropType } from 'vue';
import { useQuasar } from 'quasar';
import type { Field } from '@components/shared/cms/types/content-type';
import { useFieldManagement } from '../../composables/useFieldManagement';
import FieldTypeSelector from './FieldTypeSelector.vue';
import FieldConfiguration from './FieldConfiguration.vue';

export default defineComponent({
  name: 'AddEditFieldDialog',
  components: {
    FieldTypeSelector,
    FieldConfiguration
  },
  props: {
    modelValue: {
      type: Boolean,
      default: false
    },
    field: {
      type: Object as PropType<Field | null>,
      default: null
    },
    availableContentTypes: {
      type: Array as PropType<string[]>,
      default: () => []
    },
    contentTypeId: {
      type: String,
      required: true
    }
  },
  emits: ['update:modelValue', 'save'],
  setup(props, { emit }) {
    const $q = useQuasar();
    const { allFieldTypes, createField, validateField } = useFieldManagement();
    
    const dialogVisible = computed({
      get: () => props.modelValue,
      set: (value) => emit('update:modelValue', value)
    });

    const isEditMode = computed(() => !!props.field);

    const localField = ref<Field>(createField());

    // Initialize field data when dialog opens
    watch(() => props.modelValue, (newValue) => {
      if (newValue) {
        if (props.field) {
          // Edit mode - copy existing field
          localField.value = { ...props.field };
        } else {
          // Create mode - new field
          localField.value = createField({
            type: 'text',
            size: 'full'
          });
        }
      }
    });

    // Note: Auto-generation is now handled in FieldConfiguration component

    const isValid = computed(() => {
      const errors = validateField(localField.value);
      return errors.length === 0;
    });

    const close = () => {
      dialogVisible.value = false;
    };

    const onHide = () => {
      // Reset field data
      localField.value = createField();
    };

    const handleSave = () => {
      const errors = validateField(localField.value);
      
      if (errors.length > 0) {
        $q.notify({
          type: 'negative',
          message: errors[0],
        });
        return;
      }

      emit('save', { ...localField.value });
      
      $q.notify({
        type: 'positive',
        message: isEditMode.value ? 'Field updated successfully' : 'Field added successfully',
      });
      
      close();
    };

    return {
      dialogVisible,
      isEditMode,
      localField,
      allFieldTypes,
      isValid,
      close,
      onHide,
      handleSave
    };
  },
});
</script>
