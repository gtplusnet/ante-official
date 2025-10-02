<template>
  <div class="global-input-template" :class="containerClasses">
    <!-- Text Input -->
    <input
      v-if="type === 'text'"
      ref="inputRef"
      type="text"
      dense
      outlined
      :value="modelValue"
      :placeholder="showPlaceholder ? placeholder : ''"
      :disabled="disabled"
      :readonly="readonly"
      :required="required"
      :clearable="clearable"
      class="input-field"
      @input="handleInput"
      @focus="handleFocus"
      @blur="handleBlur"
    />

    <!-- Email Input -->
    <input
      v-else-if="type === 'email'"
      ref="inputRef"
      type="email"
      :value="modelValue"
      :placeholder="showPlaceholder ? placeholder : ''"
      :disabled="disabled"
      :readonly="readonly"
      :required="required"
      :clearable="clearable"
      class="input-field"
      @input="handleInput"
      @focus="handleFocus"
      @blur="handleBlur"
    />

    <!-- Password Input -->
    <input
      v-else-if="type === 'password'"
      ref="inputRef"
      :type="showPassword ? 'text' : 'password'"
      :value="modelValue"
      :placeholder="showPlaceholder ? placeholder : ''"
      :disabled="disabled"
      :readonly="readonly"
      :required="required"
      :clearable="clearable"
      class="input-field"
      @input="handleInput"
      @focus="handleFocus"
      @blur="handleBlur"
    />

    <!-- Date Input -->
    <div v-else-if="type === 'date'">
      <q-input
        class="date-input"
        outlined
        dense
        v-model="date"
        mask="####-##-##"
        :placeholder="showDatePlaceholder"
        :disable="disabled"
        :readonly="readonly"
        :required="required"
        :clearable="clearable"
        @input="handleInput"
        @focus="handleFocus"
        @blur="handleBlur"
      >
        <template v-slot:append>
          <q-icon name="event" class="cursor-pointer" :class="{ 'text-grey-5': disabled }">
            <q-popup-proxy v-if="!disabled && !readonly" cover transition-show="scale" transition-hide="scale">
              <q-date v-model="date">
              </q-date>
            </q-popup-proxy>
          </q-icon>
        </template>
      </q-input>
    </div>

    <!-- Time Input -->
    <input
      v-else-if="type === 'time'"
      ref="inputRef"
      type="time"
      :value="modelValue || '00:00'"
      :placeholder="showPlaceholder ? placeholder : ''"
      :disabled="disabled"
      :readonly="readonly"
      :required="required"
      :clearable="clearable"
      class="input-field"
      @input="handleInput"
      @focus="handleFocus"
      @blur="handleBlur"
    />

    <!-- Number Input -->
    <input
      v-else-if="type === 'number'"
      ref="inputRef"
      type="number"
      :value="modelValue"
      :placeholder="showPlaceholder ? placeholder : ''"
      :disabled="disabled"
      :readonly="readonly"
      :required="required"
      :min="min"
      :max="max"
      :clearable="clearable"
      class="input-field"
      @input="handleInput"
      @focus="handleFocus"
      @blur="handleBlur"
    />

    <!-- Textarea -->
    <textarea
      v-else-if="type === 'textarea'"
      ref="inputRef"
      :value="String(modelValue || '')"
      :placeholder="showPlaceholder ? placeholder : ''"
      :disabled="disabled"
      :readonly="readonly"
      :clearable="clearable"
      :required="required"
      :rows="rows"
      class="input-field textarea"
      @input="handleInput"
      @focus="handleFocus"
      @blur="handleBlur"
    ></textarea>

    <!-- Select -->
    <q-select
      v-else-if="type === 'select'"
      ref="inputRef"
      v-model="selectValue"
      :options="formattedOptions"
      :disable="disabled"
      :readonly="readonly"
      :clearable="clearable"
      outlined
      dense
      class="select-field"
      :placeholder="showPlaceholder ? placeholder : ''"
      @update:model-value="handleQSelect"
      @focus="handleFocus"
      @blur="handleBlur"
    />

    <!-- File Input -->
    <div v-else-if="type === 'file'" class="file-input-wrapper">
      <input
        ref="fileInputRef"
        type="file"
        :accept="accept"
        :disabled="disabled"
        :required="required"
        class="file-input-hidden"
        @change="handleFileInput"
        @focus="handleFocus"
        @blur="handleBlur"
      />
      <div class="input-field file-display" @click="triggerFileInput" :class="{ 'has-file': currentFileName }">
        <span class="file-text">
          <a v-if="uploadedFileData && uploadedFileData.url" :href="uploadedFileData.url" target="_blank" @click.stop>
            {{ uploadedFileData.originalName || uploadedFileData.name || currentFileName }}
          </a>
          <span v-else>
            {{ currentFileName || placeholder || "" }}
          </span>
        </span>
      </div>
      <div class="file-actions">
        <q-btn flat @click="triggerFileInput" class="file-button" color="grey" dense outline :disabled="disabled">
          <q-icon size="18px" :name="currentFileName ? 'sync' : 'downloading'"></q-icon>
          <q-tooltip class="text-label-small">{{ currentFileName ? "Change file" : "Upload file" }}</q-tooltip>
        </q-btn>
        <q-btn
          v-if="currentFileName"
          flat
          @click="removeFile"
          class="file-button"
          color="negative"
          dense
          outline
          :disabled="disabled"
        >
          <q-icon size="18px" name="delete"></q-icon>
          <q-tooltip class="text-label-small">Remove file</q-tooltip>
        </q-btn>
      </div>
    </div>

    <!-- Phone Input -->
    <div v-else-if="type === 'phone'" class="phone-input-wrapper">
      <div class="country-code">
        <span class="code">{{ countryCode }}</span>
      </div>
      <input
        ref="inputRef"
        type="tel"
        :value="modelValue"
        :placeholder="showPlaceholder ? placeholder : ''"
        :disabled="disabled"
        :readonly="readonly"
        :required="required"
        :clearable="clearable"
        class="input-field phone-input"
        @input="handleInput"
        @focus="handleFocus"
        @blur="handleBlur"
      />
    </div>

    <!-- Text with Add Button -->
    <div v-else-if="type === 'text-with-add'" class="text-add-wrapper">
      <input
        ref="inputRef"
        type="text"
        :value="modelValue"
        :placeholder="showPlaceholder ? placeholder : ''"
        :disabled="disabled"
        :readonly="readonly"
        :required="required"
        :clearable="clearable"
        class="input-field text-add-input"
        @input="handleInput"
        @focus="handleFocus"
        @blur="handleBlur"
      />
      <q-btn unelevated class="add-button" :disabled="disabled" @click="handleAddClick">
        <q-icon name="add" size="20px" style="color: var(--q-gray-light);" />
      </q-btn>
    </div>

    <!-- Floating Label -->
    <label v-if="label" class="floating-label" :class="labelClasses" @click="focusInput">
      {{ label }}
    </label>

    <!-- Error Message -->
    <div v-if="error && errorMessage" class="error-message">
      {{ errorMessage }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from "vue";
import { api } from "src/boot/axios";
import { useQuasar } from "quasar";

// Props
interface Props {
  type?:
    | "text"
    | "email"
    | "password"
    | "date"
    | "time"
    | "number"
    | "textarea"
    | "select"
    | "file"
    | "phone"
    | "text-with-add";
  modelValue?: string | number | File | null;
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  readonly?: boolean;
  error?: boolean;
  errorMessage?: string;
  icon?: string;
  iconPosition?: "left" | "right";
  countryCode?: string;
  accept?: string;
  options?: Array<{ label: string; value: string | number } | string>;
  min?: number;
  max?: number;
  rows?: number;
  clearable?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  type: "text",
  modelValue: "",
  label: "",
  placeholder: "",
  required: false,
  disabled: false,
  readonly: false,
  error: false,
  errorMessage: "",
  icon: "",
  iconPosition: "right",
  countryCode: "+63",
  accept: "*",
  options: () => [],
  min: undefined,
  max: undefined,
  rows: 3,
  clearable: false,
});

