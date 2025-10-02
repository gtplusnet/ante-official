<template>
  <q-dialog v-model="dialogVisible" persistent @hide="onHide">
    <q-card style="min-width: 500px">
      <q-card-section class="row items-center q-pb-none q-pt-sm">
        <div class="text-h6">
          Create New {{ typeLabel }}
        </div>
        <q-space />
        <q-btn icon="o_close" flat round dense @click="close" />
      </q-card-section>

      <q-card-section>
        <q-stepper
          v-model="currentStep"
          vertical
          color="primary"
          animated
          flat
        >
          <q-step
            :name="1"
            title="Basic information"
            icon="o_info"
            :done="currentStep > 1"
          >
            <q-input
              v-model="formData.displayName"
              label="Display Name"
              outlined
              dense
              class="q-mb-sm"
              hint="Name that will be displayed in the admin panel"
              :rules="[
                val => validateDisplayName(val)
              ]"
            />
            <q-input
              v-model="formData.singularName"
              label="API ID (Singular)"
              outlined
              dense
              readonly
              class="q-mb-sm bg-grey-1"
              hint="Auto-generated from display name"
              :rules="[
                val => validateApiId(val)
              ]"
            >
              <template v-slot:prepend>
                <q-icon name="o_auto_fix_high" color="primary" size="18px" />
              </template>
            </q-input>
            <q-input
              v-if="contentType === 'collection'"
              v-model="formData.pluralName"
              label="API ID (Plural)"
              outlined
              dense
              readonly
              class="q-mb-sm bg-grey-1"
              hint="Auto-generated plural form"
              :rules="[
                val => validateApiId(val)
              ]"
            >
              <template v-slot:prepend>
                <q-icon name="o_auto_fix_high" color="primary" size="18px" />
              </template>
            </q-input>
            <q-input
              v-if="contentType === 'component'"
              v-model="formData.category"
              label="Category"
              outlined
              dense
              hint="Category to organize your component"
            />
            <q-stepper-navigation>
              <q-btn @click="validateAndContinue" color="primary" label="Continue" />
            </q-stepper-navigation>
          </q-step>

          <q-step
            :name="2"
            title="Advanced Settings"
            icon="o_settings"
            :done="currentStep > 2"
          >
            <div class="q-gutter-sm">
              <q-toggle
                v-model="formData.draftPublish"
                label="Enable Draft & Publish"
                left-label
              />
              <q-toggle
                v-model="formData.internationalization"
                label="Enable Internationalization"
                left-label
              />
            </div>
            <q-stepper-navigation>
              <q-btn @click="handleCreate" color="primary" label="Create" :loading="isCreating" />
              <q-btn flat @click="currentStep = 1" label="Back" class="q-ml-sm" />
            </q-stepper-navigation>
          </q-step>
        </q-stepper>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script lang="ts">
import { defineComponent, ref, computed, watch, PropType } from 'vue';
import { useQuasar } from 'quasar';
// String utility functions moved inline to avoid import issues
const toCamelCase = (displayName: string): string => {
  if (!displayName) return '';
  
  return displayName
    .trim()
    .replace(/[^\w\s]/g, '') // Remove special characters except word chars and spaces
    .replace(/\s+/g, ' ') // Normalize multiple spaces to single space
    .split(' ')
    .map((word, index) => {
      const cleanWord = word.toLowerCase();
      return index === 0 ? cleanWord : cleanWord.charAt(0).toUpperCase() + cleanWord.slice(1);
    })
    .join('');
};

const pluralize = (singular: string): string => {
  if (!singular) return '';
  
  const word = singular.toLowerCase();
  
  // Irregular plurals
  const irregulars: Record<string, string> = {
    'child': 'children',
    'person': 'people',
    'man': 'men',
    'woman': 'women',
    'tooth': 'teeth',
    'foot': 'feet',
    'mouse': 'mice',
    'goose': 'geese',
    'ox': 'oxen',
    'sheep': 'sheep',
    'deer': 'deer',
    'fish': 'fish',
    'moose': 'moose',
    'series': 'series',
    'species': 'species',
    'data': 'data',
    'media': 'media'
  };
  
  if (irregulars[word]) {
    // Preserve the original case pattern
    if (singular === singular.toUpperCase()) {
      return irregulars[word].toUpperCase();
    }
    if (singular[0] === singular[0].toUpperCase()) {
      return irregulars[word].charAt(0).toUpperCase() + irregulars[word].slice(1);
    }
    return irregulars[word];
  }
  
  // Words ending in -s, -ss, -sh, -ch, -x, -z, -o
  if (word.match(/(s|ss|sh|ch|x|z)$/)) {
    return singular + 'es';
  }
  
  // Words ending in -o (but not -oo)
  if (word.endsWith('o') && !word.endsWith('oo')) {
    return singular + 'es';
  }
  
  // Words ending in consonant + y
  if (word.match(/[bcdfghjklmnpqrstvwxz]y$/)) {
    return singular.slice(0, -1) + 'ies';
  }
  
  // Words ending in -f or -fe
  if (word.endsWith('f')) {
    return singular.slice(0, -1) + 'ves';
  }
  
  if (word.endsWith('fe')) {
    return singular.slice(0, -2) + 'ves';
  }
  
  // Default: just add 's'
  return singular + 's';
};

