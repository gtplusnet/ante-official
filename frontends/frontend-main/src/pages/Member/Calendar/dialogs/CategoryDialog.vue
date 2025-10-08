<template>
  <q-dialog
    v-model="showDialog"
    persistent
  >
    <q-card class="category-dialog">
      <!-- Header -->
      <q-card-section class="dialog-header">
        <div class="header-content">
          <div class="header-left">
            <q-icon name="label" size="24px" color="primary" />
            <span class="text-h6">{{ isEditing ? 'Edit Category' : 'New Category' }}</span>
          </div>
          <q-btn
            flat
            round
            dense
            icon="close"
            v-close-popup
          />
        </div>
      </q-card-section>

      <q-separator />

      <!-- Form -->
      <q-card-section class="dialog-body">
        <q-form @submit="handleSubmit" class="category-form">
          <!-- Name -->
          <div class="form-field">
            <q-input
              v-model="form.name"
              label="Category Name *"
              outlined
              dense
              :rules="[val => !!val || 'Category name is required']"
              class="full-width"
            />
          </div>

          <!-- Color -->
          <div class="form-field">
            <div class="color-picker-label">Color</div>
            <div class="color-picker-grid">
              <div
                v-for="color in predefinedColors"
                :key="color"
                class="color-option"
                :class="{ 'selected': form.colorCode === color }"
                :style="{ backgroundColor: color }"
                @click="form.colorCode = color"
              >
                <q-icon
                  v-if="form.colorCode === color"
                  name="check"
                  color="white"
                  size="16px"
                />
              </div>
            </div>
          </div>

          <!-- Icon -->
          <div class="form-field">
            <q-select
              v-model="form.icon"
              :options="iconOptions"
              label="Icon"
              outlined
              dense
              emit-value
              map-options
              class="full-width"
            >
              <template v-slot:prepend>
                <q-icon :name="form.icon || 'label'" />
              </template>
              <template v-slot:option="scope">
                <q-item v-bind="scope.itemProps">
                  <q-item-section avatar>
                    <q-icon :name="scope.opt.value" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>{{ scope.opt.label }}</q-item-label>
                  </q-item-section>
                </q-item>
              </template>
            </q-select>
          </div>

          <!-- Description -->
          <div class="form-field">
            <q-input
              v-model="form.description"
              label="Description"
              outlined
              dense
              type="textarea"
              rows="3"
              class="full-width"
            />
          </div>

          <!-- System Category Info -->
          <div v-if="isEditing && category?.isSystem" class="system-category-notice">
            <q-banner rounded class="bg-info text-white">
              <template v-slot:avatar>
                <q-icon name="info" color="white" />
              </template>
              This is a system category. Some fields may be restricted.
            </q-banner>
          </div>
        </q-form>
      </q-card-section>

      <!-- Actions -->
      <q-card-section class="dialog-actions">
        <q-btn
          flat
          label="Cancel"
          v-close-popup
          class="q-mr-sm"
        />
        <q-btn
          unelevated
          color="primary"
          :label="isEditing ? 'Update' : 'Create'"
          :loading="loading"
          @click="handleSubmit"
        />
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { useCalendarCategories, type CalendarCategory } from 'src/composables/calendar/useCalendarCategories';

// Props
interface Props {
  modelValue: boolean;
  category?: CalendarCategory | null;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  category: null
});

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  'saved': [category: any];
}>();

// Composables
const $q = useQuasar();
const { createCategory, updateCategory, predefinedColors } = useCalendarCategories();

// State
const showDialog = ref(props.modelValue);
const loading = ref(false);

// Icon options
const iconOptions = [
  { label: 'Label', value: 'label' },
  { label: 'Work', value: 'work' },
  { label: 'Person', value: 'person' },
  { label: 'Meeting', value: 'groups' },
  { label: 'Event', value: 'event' },
  { label: 'Celebration', value: 'celebration' },
  { label: 'School', value: 'school' },
  { label: 'Flight', value: 'flight' },
  { label: 'Restaurant', value: 'restaurant' },
  { label: 'Fitness', value: 'fitness_center' },
  { label: 'Medical', value: 'medical_services' },
  { label: 'Shopping', value: 'shopping_cart' },
  { label: 'Home', value: 'home' },
  { label: 'Star', value: 'star' },
  { label: 'Favorite', value: 'favorite' },
  { label: 'Bookmark', value: 'bookmark' }
];

// Form
const form = ref({
  name: '',
  colorCode: '#2196F3',
  icon: 'label',
  description: ''
});

// Computed
const isEditing = computed(() => !!props.category);

// Methods
const initializeForm = () => {
  if (props.category) {
    form.value = {
      name: props.category.name || '',
      colorCode: props.category.colorCode || '#2196F3',
      icon: props.category.icon || 'label',
      description: props.category.description || ''
    };
  } else {
    form.value = {
      name: '',
      colorCode: '#2196F3',
      icon: 'label',
      description: ''
    };
  }
};

const handleSubmit = async () => {
  if (!form.value.name) {
    $q.notify({
      type: 'negative',
      message: 'Please enter a category name'
    });
    return;
  }

  loading.value = true;

  try {
    const categoryData = {
      name: form.value.name,
      colorCode: form.value.colorCode,
      icon: form.value.icon,
      description: form.value.description || null
    };

    if (isEditing.value && props.category) {
      await updateCategory(props.category.id, categoryData);
      $q.notify({
        type: 'positive',
        message: 'Category updated successfully'
      });
    } else {
      await createCategory(categoryData);
      $q.notify({
        type: 'positive',
        message: 'Category created successfully'
      });
    }

    emit('saved', categoryData);
    showDialog.value = false;
  } catch (error) {
    console.error('Error saving category:', error);
    $q.notify({
      type: 'negative',
      message: 'Failed to save category'
    });
  } finally {
    loading.value = false;
  }
};

// Watchers
watch(() => props.modelValue, (val) => {
  showDialog.value = val;
  if (val) {
    initializeForm();
  }
});

watch(showDialog, (val) => {
  emit('update:modelValue', val);
});

// Lifecycle
onMounted(() => {
  initializeForm();
});
</script>

<style lang="scss" scoped>
.category-dialog {
  width: 100%;
  max-width: 500px;

  .dialog-header {
    background: white;
    padding: 16px;

    .header-content {
      display: flex;
      align-items: center;
      justify-content: space-between;

      .header-left {
        display: flex;
        align-items: center;
        gap: 12px;
      }
    }
  }

  .dialog-body {
    padding: 24px;

    .category-form {
      .form-field {
        margin-bottom: 16px;

        &:last-child {
          margin-bottom: 0;
        }
      }

      .color-picker-label {
        font-size: 0.875rem;
        color: rgba(0, 0, 0, 0.6);
        margin-bottom: 8px;
      }

      .color-picker-grid {
        display: grid;
        grid-template-columns: repeat(10, 1fr);
        gap: 8px;

        .color-option {
          aspect-ratio: 1;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.2s;
          border: 2px solid transparent;

          &:hover {
            transform: scale(1.1);
          }

          &.selected {
            border-color: rgba(0, 0, 0, 0.2);
            transform: scale(1.15);
          }
        }
      }

      .system-category-notice {
        margin-top: 16px;
      }
    }
  }

  .dialog-actions {
    padding: 16px 24px;
    display: flex;
    justify-content: flex-end;
    border-top: 1px solid rgba(0, 0, 0, 0.08);
  }
}

// Mobile responsiveness
@media (max-width: 768px) {
  .category-dialog {
    .color-picker-grid {
      grid-template-columns: repeat(5, 1fr) !important;
    }
  }
}
</style>
