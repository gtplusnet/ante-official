<template>
  <div class="sidebar-search">
    <q-input
      v-model="searchValue"
      placeholder="Search content types"
      filled
      dense
      class="search-input md3-search"
    >
      <template v-slot:prepend>
        <q-icon name="o_search" size="20px" />
      </template>
      <template v-slot:append v-if="searchValue">
        <q-icon name="o_close" @click="clearSearch" class="cursor-pointer" size="20px" />
      </template>
    </q-input>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue';

export default defineComponent({
  name: 'ContentTypeSearch',
  props: {
    modelValue: {
      type: String,
      default: ''
    }
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const searchValue = computed({
      get: () => props.modelValue,
      set: (value) => emit('update:modelValue', value)
    });

    const clearSearch = () => {
      searchValue.value = '';
    };

    return {
      searchValue,
      clearSearch
    };
  },
});
</script>

<style scoped lang="scss">
.sidebar-search {
  padding: 12px;
  border-bottom: 1px solid #e0e0e0;

  .search-input.md3-search {
    :deep(.q-field__control) {
      background: #f0f4f8;
      border-radius: 28px;
      height: 40px;
      padding: 0 12px;
      
      &:before {
        border: none;
      }
      
      &:after {
        height: 1px;
        background: transparent;
      }
      
      input {
        color: #1a1a1a;
        font-size: 14px;
        
        &::placeholder {
          color: #5f6368;
        }
      }
    }
    
    :deep(.q-field--filled.q-field--focused .q-field__control) {
      background: #e8f0fe;
      
      &:after {
        height: 2px;
        background: #1976d2;
      }
    }

    :deep(.q-field__prepend) {
      color: #5f6368;
      padding-right: 8px;
    }
    
    :deep(.q-field__append) {
      color: #5f6368;
      padding-left: 8px;
    }
  }
}</style>