// Emits
type EmitFunction = {
  (e: "update:modelValue", value: string | number | File | null): void;
  (e: "focus", event: Event): void;
  (e: "blur", event: Event): void;
  (e: "add", value: string | number): void;
  (e: "file-selected", file: File): void;
};

const emit = defineEmits<EmitFunction>();

// Refs
const inputRef = ref<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>();
const fileInputRef = ref<HTMLInputElement>();

// State
const isFocused = ref(false);
const showPassword = ref(false);
const currentFileName = ref("");
const uploadedFileData = ref<any>(null);
const date = ref(String(props.modelValue || ""));
const selectIsOpen = ref(false);
const selectValue = ref<any>(null);

// Quasar
const $q = useQuasar();

// Computed
const hasValue = computed(() => {
  if (props.type === "file") {
    return !!currentFileName.value || !!uploadedFileData.value;
  }
  if (props.type === "date") {
    return !!date.value;
  }
  if (props.type === "number") {
    return props.modelValue !== undefined && props.modelValue !== null && String(props.modelValue) !== "";
  }
  return !!(props.modelValue && String(props.modelValue).length > 0);
});

const showPlaceholder = computed(() => {
  return !props.label || (!isFocused.value && !hasValue.value);
});

const showDatePlaceholder = computed(() => {
  if (props.type === "date") {
    return isFocused.value ? "YYYY-MM-DD" : props.placeholder || "";
  }
  return showPlaceholder.value ? props.placeholder : "";
});

const hasTimeValue = computed(() => {
  if (props.type === "time") {
    return !!(props.modelValue && String(props.modelValue).length > 0);
  }
  return false;
});

