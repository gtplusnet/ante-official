<template>
  <CMSRichTextField
    :field="{ ...field, placeholder: 'Enter JSON data' }"
    :value="value"
    :mode="mode"
    :readonly="readonly"
    :disabled="disabled"
    @update="$emit('update', $event)"
    @validate="$emit('validate', $event)"
  />
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import CMSRichTextField from './CMSRichTextField.vue';

export default defineComponent({
  name: 'CMSJsonField',
  components: { CMSRichTextField },
  props: ['field', 'value', 'mode', 'readonly', 'disabled'],
  emits: ['update', 'validate']
});
</script>
