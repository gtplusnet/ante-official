#!/bin/bash

# Create remaining field renderer components with placeholder implementations

# CMSPasswordField.vue
cat << 'FIELD_EOF' > CMSPasswordField.vue
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
FIELD_EOF

# CMSDateTimeField.vue
cat << 'FIELD_EOF' > CMSDateTimeField.vue
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
FIELD_EOF

# CMSJsonField.vue
cat << 'FIELD_EOF' > CMSJsonField.vue
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
FIELD_EOF

# CMSEnumerationField.vue
cat << 'FIELD_EOF' > CMSEnumerationField.vue
<template>
  <div class="cms-field cms-enumeration-field">
    <q-select
      v-model="localValue"
      :options="options"
      :label="field.displayName || field.name"
      :outlined="!readonly && mode !== 'view'"
      :filled="mode === 'view'"
      :readonly="readonly"
      :disable="disabled"
      :dense="true"
      @update:model-value="$emit('update', $event)"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from 'vue';

export default defineComponent({
  name: 'CMSEnumerationField',
  props: ['field', 'value', 'mode', 'readonly', 'disabled'],
  emits: ['update', 'validate'],
  setup(props) {
    const localValue = ref(props.value);
    const options = computed(() => {
      if (!props.field.enumValues) return ['Option 1', 'Option 2', 'Option 3'];
      if (typeof props.field.enumValues === 'string') {
        return props.field.enumValues.split('\n').filter(v => v.trim());
      }
      return props.field.enumValues;
    });
    return { localValue, options };
  }
});
</script>
FIELD_EOF

# CMSRelationField.vue
cat << 'FIELD_EOF' > CMSRelationField.vue
<template>
  <div class="cms-field cms-relation-field">
    <q-select
      v-model="localValue"
      :options="options"
      :label="fieldLabel"
      :multiple="isMultiple"
      :use-chips="isMultiple"
      :outlined="!readonly && mode !== 'view'"
      :filled="mode === 'view'"
      :readonly="readonly"
      :disable="disabled"
      :dense="true"
      @update:model-value="$emit('update', $event)"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from 'vue';

export default defineComponent({
  name: 'CMSRelationField',
  props: ['field', 'value', 'mode', 'readonly', 'disabled'],
  emits: ['update', 'validate'],
  setup(props) {
    const localValue = ref(props.value);
    const fieldLabel = computed(() => {
      const label = props.field.displayName || props.field.name;
      const relation = props.field.relationType || '';
      return `${label} (${relation})`;
    });
    const isMultiple = computed(() => {
      const multipleTypes = ['oneToMany', 'manyToMany', 'manyWay'];
      return multipleTypes.includes(props.field.relationType);
    });
    const options = computed(() => {
      const target = props.field.targetContentType || 'Item';
      return [`${target} 1`, `${target} 2`, `${target} 3`];
    });
    return { localValue, fieldLabel, isMultiple, options };
  }
});
</script>
FIELD_EOF

# CMSMediaField.vue
cat << 'FIELD_EOF' > CMSMediaField.vue
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
FIELD_EOF

# CMSComponentField.vue
cat << 'FIELD_EOF' > CMSComponentField.vue
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
FIELD_EOF

# CMSDynamicZoneField.vue
cat << 'FIELD_EOF' > CMSDynamicZoneField.vue
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
FIELD_EOF

echo "Field renderer components created successfully!"
