<template>
  <div class="cms-field cms-richtext-field">
    <label v-if="field.displayName || field.name" class="field-label">
      {{ field.displayName || field.name }}
      <span v-if="field.required" class="text-red">*</span>
    </label>
    <q-editor
      v-model="localValue"
      :readonly="readonly"
      :disable="disabled || isLoading"
      :toolbar="readonly || mode === 'preview' ? [] : toolbar"
      :placeholder="field.placeholder || 'Enter rich text content...'"
      min-height="200px"
      class="q-mt-sm"
      @update:model-value="updateValue"
    />
    <div v-if="field.hint" class="field-hint text-caption text-grey-6 q-mt-xs">
      {{ field.hint }}
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, watch, PropType } from 'vue';
import { Field } from '../types/content-type';

export default defineComponent({
  name: 'CMSRichTextField',
  props: {
    field: {
      type: Object as PropType<Field>,
      required: true
    },
    value: {
      type: String,
      default: ''
    },
    mode: {
      type: String as PropType<'preview' | 'create' | 'edit' | 'view'>,
      default: 'create'
    },
    readonly: {
      type: Boolean,
      default: false
    },
    disabled: {
      type: Boolean,
      default: false
    }
  },
  emits: ['update', 'validate'],
  setup(props, { emit }) {
    const localValue = ref(props.value || '');
    const isLoading = ref(false);
    
    const toolbar = [
      ['bold', 'italic', 'underline', 'strike'],
      ['quote', 'unordered', 'ordered'],
      ['undo', 'redo'],
      ['viewsource'],
      ['fullscreen']
    ];
    
    const updateValue = (value: string) => {
      localValue.value = value;
      emit('update', value);
      
      // Validate
      if (props.field.required && !value) {
        emit('validate', `${props.field.displayName || props.field.name} is required`);
      } else {
        emit('validate', true);
      }
    };
    
    watch(() => props.value, (newVal) => {
      localValue.value = newVal || '';
    });
    
    return {
      localValue,
      isLoading,
      toolbar,
      updateValue
    };
  }
});
</script>

<style lang="scss" scoped>
.cms-richtext-field {
  .field-label {
    display: block;
    font-size: 14px;
    font-weight: 500;
    color: #1a1a1a;
    margin-bottom: 4px;
  }
  
  :deep(.q-editor) {
    border: 1px solid rgba(0, 0, 0, 0.24);
    border-radius: 4px;
    
    &.readonly {
      background: #f5f5f5;
    }
  }
}
</style>