<template>
  <div class="cms-field cms-relation-field">
    <q-select
      v-model="localValue"
      :options="options"
      :label="fieldLabel"
      :multiple="isMultiple"
      :use-chips="isMultiple"
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
  name: 'CMSRelationField',
  props: ['field', 'value', 'mode', 'readonly', 'disabled'],
  emits: ['update', 'validate'],
  setup(props) {
    const localValue = ref(props.value);
    const fieldLabel = computed(() => {
      const label = props.field.displayName || props.field.name;
      const relation = props.field.relationType || '';
      return `${label} (${relation})`;
    });
    const isMultiple = computed(() => {
      const multipleTypes = ['oneToMany', 'manyToMany', 'manyWay'];
      return multipleTypes.includes(props.field.relationType);
    });
    const options = computed(() => {
      const target = props.field.targetContentType || 'Item';
      return [`${target} 1`, `${target} 2`, `${target} 3`];
    });
    return { localValue, fieldLabel, isMultiple, options };
  }
});
</script>
