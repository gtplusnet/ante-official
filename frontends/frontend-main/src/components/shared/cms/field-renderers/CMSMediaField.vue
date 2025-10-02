<template>
  <div class="cms-field cms-media-field">
    <label class="field-label">
      {{ field.displayName || field.name }}
      <span v-if="field.required" class="text-red">*</span>
    </label>
    <div class="media-upload-area">
      <q-icon name="o_cloud_upload" size="48px" color="grey-5" />
      <div class="text-body2 text-grey-7 q-mt-sm">Click to upload or drag and drop</div>
      <div class="text-caption text-grey-6">PNG, JPG, GIF up to 10MB</div>
      <q-btn
        outline
        label="Select from library"
        icon="o_photo_library"
        color="primary"
        size="sm"
        :disable="readonly || disabled"
        class="q-mt-md"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'CMSMediaField',
  props: ['field', 'value', 'mode', 'readonly', 'disabled'],
  emits: ['update', 'validate']
});
</script>

<style scoped>
.cms-media-field {
  .field-label {
    display: block;
    font-size: 14px;
    font-weight: 500;
    color: #1a1a1a;
    margin-bottom: 8px;
  }
  .media-upload-area {
    border: 2px dashed #e0e0e0;
    border-radius: 8px;
    padding: 32px;
    text-align: center;
    background: #fafafa;
  }
}
</style>
