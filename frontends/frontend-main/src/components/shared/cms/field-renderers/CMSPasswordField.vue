<template>
  <CMSTextField
    :field="field"
    :value="maskedValue"
    :mode="mode"
    :readonly="readonly"
    :disabled="disabled"
    @update="$emit('update', $event)"
    @validate="$emit('validate', $event)"
  />
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue';
import CMSTextField from './CMSTextField.vue';

export default defineComponent({
  name: 'CMSPasswordField',
  components: { CMSTextField },
  props: ['field', 'value', 'mode', 'readonly', 'disabled'],
  emits: ['update', 'validate'],
  setup(props) {
    const maskedValue = computed(() => props.value ? '••••••••' : '');
    return { maskedValue };
  }
});
</script>
