<template>
  <div class="cms-field cms-dynamiczone-field">
    <label class="field-label">
      {{ field.displayName || field.name }}
      <span v-if="field.required" class="text-red">*</span>
    </label>
    <div class="dynamiczone-area">
      <q-card flat bordered class="q-mb-sm">
        <q-card-section class="q-pa-sm bg-blue-1">
          <div class="row items-center">
            <q-icon name="o_drag_indicator" size="20px" color="grey-6" class="q-mr-xs" />
            <q-icon name="o_dashboard_customize" size="20px" color="blue" class="q-mr-xs" />
            <span class="text-body2">Sample Component Block</span>
          </div>
        </q-card-section>
        <q-card-section class="q-pa-md">
          <div class="text-caption text-grey-6">Dynamic component content</div>
        </q-card-section>
      </q-card>
      <q-btn
        outline
        label="Add component to zone"
        icon="o_add_circle"
        color="primary"
        size="sm"
        :disable="readonly || disabled"
        class="full-width"
        style="border-style: dashed"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'CMSDynamicZoneField',
  props: ['field', 'value', 'mode', 'readonly', 'disabled'],
  emits: ['update', 'validate']
});
</script>

<style scoped>
.cms-dynamiczone-field {
  .field-label {
    display: block;
    font-size: 14px;
    font-weight: 500;
    color: #1a1a1a;
    margin-bottom: 8px;
  }
  .dynamiczone-area {
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    padding: 12px;
    background: #fafafa;
  }
}
</style>
