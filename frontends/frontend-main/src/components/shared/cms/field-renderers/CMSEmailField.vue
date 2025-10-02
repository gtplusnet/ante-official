<template>
  <div class="cms-field cms-email-field">
    <q-input
      v-model="localValue"
      type="email"
      :label="fieldLabel"
      :placeholder="field.placeholder || 'user@example.com'"
      :outlined="!readonly && mode !== 'view'"
      :filled="mode === 'view'"
      :readonly="readonly"
      :disabled="disabled || isLoading"
      :dense="true"
      :rules="validationRules"
      @update:model-value="updateValue"
      @blur="validateField"
    >
      <template v-if="field.required" #label>
        {{ field.displayName || field.name }} <span class="text-red">*</span>
      </template>
      <template v-if="field.hint" #hint>
        {{ field.hint }}
      </template>
      <template #prepend>
        <q-icon name="o_email" size="20px" />
      </template>
    </q-input>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, watch, PropType } from 'vue';
import { Field } from '../types/content-type';
import { getValidationRules } from '../utils/validation-rules';

export default defineComponent({
  name: 'CMSEmailField',
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
    
    const fieldLabel = computed(() => {
      if (props.field.required && !props.readonly) {
        return undefined; // Use template slot instead
      }
      return props.field.displayName || props.field.name;
    });
    
    const validationRules = computed(() => {
      if (props.readonly || props.mode === 'preview' || props.mode === 'view') {
        return [];
      }
      return getValidationRules(props.field);
    });
    
    const updateValue = (value: string | number | null) => {
      localValue.value = String(value || '');
      emit('update', String(value || ''));
    };
    
    const validateField = () => {
      const rules = validationRules.value;
      for (const rule of rules) {
        const result = rule(localValue.value);
        if (result !== true) {
          emit('validate', result);
          return;
        }
      }
      emit('validate', true);
    };
    
    watch(() => props.value, (newVal) => {
      localValue.value = newVal || '';
    });
    
    return {
      localValue,
      isLoading,
      fieldLabel,
      validationRules,
      updateValue,
      validateField
    };
  }
});
</script>

<style lang="scss" scoped>
.cms-email-field {
  // Custom styles if needed
}
</style>