const containerClasses = computed(() => ({
  [`input-${props.type}`]: true,
  "is-focused": isFocused.value,
  "has-value": hasValue.value,
  "has-time-value": hasTimeValue.value,
  "is-disabled": props.disabled,
  "is-readonly": props.readonly,
  "has-error": props.error,
  "has-icon": showIcon.value,
  [`icon-${props.iconPosition}`]: showIcon.value,
  "select-open": selectIsOpen.value,
}));

const labelClasses = computed(() => ({
  "floating-label-phone": props.type === "phone",
  "is-floating": isFocused.value || hasValue.value,
  "is-focused": isFocused.value,
  "has-error": props.error,
}));

const showIcon = computed(() => {
  return ["password", "date", "time", "number", "select", "file"].includes(props.type) || props.icon;
});

const formattedOptions = computed(() => {
  return props.options.map((option) => {
    if (typeof option === "string") {
      return { label: option, value: option };
    }
    return option;
  });
});

// Methods
const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement | HTMLTextAreaElement;
  let value: string | number = target.value;

  // Handle phone type - remove leading zeros since we have +63
  if (props.type === "phone" && typeof value === "string") {
    // Remove all leading zeros
    value = value.replace(/^0+/, '');
  } else if (props.type === "number") {
    value = Number(target.value);
  }

  emit("update:modelValue", value);
};

const handleQSelect = (value: any) => {
  emit("update:modelValue", value?.value ?? value);
};

const handleFileInput = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) {
    currentFileName.value = file.name;
    
    // Upload the file to server
    const formData = new FormData();
    formData.append('fileData', file);
    
    $q.loading.show({
      message: 'Uploading file...'
    });
    
    try {
      const response = await api.post('/file-upload/upload-document', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      // Store the uploaded file data
      uploadedFileData.value = response.data;
      currentFileName.value = response.data.originalName || response.data.name || file.name;
      
      // Emit the server response instead of the raw file
      emit("update:modelValue", response.data);
      emit("file-selected", response.data);
    } catch (error) {
      console.error('File upload failed:', error);
      $q.notify({
        type: 'negative',
        message: 'Failed to upload file'
      });
      // Reset on error
      currentFileName.value = "";
      uploadedFileData.value = null;
      emit("update:modelValue", null);
    } finally {
      $q.loading.hide();
      isFocused.value = false;
    }
  } else {
    // Handle case when user cancels file selection
    currentFileName.value = "";
    uploadedFileData.value = null;
    emit("update:modelValue", null);
    isFocused.value = false;
  }
};

const handleFocus = (event: Event) => {
  isFocused.value = true;
  if (props.type === "select") {
    selectIsOpen.value = true;
  }
  emit("focus", event);
};

const handleBlur = (event: Event) => {
  isFocused.value = false;
  if (props.type === "select") {
    selectIsOpen.value = false;
  }
  emit("blur", event);
};

const handleAddClick = () => {
  const value = typeof props.modelValue === "string" || typeof props.modelValue === "number" ? props.modelValue : "";
  emit("add", value);
};

const focusInput = () => {
  if (!props.disabled && !props.readonly) {
    if (props.type === "file") {
      triggerFileInput();
    } else {
      nextTick(() => {
        inputRef.value?.focus();
      });
    }
  }
};

const triggerFileInput = () => {
  if (!props.disabled) {
    isFocused.value = true;
    fileInputRef.value?.click();
    // Set blur after a short delay to allow file dialog to open
    setTimeout(() => {
      if (!currentFileName.value) {
        isFocused.value = false;
      }
    }, 100);
  }
};

const removeFile = () => {
  currentFileName.value = "";
  uploadedFileData.value = null;
  emit("update:modelValue", null);
  emit("file-selected", null as any);
  // Reset the file input
  if (fileInputRef.value) {
    fileInputRef.value.value = "";
  }
  isFocused.value = false; // Ensure label drops when file is removed
};

// Watch for external value changes
watch(
  () => props.modelValue,
  (newValue) => {
    if (props.type === "file") {
      if (!newValue) {
        currentFileName.value = "";
        uploadedFileData.value = null;
      } else if (newValue instanceof File) {
        // This shouldn't happen anymore, but keep for backward compatibility
        currentFileName.value = newValue.name;
      } else if (typeof newValue === 'object' && newValue !== null) {
        // Handle uploaded file data object
        uploadedFileData.value = newValue;
        currentFileName.value = newValue.originalName || newValue.name || "File";
      }
    } else if (props.type === "date") {
      date.value = String(newValue || "");
    } else if (props.type === "select") {
      // Find the matching option for the current value
      const matchingOption = formattedOptions.value.find((opt) => opt.value === newValue);
      selectValue.value = matchingOption || null;
    }
  },
  { immediate: true }
);

// Watch date changes and emit to parent
watch(date, (newDate) => {
  if (props.type === "date") {
    emit("update:modelValue", newDate);
  }
});
</script>

<style scoped src="./GlobalInputTemplate.scss"></style>
<style scoped>
.file-text a {
  color: #1976d2;
  text-decoration: none;
}

.file-text a:hover {
  text-decoration: underline;
}
</style>
