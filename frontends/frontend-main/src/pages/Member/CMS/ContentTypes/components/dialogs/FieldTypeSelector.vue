<template>
  <div class="field-type-selection">
    <div class="text-subtitle2 q-mb-md">Select field type</div>
    <div class="field-types-grid">
      <div
        v-for="fieldType in fieldTypes"
        :key="fieldType.type"
        class="field-type-option"
        :class="{ selected: modelValue === fieldType.type }"
        @click="selectType(fieldType.type)"
      >
        <q-icon :name="fieldType.icon" :color="fieldType.color" size="24px" />
        <div class="field-type-name">{{ fieldType.name }}</div>
        <div class="field-type-desc">{{ fieldType.description }}</div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import type { FieldTypeDefinition } from '../../composables/useFieldManagement';

export default defineComponent({
  name: 'FieldTypeSelector',
  props: {
    modelValue: {
      type: String,
      default: 'text'
    },
    fieldTypes: {
      type: Array as PropType<FieldTypeDefinition[]>,
      required: true
    }
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const selectType = (type: string) => {
      emit('update:modelValue', type);
    };

    return {
      selectType
    };
  },
});
</script>

<style scoped lang="scss">
.field-type-selection {
  .field-types-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 12px;

    .field-type-option {
      padding: 12px;
      border: 2px solid #e0e0e0;
      border-radius: 12px;
      cursor: pointer;
      text-align: center;
      transition: all 0.2s;
      background: white;

      &:hover {
        background: #f5f5f5;
        border-color: #bdbdbd;
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
      }

      &.selected {
        background: #e3f2fd;
        border-color: #1976d2;
        box-shadow: 0 2px 4px rgba(25, 118, 210, 0.2);
      }

      .field-type-name {
        font-weight: 500;
        font-size: 13px;
        margin-top: 8px;
        color: #212121;
      }

      .field-type-desc {
        font-size: 11px;
        color: #757575;
        margin-top: 4px;
        line-height: 1.3;
      }
    }
  }
}
</style>