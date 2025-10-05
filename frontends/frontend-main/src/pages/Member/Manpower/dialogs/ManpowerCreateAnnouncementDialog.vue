<template>
  <q-dialog v-model="dialogModel" class="announcement-dialog">
    <TemplateDialog minWidth="400px" maxWidth="400px">
      <template #DialogIcon>
        <q-icon
          :name="announcement ? 'edit' : 'campaign'"
          size="24px"
          class="text-on-surface"
        />
      </template>
      <template #DialogTitle>
        {{ announcement ? "Edit" : "Create" }} Announcement
      </template>
      <template #DialogContent>
        <q-form @submit.prevent="handleSubmit" class="q-pa-md">
          <!-- Title Field -->
          <div>
            <div class="label">Title</div>
            <q-input
              outlined
              dense
              v-model="form.title"
              class="text-input"
              placeholder="Enter announcement title"
              :rules="[
                (val) => !!val || 'Title is required',
                (val) =>
                  val.length <= 200 || 'Title must be less than 200 characters',
              ]"
            />
          </div>

          <!-- Content Field -->
          <div>
            <div class="label">Content</div>
            <q-input
              v-model="form.content"
              outlined
              dense
              autogrow
              type="textarea"
              class="q-pb-md"
              placeholder="Enter announcement content"
              required
            />
          </div>

          <!-- Announcement Type Selection -->
          <div class="q-pb-md">
            <div class="label">Announcement Type</div>
            <q-select
              v-model="form.type"
              :options="typeOptions"
              outlined
              dense
              emit-value
              map-options
              @update:model-value="updateIconAndColor"
            >
              <template v-slot:option="scope">
                <q-item v-bind="scope.itemProps">
                  <q-item-section avatar>
                    <q-icon :name="scope.opt.icon" :color="scope.opt.color" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>{{ scope.opt.label }}</q-item-label>
                  </q-item-section>
                </q-item>
              </template>
            </q-select>
          </div>

          <!-- Priority Field -->
          <div class="q-pb-md">
            <div class="text-label-large text-on-surface q-mb-xs">Priority</div>
            <q-select
              v-model="form.priority"
              :options="priorityOptions"
              outlined
              dense
              emit-value
              map-options
            />
          </div>

          <!-- Active Toggle (for edit mode)-->
          <div v-if="announcement">
            <q-toggle
              v-model="form.isActive"
              label="Active"
              color="primary"
              class="text-body-medium"
            />
          </div>

          <!-- Actions -->
          <div class="row justify-end q-gutter-sm">
            <g-button
              label="Cancel"
              variant="tonal"
              color="gray"
              v-close-popup
            />
            <g-button
              :label="announcement ? 'Update' : 'Create'"
              type="submit"
              color="primary"
              :loading="loading"
            />
          </div>
        </q-form>
      </template>
    </TemplateDialog>
  </q-dialog>
</template>

<script lang="ts">
import { defineComponent, ref, computed, watch } from "vue";
import { defineAsyncComponent } from 'vue';
import { useQuasar } from "quasar";
import { getCurrentInstance } from "vue";
import { AxiosError } from "axios";
import { handleAxiosError } from "src/utility/axios.error.handler";
import GButton from "src/components/shared/buttons/GButton.vue";

// Lazy-loaded dialogs (ALL dialogs must be lazy loaded - CLAUDE.md)
const TemplateDialog = defineAsyncComponent(() =>
  import('src/components/dialog/TemplateDialog.vue')
);

interface AnnouncementForm {
  title: string;
  content: string;
  type: string;
  icon: string;
  iconColor: string;
  priority: string;
  isActive: boolean;
}

