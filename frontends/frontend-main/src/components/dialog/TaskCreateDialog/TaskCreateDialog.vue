<template>
  <q-dialog
    @before-show="initForm()"
    ref="dialog"
    :maximized="$q.platform.is.mobile"
    transition-show="slide-up"
    transition-hide="slide-down"
  >
    <q-card class="dialog-card" :class="{ 'mobile-dialog': $q.platform.is.mobile }">
      <q-card-section class="dialog-header">
        <div class="dialog-header-content">
          <q-icon name="o_task" size="24px" class="dialog-icon" />
          <span @dblclick="fillData()" class="text-title-medium text-dark">Create Task</span>
        </div>
        <q-btn round flat dense icon="close" class="dialog-close-btn" v-close-popup>
          <q-tooltip class="text-label-small">Close</q-tooltip>
        </q-btn>
      </q-card-section>

      <q-separator />

      <q-card-section class="dialog-body q-pb-none">
        <q-form @submit.prevent="saveTask" class="task-form q-pb-none">
          <!-- Assign Mode -->
          <div class="form-field q-pb-md">
            <GInput
              type="select-search"
              apiUrl="/select-box/assign-mode-list"
              label="Assign To"
              v-model="form.assignMode"
              data-testid="task-assign-mode-select"
            >
            </GInput>
          </div>

          <!-- Assignee -->
          <div v-if="form.assignMode == 'OTHER'" class="form-field q-pb-md">
            <GInput
              type="select-search"
              apiUrl="/select-box/assignee-list?mode=others"
              label="Assignee"
              v-model="form.assignedToId"
            >
            </GInput>
          </div>

          <!-- Role Group -->
          <div v-if="form.assignMode == 'ROLE_GROUP'" class="form-field q-pb-md">
            <GInput
              type="select-search"
              apiUrl="/select-box/role-group-list"
              label="Role Group"
              v-model="form.roleGroupId"
            >
            </GInput>
          </div>

          <!-- Title -->
          <div class="form-field">
            <GInput required type="text" label="Task Title" v-model="form.title" data-testid="task-title-input"></GInput>
          </div>

          <!-- Difficulty -->
          <div class="form-field q-pb-md">
            <GInput
              required
              type="select"
              apiUrl="/select-box/task-difficulty-list"
              label="Difficulty"
              v-model="form.difficulty"
              data-testid="task-difficulty-select"
            ></GInput>
          </div>

          <!-- Description -->
          <div class="form-field">
            <GInput required type="editor" label="Description" v-model="form.description" data-testid="task-description-editor"></GInput>
          </div>

          <!-- Project -->
          <div class="form-field q-pb-md">
            <GInput
              type="select-search"
              apiUrl="/select-box/project-list"
              label="Project"
              nullOption="No Project"
              v-model="form.project"
            >
            </GInput>
          </div>

          <!-- Due Date -->
          <div class="form-field q-pb-md">
            <GInput type="date" label="Due Date" v-model="form.dueDate"></GInput>
          </div>

          <!-- Collaborators -->
          <div class="form-field q-pb-md">
            <div class="g-field">
              <div class="label text-label-large">Collaborators</div>
              <div class="field">
                <q-select
                  ref="tagInput"
                  v-model="form.collaborators"
                  use-input
                  use-chips
                  multiple
                  input-debounce="0"
                  hide-dropdown-icon
                  map-options
                  emit-value
                  clearable
                  outlined
                  dense
                  hide-bottom-space
                  class="q-mb-md collaborators-select"
                  input-value="inputText"
                >
                  <template v-slot:append>
                    <q-icon
                      @click="showChooseCollaborators"
                      name="add"
                      class="cursor-pointer add-collaborator-btn"
                    />
                  </template>
                </q-select>
              </div>
            </div>
          </div>
        </q-form>
      </q-card-section>

      <q-separator />

      <!-- Dialog Actions -->
      <q-card-actions class="dialog-actions">
        <q-btn
          no-caps
          flat
          class="text-label-large action-btn"
          label="Cancel"
          color="primary"
          v-close-popup
        />
        <q-space />
        <q-btn
          no-caps
          unelevated
          class="text-label-large action-btn"
          label="Create Task"
          color="primary"
          @click="saveTask"
          :loading="loading"
          data-testid="task-submit-button"
        />
      </q-card-actions>
    </q-card>

    <!-- Choose User Dialog -->
    <ChooseUserDialog
      v-model="isChooseUserDialogOpen"
      :existingCollaborators="form.collaborators"
      @submitSelectedUsers="updateCollaborators"
    ></ChooseUserDialog>
  </q-dialog>
