<template>
  <div class="boolean-field">
    <q-toggle
      :model-value="modelValue"
      @update:model-value="updateValue"
      :label="field.displayName || field.name"
      :disable="field.disabled || field.readonly"
      color="primary"
      size="md"
    />
    
    <div v-if="field.hint" class="field-hint text-caption text-grey-6 q-mt-xs">
      {{ field.hint }}
    </div>
    
    <div v-if="error" class="field-error text-negative text-caption q-mt-xs">
      {{ error }}
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import type { Field } from '@components/shared/cms/types/content-type';

export default defineComponent({
  name: 'BooleanField',
  props: {
    modelValue: {
      type: Boolean,
      default: false
    },
    field: {
      type: Object as PropType<Field>,
      required: true
    },
    error: {
      type: String,
      default: ''
    }
  },
  emits: ['update:modelValue', 'validate'],
  setup(props, { emit }) {
    const updateValue = (value: boolean) => {
      emit('update:modelValue', value);
      
      // Boolean fields are always valid
      emit('validate', true);
    };
    
    return {
      updateValue
    };
  }
});
</script>

<style scoped lang="scss">
.boolean-field {
  .field-hint {
    margin-left: 4px;
  }
  
  .field-error {
    margin-left: 4px;
  }
}
</style>