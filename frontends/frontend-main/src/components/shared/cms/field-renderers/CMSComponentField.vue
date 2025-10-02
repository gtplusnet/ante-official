<template>
  <div class="cms-field cms-component-field">
    <q-card flat bordered>
      <q-card-section class="q-pa-sm bg-grey-1">
        <div class="row items-center">
          <q-icon name="o_widgets" size="20px" color="purple" class="q-mr-xs" />
          <span class="text-body2 text-weight-medium">
            {{ field.displayName || field.name }}
            <span v-if="field.required" class="text-negative">*</span>
          </span>
        </div>
      </q-card-section>
      <q-card-section class="q-pa-md">
        <div class="text-caption text-grey-6">
          Component fields would appear here
        </div>
      </q-card-section>
    </q-card>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'CMSComponentField',
  props: ['field', 'value', 'mode', 'readonly', 'disabled'],
  emits: ['update', 'validate']
});
</script>