</template>

<style scoped lang="scss">
// Material Design 3 Dialog Styles
.dialog-card {
  border-radius: 16px;

  &.mobile-dialog {
    border-radius: 0;
    width: 100vw;
    height: 100dvh;
    max-width: 100vw;
    background-color: #ffffff;
    box-shadow: none;
  }
}

// Dialog Header - MD3 style
.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: #ffffff;

  .dialog-header-content {
    display: flex;
    align-items: center;
    gap: 16px;

    .dialog-icon {
      color: var(--q-primary);
    }

    .dialog-title {
      margin: 0;
      color: var(--q-on-surface);
      font-weight: 400;
    }
  }

  .dialog-close-btn {
    color: var(--q-on-surface-variant);

    &:hover {
      background-color: rgba(0, 0, 0, 0.08);
    }
  }
}

// Dialog Body
.dialog-body {
  width: 100%;
  box-sizing: border-box;
  height: calc(100vh - 250px);
  overflow: auto;

    &::-webkit-scrollbar {
    height: 6px;
    width: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background-color: #d9d9d9;
    border-radius: 50px;
  }

  &::-webkit-scrollbar-track {
    background-color: #f4f4f4;
    border-radius: 50px;
  }

  @media (max-width: 768px) {
    height: calc(100dvh - 144px);
  }

  @media (max-width: 600px) {
    height: calc(100dvh - 144px);
  }
}

// Form Styles
.task-form {
  display: flex;
  flex-direction: column;
  background-color: #ffffff;
  width: 100%;
  box-sizing: border-box;

  .form-field {
    width: 100%;
    box-sizing: border-box;

    // Ensure GInput components don't overflow
    :deep(.g-field) {
      width: 100%;
      box-sizing: border-box;

      .field {
        width: 100%;
        box-sizing: border-box;
      }
    }
  }
}

// Collaborators Select
.collaborators-select {
  background-color: #f5f5f5;

  &:hover {
    background-color: rgba(0, 0, 0, 0.04);
  }

  .add-collaborator-btn {
    color: var(--q-primary);
    transition: all 0.2s ease;

    &:hover {
      transform: scale(1.1);
    }
  }
}

// Dialog Actions - MD3 style
.dialog-actions {
  padding: 16px 24px;
  background-color: #ffffff;

  .action-btn {
    min-width: 64px;
    padding: 10px 24px;
    border-radius: 20px;

    &:not(.q-btn--unelevated) {
      &:hover {
        background-color: rgba(var(--q-primary-rgb), 0.08);
      }
    }
  }

  @media (max-width: 600px) {
    padding: 16px;
  }
}

// Material Design 3 elevation and shadows
.q-dialog__inner {
  padding: 24px;

  @media (max-width: 600px) {
    padding: 0;
  }
}

// Ensure proper spacing on mobile
@media (max-width: 600px) {
  .dialog-header {
    padding: 16px;
    position: sticky;
    top: 0;
    z-index: 10;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
  }
}

// Loading state
.q-btn--loading {
  .q-btn__content {
    opacity: 0;
  }
}

// Input field enhancements for MD3
:deep(.q-field) {
  width: 100% !important;
  max-width: 100% !important;
  box-sizing: border-box;
}

:deep(.q-field__control) {
  border-radius: 4px;
  width: 100% !important;
  box-sizing: border-box;

  &:hover {
    background-color: rgba(0, 0, 0, 0.04);
  }
}

:deep(.q-field--outlined .q-field__control:before) {
  border-color: var(--q-outline, rgba(0, 0, 0, 0.24));
}

:deep(.q-field--outlined.q-field--focused .q-field__control:before) {
  border-color: var(--q-primary);
  border-width: 2px;
}

// Ensure select dropdowns don't overflow
:deep(.q-select) {
  width: 100% !important;
  max-width: 100% !important;

  .q-field__inner {
    width: 100% !important;
  }
}

