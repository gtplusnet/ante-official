<template>
  <div class="cms-field cms-uid-field">
    <q-input
      v-model="localValue"
      :label="fieldLabel"
      :placeholder="field.placeholder || 'unique-identifier'"
      :outlined="!readonly && mode !== 'view'"
      :filled="mode === 'view'"
      :readonly="readonly || autoGenerate"
      :disabled="disabled || isLoading"
      :dense="true"
      :rules="validationRules"
      @update:model-value="updateValue"
      @blur="validateField"
    >
      <template v-if="field.required" #label>
        {{ field.displayName || field.name }} <span class="text-red">*</span>
      </template>
      <template #hint>
        {{ field.hint || 'Auto-generated from title or name field' }}
      </template>
      <template #prepend>
        <q-icon name="o_fingerprint" size="20px" />
      </template>
      <template v-if="!readonly" #append>
        <q-btn
          flat
          dense
          round
          :icon="autoGenerate ? 'o_lock' : 'o_lock_open'"
          size="sm"
          @click="toggleAutoGenerate"
        >
          <q-tooltip>{{ autoGenerate ? 'Auto-generating' : 'Manual input' }}</q-tooltip>
        </q-btn>
      </template>
    </q-input>
    <div v-if="field.unique" class="field-info q-mt-xs">
      <q-chip size="xs" color="purple-2" text-color="purple-9">Unique</q-chip>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, watch, PropType } from 'vue';
import { Field } from '../types/content-type';
import { getValidationRules } from '../utils/validation-rules';

export default defineComponent({
  name: 'CMSUidField',
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
    const autoGenerate = ref(true);
    
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
      // Convert to slug format
      const stringValue = String(value || '');
      const slug = stringValue
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_]+/g, '-')
        .replace(/^-+|-+$/g, '');
      
      localValue.value = slug;
      emit('update', slug);
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
    
    const toggleAutoGenerate = () => {
      autoGenerate.value = !autoGenerate.value;
    };
    
    watch(() => props.value, (newVal) => {
      localValue.value = newVal || '';
    });
    
    return {
      localValue,
      isLoading,
      autoGenerate,
      fieldLabel,
      validationRules,
      updateValue,
      validateField,
      toggleAutoGenerate
    };
  }
});
</script>

<style lang="scss" scoped>
.cms-uid-field {
  .field-info {
    display: flex;
    gap: 4px;
  }
}
</style>