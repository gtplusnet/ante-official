<template>
  <div class="editable-span" @click="startEditing">
    <span v-if="!isEditing" class="editable-content" :class="{ editable: !disabled }">
      <slot :value="modelValue">
        {{ displayValue }}
      </slot>
    </span>
    <input v-else ref="input" v-model="localValue" @blur="save" @keyup.enter="save" @keyup.esc="cancel" type="number" class="editable-input" />
  </div>
</template>

<style lang="scss" scoped>
.editable-span {
  height: 20px;
  .editable-content {
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.2s;

    &.editable:hover {
      background-color: #f0f0f0;
    }
  }

  .editable-input {
    width: 80px;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 12px;

    &:focus {
      outline: none;
      border-color: #4a90e2;
      box-shadow: 0 0 0 2px rgba(74, 144, 226, 0.2);
    }
  }
}
</style>

<script lang="ts">
import { defineComponent, ref, nextTick, computed } from 'vue';

export default defineComponent({
  name: 'EditableSpan',

  props: {
    modelValue: {
      type: [String, Number],
      default: '',
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    formatter: {
      type: Function as unknown as () => (val: string | number) => string,
      default: (val: string | number) => String(val),
    },
    parser: {
      type: Function as unknown as () => (val: string) => string,
      default: (val: string) => val,
    },
  },

  emits: ['update:modelValue', 'save'],

  setup(props) {
    const isEditing = ref(false);
    const input = ref<HTMLInputElement | null>(null);
    const localValue = ref('');
    const previousValue = ref('');

    const displayValue = computed(() => {
      return props.formatter(props.modelValue);
    });

    const startEditing = async () => {
      if (props.disabled) return;

      isEditing.value = true;
      previousValue.value = String(props.modelValue);
      localValue.value = props.parser(previousValue.value);

      await nextTick();
      input.value?.focus();
    };

    const save = () => {
      isEditing.value = false;
    };

    const cancel = () => {
      isEditing.value = false;
      localValue.value = previousValue.value;
    };

    return {
      isEditing,
      input,
      localValue,
      displayValue,
      startEditing,
      save,
      cancel,
    };
  },
});
</script>