const validateDisplayName = (displayName: string): string | boolean => {
  if (!displayName) return 'Display name is required';
  
  if (displayName.length < 2) {
    return 'Display name must be at least 2 characters';
  }
  
  if (displayName.length > 50) {
    return 'Display name cannot exceed 50 characters';
  }
  
  // Must contain at least one letter
  if (!/[a-zA-Z]/.test(displayName)) {
    return 'Display name must contain at least one letter';
  }
  
  // Cannot start or end with special characters
  if (/^[^a-zA-Z0-9]|[^a-zA-Z0-9]$/.test(displayName)) {
    return 'Display name cannot start or end with special characters';
  }
  
  return true;
};

const validateApiId = (apiId: string): string | boolean => {
  if (!apiId) return 'API ID is required';
  
  if (!/^[a-z][a-zA-Z0-9]*$/.test(apiId)) {
    return 'API ID must start with lowercase letter and contain only letters and numbers';
  }
  
  if (apiId.length < 2) {
    return 'API ID must be at least 2 characters';
  }
  
  if (apiId.length > 30) {
    return 'API ID cannot exceed 30 characters';
  }
  
  return true;
};

export default defineComponent({
  name: 'CreateContentTypeDialog',
  props: {
    modelValue: {
      type: Boolean,
      default: false
    },
    contentType: {
      type: String as PropType<'collection' | 'single' | 'component'>,
      default: 'collection',
      validator: (value: string) => ['collection', 'single', 'component'].includes(value)
    }
  },
  emits: ['update:modelValue', 'create'],
  setup(props, { emit }) {
    const $q = useQuasar();
    
    const dialogVisible = computed({
      get: () => props.modelValue,
      set: (value) => emit('update:modelValue', value)
    });

    const currentStep = ref(1);
    const isCreating = ref(false);

    const formData = ref({
      displayName: '',
      singularName: '',
      pluralName: '',
      category: '',
      draftPublish: false,
      internationalization: false,
    });

    const typeLabel = computed(() => {
      switch (props.contentType) {
        case 'collection':
          return 'Collection Type';
        case 'single':
          return 'Single Type';
        case 'component':
          return 'Component';
        default:
          return '';
      }
    });

    // Reset form when dialog opens
    watch(() => props.modelValue, (newValue) => {
      if (newValue) {
        currentStep.value = 1;
        formData.value = {
          displayName: '',
          singularName: '',
          pluralName: '',
          category: '',
          draftPublish: false,
          internationalization: false,
        };
      }
    });

    // Auto-generate API IDs from display name
    watch(() => formData.value.displayName, (newValue) => {
      if (newValue) {
        const singular = toCamelCase(newValue);
        formData.value.singularName = singular;
        
        if (props.contentType === 'collection') {
          formData.value.pluralName = pluralize(singular);
        }
      } else {
        // Clear API IDs when display name is empty
        formData.value.singularName = '';
        formData.value.pluralName = '';
      }
    });

    const close = () => {
      dialogVisible.value = false;
    };

    const validateAndContinue = () => {
      // Validate display name
      const displayNameValidation = validateDisplayName(formData.value.displayName);
      if (displayNameValidation !== true) {
        $q.notify({
          type: 'negative',
          message: displayNameValidation as string,
        });
        return;
      }
      
      // Validate singular API ID
      const singularValidation = validateApiId(formData.value.singularName);
      if (singularValidation !== true) {
        $q.notify({
          type: 'negative',
          message: `Singular API ID: ${singularValidation}`,
        });
        return;
      }
      
      // Validate plural API ID for collections
      if (props.contentType === 'collection') {
        const pluralValidation = validateApiId(formData.value.pluralName);
        if (pluralValidation !== true) {
          $q.notify({
            type: 'negative',
            message: `Plural API ID: ${pluralValidation}`,
          });
          return;
        }
      }
      
      // All validations passed, continue to next step
      currentStep.value = 2;
    };

    const onHide = () => {
      // Reset form data
      formData.value = {
        displayName: '',
        singularName: '',
        pluralName: '',
        category: '',
        draftPublish: false,
        internationalization: false,
      };
      currentStep.value = 1;
    };

    const handleCreate = async () => {
      // Validate display name
      const displayNameValidation = validateDisplayName(formData.value.displayName);
      if (displayNameValidation !== true) {
        $q.notify({
          type: 'negative',
          message: displayNameValidation as string,
        });
        return;
      }
      
      // Validate singular API ID
      const singularValidation = validateApiId(formData.value.singularName);
      if (singularValidation !== true) {
        $q.notify({
          type: 'negative',
          message: `Singular API ID: ${singularValidation}`,
        });
        return;
      }
      
      // Validate plural API ID for collections
      if (props.contentType === 'collection') {
        const pluralValidation = validateApiId(formData.value.pluralName);
        if (pluralValidation !== true) {
          $q.notify({
            type: 'negative',
            message: `Plural API ID: ${pluralValidation}`,
          });
          return;
        }
      }
      
      isCreating.value = true;
      
      try {
        // Emit create event with form data
        emit('create', {
          type: props.contentType,
          ...formData.value
        });
        
        $q.notify({
          type: 'positive',
          message: `${typeLabel.value} created successfully`,
        });
        
        close();
      } catch (error) {
        $q.notify({
          type: 'negative',
          message: `Failed to create ${typeLabel.value}`,
        });
      } finally {
        isCreating.value = false;
      }
    };

    return {
      dialogVisible,
      currentStep,
      isCreating,
      formData,
      typeLabel,
      close,
      onHide,
      handleCreate,
      validateDisplayName,
      validateApiId,
      validateAndContinue
    };
  },
});
</script>
