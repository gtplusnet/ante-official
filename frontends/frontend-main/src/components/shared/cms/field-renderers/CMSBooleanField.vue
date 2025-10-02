<template>
  <div class="cms-field cms-boolean-field">
    <q-toggle
      v-model="localValue"
      :label="field.displayName || field.name"
      :disable="readonly || disabled || isLoading"
      :color="mode === 'preview' ? 'grey' : 'primary'"
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
  name: 'CMSBooleanField',
  props: {
    field: {
      type: Object as PropType<Field>,
      required: true
    },
    value: {
      type: Boolean,
      default: false
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
    const localValue = ref(props.value || false);
    const isLoading = ref(false);
    
    const updateValue = (value: boolean) => {
      localValue.value = value;
      emit('update', value);
      emit('validate', true); // Boolean fields are always valid
    };
    
    watch(() => props.value, (newVal) => {
      localValue.value = newVal || false;
    });
    
    return {
      localValue,
      isLoading,
      updateValue
    };
  }
});
</script>

<style lang="scss" scoped>
.cms-boolean-field {
  .field-hint {
    padding-left: 40px;
  }
}
</style>