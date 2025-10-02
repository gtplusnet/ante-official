<template>
  <div class="cms-field cms-enumeration-field">
    <q-select
      v-model="localValue"
      :options="options"
      :label="field.displayName || field.name"
      :outlined="!readonly && mode !== 'view'"
      :filled="mode === 'view'"
      :readonly="readonly"
      :disable="disabled"
      :dense="true"
      @update:model-value="$emit('update', $event)"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from 'vue';

export default defineComponent({
  name: 'CMSEnumerationField',
  props: ['field', 'value', 'mode', 'readonly', 'disabled'],
  emits: ['update', 'validate'],
  setup(props) {
    const localValue = ref(props.value);
    const options = computed(() => {
      if (!props.field.enumValues) return ['Option 1', 'Option 2', 'Option 3'];
      if (typeof props.field.enumValues === 'string') {
        return props.field.enumValues.split('\n').filter((v: string) => v.trim());
      }
      return props.field.enumValues;
    });
    return { localValue, options };
  }
});
</script>
