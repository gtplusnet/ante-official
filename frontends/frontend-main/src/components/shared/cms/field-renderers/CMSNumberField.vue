<template>
  <div class="cms-field cms-number-field">
    <q-input
      v-model.number="localValue"
      type="number"
      :label="fieldLabel"
      :placeholder="field.placeholder"
      :outlined="!readonly && mode !== 'view'"
      :filled="mode === 'view'"
      :readonly="readonly"
      :disabled="disabled || isLoading"
      :dense="true"
      :rules="validationRules"
      :min="field.min"
      :max="field.max"
      :step="getStep()"
      @update:model-value="updateValue"
      @blur="validateField"
    >
      <template v-if="field.required" #label>
        {{ field.displayName || field.name }} <span class="text-red">*</span>
      </template>
      <template v-if="getFieldHint()" #hint>
        {{ getFieldHint() }}
      </template>
    </q-input>
    <div v-if="showFieldInfo" class="field-info q-mt-xs">
      <q-chip v-if="field.numberType" size="xs" color="blue-2" text-color="blue-9">
        {{ field.numberType }}
      </q-chip>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, watch, PropType } from 'vue';
import { Field } from '../types/content-type';
import { getValidationRules } from '../utils/validation-rules';

export default defineComponent({
  name: 'CMSNumberField',
  props: {
    field: {
      type: Object as PropType<Field>,
      required: true
    },
    value: {
      type: Number,
      default: null
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
    const localValue = ref<number | null>(props.value);
    const isLoading = ref(false);
    
    const fieldLabel = computed(() => {
      if (props.field.required && !props.readonly) {
        return undefined; // Use template slot instead
      }
      return props.field.displayName || props.field.name;
    });
    
    const showFieldInfo = computed(() => {
      return props.mode === 'preview' && props.field.numberType;
    });
    
    const validationRules = computed(() => {
      if (props.readonly || props.mode === 'preview' || props.mode === 'view') {
        return [];
      }
      return getValidationRules(props.field);
    });
    
    const getStep = () => {
      if (props.field.numberType === 'integer' || props.field.numberType === 'big integer') {
        return 1;
      }
      if (props.field.numberType === 'decimal' || props.field.numberType === 'float') {
        return 0.01;
      }
      return 'any';
    };
    
    const getFieldHint = () => {
      const hints = [];
      if (props.field.hint) hints.push(props.field.hint);
      
      if (props.field.min !== undefined && props.field.max !== undefined) {
        hints.push(`Range: ${props.field.min} - ${props.field.max}`);
      } else if (props.field.min !== undefined) {
        hints.push(`Minimum: ${props.field.min}`);
      } else if (props.field.max !== undefined) {
        hints.push(`Maximum: ${props.field.max}`);
      }
      
      if (props.field.numberType) {
        hints.push(`Format: ${props.field.numberType}`);
      }
      
      return hints.join(' | ');
    };
    
    const updateValue = (value: string | number | null) => {
      const numValue = value === null || value === '' ? null : Number(value);
      localValue.value = numValue;
      emit('update', numValue);
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
      localValue.value = newVal ?? null;
    });
    
    return {
      localValue,
      isLoading,
      fieldLabel,
      showFieldInfo,
      validationRules,
      getStep,
      getFieldHint,
      updateValue,
      validateField
    };
  }
});
</script>

<style lang="scss" scoped>
.cms-number-field {
  .field-info {
    display: flex;
    gap: 4px;
  }
}
</style>