// Chip styles for collaborators
:deep(.q-chip) {
  background-color: var(--q-secondary-container, #e8f5e9);
  color: var(--q-on-secondary-container, #1b5e20);
  border-radius: 8px;
  height: 32px;

  .q-chip__icon--remove {
    color: var(--q-on-secondary-container);
    opacity: 0.6;

    &:hover {
      opacity: 1;
    }
  }
}

// Editor field enhancement
:deep(.q-editor) {
  border-radius: 4px;
  overflow: hidden;
  width: 100% !important;
  max-width: 100% !important;
  box-sizing: border-box;

  .q-editor__toolbar {
    background-color: var(--q-surface-variant, #f5f5f5);
    border-bottom: 1px solid var(--q-outline, rgba(0, 0, 0, 0.12));
    flex-wrap: wrap;
    overflow-x: auto;

    &::-webkit-scrollbar {
      height: 4px;
    }

    &::-webkit-scrollbar-track {
      background: transparent;
    }

    &::-webkit-scrollbar-thumb {
      background-color: rgba(0, 0, 0, 0.2);
      border-radius: 2px;
    }
  }

  .q-editor__content {
    min-height: 120px;
    width: 100%;
    box-sizing: border-box;
    overflow-wrap: break-word;
    word-wrap: break-word;

    @media (max-width: 600px) {
      min-height: 100px;
    }
  }

  .q-editor__container {
    width: 100%;
    box-sizing: border-box;
  }
}

// Date picker enhancement
:deep(.q-date) {
  .q-date__navigation {
    .q-btn {
      color: var(--q-primary);
    }
  }

  .q-date__calendar-item {
    &.q-date__calendar-item--active {
      background-color: var(--q-primary);
      color: var(--q-on-primary);
      border-radius: 50%;
    }
  }
}
</style>

<script>
import { defineAsyncComponent } from 'vue';
import GInput from '../../../components/shared/form/GInput.vue';
import { api, environment } from 'src/boot/axios';
import { useGlobalMethods } from 'src/composables/useGlobalMethods';
import { useAssigneeList } from 'src/composables/useAssigneeList';

// Lazy-loaded dialogs (ALL dialogs must be lazy loaded - CLAUDE.md)
const ChooseUserDialog = defineAsyncComponent(() =>
  import('./ChooseUserDialog.vue')
);

export default {
  name: 'TaskCreateDialog',
  components: {
    ChooseUserDialog,
    GInput,
  },
  props: {},
  setup() {
    // Get all assignees including current user
    const { assignees, loading: assigneesLoading } = useAssigneeList();
    return {
      assignees,
      assigneesLoading
    };
  },
  data: () => ({
    isChooseUserDialogOpen: false,
    environment: environment,
    loading: false,
    form: {
      collaborators: [],
    },
  }),
  computed: {
    assigneeOptions() {
      // Format assignees for GInput select component
      if (!this.assignees) return [];
      return this.assignees.map(assignee => ({
        label: assignee.label || assignee.name,
        value: assignee.value || assignee.id
      }));
    },
  },
  mounted() {
    // Initialize global methods
    const { handleAxiosError } = useGlobalMethods();
    this.handleAxiosError = handleAxiosError;
    this.initForm();
  },
  methods: {
    async showChooseCollaborators() {
      this.isChooseUserDialogOpen = true;
    },
    updateCollaborators(selectedUsers) {
      this.form.collaborators = selectedUsers;
    },
    async initForm() {
      this.form = {
        title: '',
        description: '',
        project: null,
        assignedToId: null,
        roleGroupId: null,
        assignMode: 'SELF',
        difficulty: 1,
        dueDate: null,
        collaborators: [],
      };
    },
    async fillData() {
      if (environment === 'development') {
        const randomNumber = Math.floor(Math.random() * 1000);
        this.form.title = 'Task ' + randomNumber;
        this.form.description = 'Task description';

        this.$q.notify({
          color: 'grey-8',
          message: 'Data filled successfully',
          position: 'top',
        });
      }
    },
    async saveTask() {
      this.loading = true;
      try {
        const param = {
          title: this.form.title,
          description: this.form.description,
          assignedMode: this.form.assignMode || 'SELF',
          difficulty: this.form.difficulty || 1,
        };

        // Only add optional fields if they have values
        if (this.form.project) {
          param.projectId = this.form.project;
        }
        if (this.form.assignedToId) {
          param.assignedToId = this.form.assignedToId;
        }
        if (this.form.roleGroupId) {
          param.roleGroupId = this.form.roleGroupId;
        }

        if (this.form.dueDate) {
          param.dueDate = new Date(this.form.dueDate).toISOString();
        }

        // add collaborators
        if (this.form.collaborators && this.form.collaborators.length > 0) {
          param.collaboratorAccountIds = this.form.collaborators.map(
            (collaborator) => collaborator.id
          );
        }

        await api.post('/task/create', param);

        this.$q.notify({
          color: 'positive',
          message: 'Task created successfully',
          position: 'top',
        });
        this.$emit('close');
        this.$refs.dialog.hide();
        this.$bus.emit('reloadTaskList');
        this.initForm();
      } catch (error) {
        console.log(error);
        this.handleAxiosError(error);
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>
