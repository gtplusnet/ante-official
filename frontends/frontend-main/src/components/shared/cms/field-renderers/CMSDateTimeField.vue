<template>
  <CMSTextField
    :field="{ ...field, placeholder: 'Select date and time' }"
    :value="formattedDate"
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
  name: 'CMSDateTimeField',
  components: { CMSTextField },
  props: ['field', 'value', 'mode', 'readonly', 'disabled'],
  emits: ['update', 'validate'],
  setup(props) {
    const formattedDate = computed(() => {
      if (!props.value) return '';
      return new Date(props.value).toLocaleString();
    });
    return { formattedDate };
  }
});
</script>
