<template>
  <div class="cms-dynamic-form-preview">
    <!-- Simple preview component -->
    <div v-if="contentType" class="preview-content">
      <div class="preview-header q-mb-md">
        <div class="text-subtitle1 text-weight-medium">
          Form Preview for {{ contentType.displayName || contentType.name }}
        </div>
        <q-separator class="q-mt-sm" />
      </div>
      
      <div class="preview-fields">
        <div 
          v-for="field in contentType.fields" 
          :key="field.id"
          class="preview-field q-mb-md"
        >
          <div class="field-label text-caption text-grey-7 q-mb-xs">
            {{ field.displayName || field.name }}
            <span v-if="field.required" class="text-red">*</span>
          </div>
          <q-input
            v-if="field.type === 'text' || field.type === 'email' || field.type === 'uid'"
            :model-value="''"
            outlined
            dense
            readonly
            :placeholder="`Enter ${field.displayName || field.name}`"
            class="q-mb-sm"
          />
          <q-input
            v-else-if="field.type === 'number'"
            :model-value="0"
            type="number"
            outlined
            dense
            readonly
            :placeholder="`Enter ${field.displayName || field.name}`"
            class="q-mb-sm"
          />
          <q-toggle
            v-else-if="field.type === 'boolean'"
            :model-value="false"
            :label="field.displayName || field.name"
            disable
            class="q-mb-sm"
          />
          <q-select
            v-else-if="field.type === 'enumeration'"
            :model-value="null"
            outlined
            dense
            readonly
            :options="[]"
            :placeholder="`Select ${field.displayName || field.name}`"
            class="q-mb-sm"
          />
          <q-input
            v-else-if="field.type === 'richtext'"
            :model-value="''"
            type="textarea"
            outlined
            dense
            readonly
            rows="4"
            :placeholder="`Enter ${field.displayName || field.name}`"
            class="q-mb-sm"
          />
          <q-input
            v-else-if="field.type === 'datetime'"
            :model-value="''"
            outlined
            dense
            readonly
            :placeholder="`Select ${field.type}`"
            class="q-mb-sm"
          >
            <template v-slot:append>
              <q-icon name="o_event" class="cursor-pointer" />
            </template>
          </q-input>
          <div v-else class="field-placeholder">
            <q-input
              :model-value="''"
              outlined
              dense
              readonly
              :placeholder="`${field.type} field`"
              class="q-mb-sm"
            />
          </div>
        </div>
      </div>
      
      <div v-if="!contentType.fields || contentType.fields.length === 0" class="text-center q-pa-xl text-grey-6">
        <q-icon name="o_dashboard_customize" size="48px" class="q-mb-md" />
        <div>No fields defined yet</div>
        <div class="text-caption">Add fields to see the form preview</div>
      </div>
    </div>
    
    <div v-else class="text-center q-pa-xl text-grey-6">
      <q-icon name="o_visibility_off" size="48px" class="q-mb-md" />
      <div>No content type selected</div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import type { ContentType } from './types/content-type';

export default defineComponent({
  name: 'CMSDynamicFormSimple',
  props: {
    contentType: {
      type: Object as PropType<ContentType | null>,
      default: null
    },
    formData: {
      type: Object,
      default: () => ({})
    },
    mode: {
      type: String,
      default: 'preview'
    },
    readonly: {
      type: Boolean,
      default: true
    },
    showHeader: {
      type: Boolean,
      default: true
    },
    showActions: {
      type: Boolean,
      default: false
    },
    contentTypes: {
      type: Array as PropType<ContentType[]>,
      default: () => []
    },
    components: {
      type: Array as PropType<ContentType[]>,
      default: () => []
    }
  }
});
</script>

<style scoped lang="scss">
.cms-dynamic-form-preview {
  .preview-content {
    padding: 16px;
  }
  
  .preview-fields {
    max-width: 800px;
  }
  
  .field-label {
    font-weight: 500;
    margin-bottom: 4px;
  }
  
  .q-field--readonly {
    .q-field__control {
      background: #f8f9fa;
    }
  }
}
</style>