export default defineComponent({
  name: "ManpowerCreateAnnouncementDialog",
  components: {
    TemplateDialog,
    GButton,
  },
  props: {
    modelValue: {
      type: Boolean,
      required: true,
    },
    announcement: {
      type: Object,
      default: null,
    },
  },
  emits: ["update:modelValue", "created", "updated"],
  setup(props, { emit }) {
    const instance = getCurrentInstance();
    const $api = instance?.proxy?.$api;
    const q = useQuasar();

    const loading = ref(false);
    const form = ref<AnnouncementForm>({
      title: "",
      content: "",
      type: "general",
      icon: "campaign",
      iconColor: "#615FF6",
      priority: "MEDIUM",
      isActive: true,
    });

    const dialogModel = computed({
      get: () => props.modelValue,
      set: (value) => emit("update:modelValue", value),
    });

    const typeOptions = [
      {
        label: "General Announcement",
        value: "general",
        icon: "campaign",
        color: "#615FF6",
      },
      { label: "Information", value: "info", icon: "info", color: "#2196F3" },
      { label: "Warning", value: "warning", icon: "warning", color: "#FF9800" },
      { label: "Error/Alert", value: "error", icon: "error", color: "#F44336" },
      {
        label: "Celebration",
        value: "celebration",
        icon: "celebration",
        color: "#4CAF50",
      },
      {
        label: "Schedule Update",
        value: "schedule",
        icon: "schedule",
        color: "#9C27B0",
      },
      { label: "Team Update", value: "team", icon: "people", color: "#00BCD4" },
      { label: "Work Update", value: "work", icon: "work", color: "#795548" },
      {
        label: "Training",
        value: "training",
        icon: "school",
        color: "#3F51B5",
      },
      { label: "Event", value: "event", icon: "event", color: "#E91E63" },
    ];

    const priorityOptions = [
      { label: "Low", value: "LOW" },
      { label: "Medium", value: "MEDIUM" },
      { label: "High", value: "HIGH" },
      { label: "Urgent", value: "URGENT" },
    ];

    const getPriorityColor = (priority: string) => {
      switch (priority) {
        case "LOW":
          return "green";
        case "MEDIUM":
          return "orange";
        case "HIGH":
          return "deep-orange";
        case "URGENT":
          return "red";
        default:
          return "grey";
      }
    };

    const updateIconAndColor = (type: string) => {
      const selectedType = typeOptions.find((t) => t.value === type);
      if (selectedType) {
        form.value.icon = selectedType.icon;
        form.value.iconColor = selectedType.color;
      }
    };

    const resetForm = () => {
      form.value = {
        title: "",
        content: "",
        type: "general",
        icon: "campaign",
        iconColor: "#615FF6",
        priority: "MEDIUM",
        isActive: true,
      };
    };

    const handleSubmit = async () => {
      if (!$api) return;

      loading.value = true;
      try {
        if (props.announcement) {
          // Update existing announcement
          await $api.put(`announcement/${props.announcement.id}`, form.value);
          q.notify({
            type: "positive",
            message: "Announcement updated successfully",
          });
          emit("updated");
        } else {
          // Create new announcement
          await $api.post("announcement", form.value);
          q.notify({
            type: "positive",
            message: "Announcement created successfully",
          });
          emit("created");
        }
        dialogModel.value = false;
        resetForm();
      } catch (error) {
        handleAxiosError(q, error as AxiosError);
      } finally {
        loading.value = false;
      }
    };

    // Watch for announcement prop changes
    watch(
      () => props.announcement,
      (newVal) => {
        if (newVal) {
          form.value = {
            title: newVal.title,
            content: newVal.content,
            type: newVal.type || "general",
            icon: newVal.icon,
            iconColor: newVal.iconColor,
            priority: newVal.priority,
            isActive: newVal.isActive,
          };
        } else {
          resetForm();
        }
      },
      { immediate: true }
    );

    return {
      dialogModel,
      loading,
      form,
      typeOptions,
      updateIconAndColor,
      priorityOptions,
      getPriorityColor,
      handleSubmit,
    };
  },
});
</script>

<style scoped lang="scss">
.announcement-dialog {
  position: relative;
}

.md3-dialog {
  width: 600px;
  max-width: 90vw;
  border-radius: 28px;
  position: absolute;
  bottom: 0;
  right: 0;
}

.dialog-header {
  padding: 24px;
}

.dialog-content {
  max-height: 70vh;
  overflow-y: auto;
  padding: 0 24px 24px 24px;
}

// MD3 Input styling
.text-input {
  :deep(.q-field__bottom) {
    padding: 3px 0;
  }

  :deep(.q-field__native) {
    color: var(--q-on-surface, #1c1b1f);
  }
}

// MD3 Select styling
.md3-select {
  :deep(.q-field__control) {
    background-color: var(--q-surface-container-highest, #e6e0e9);
    border-radius: 12px;

    &:hover {
      background-color: var(--q-surface-container-highest, #e6e0e9);
    }
  }
}

.md3-filled-button {
  border-radius: 20px;
  padding: 10px 24px;
  font-weight: 500;
  text-transform: none;
  background-color: var(--q-primary) !important;
}

// MD3 Chip in select
:deep(.q-chip) {
  border-radius: 8px;
  font-weight: 500;
}
</style>
