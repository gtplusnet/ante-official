<template>
  <div v-if="this.isInitialized" class="task-form-container">
    <!-- Scrollable Form Content -->
    <div class="form-content">
      <div v-if="permissions.isShowCreator && taskInformation.createdBy" class="creator-banner">
        <q-icon name="o_assignment_ind" size="20px" />
        <span
          >Assigned by {{ this.taskInformation.createdBy.firstName }}
          {{ this.taskInformation.createdBy.lastName }}</span
        >
      </div>

      <div class="form-fields">
        <div class="row q-col-gutter-x-md">
          <div class="col-12 col-md-4">
            <div class="label">Task No.</div>
            <div class="fake-field">{{ taskInformation.id }}</div>
          </div>


          <div class="col-12 col-md-4">
            <GInput
              :isDisabled="!permissions.isAllowedEditTask"
              type="text"
              label="Title"
              v-model="form.title"
            />
          </div>

          <div class="col-12 col-md-4 q-mb-md">
            <GInput
              :isDisabled="!permissions.isAllowedChangeDueDate"
              type="date"
              label="Deadline"
              v-model="form.dueDateString"
            />
          </div>
        </div>

        <div class="row q-col-gutter-x-md">
          <div class="col-12 col-md-4 q-mb-md">
            <GInput
              :isDisabled="!permissions.isAllowedChangeAssignee"
              type="select-search"
              null-option="No Assignee Yet"
              :options="assigneeOptions"
              label="Assignee"
              v-model="form.assignee"
            />
          </div>

          <div class="col-12 col-md-4 q-mb-md">
            <GInput
              type="select-search"
              apiUrl="/select-box/task-priority-list"
              label="Priority"
              v-model="form.priorityLevel"
              :storeCache="true"
            />
          </div>

          <div class="col-12 col-md-4 q-mb-md">
            <GInput
              type="select-search"
              apiUrl="/select-box/task-difficulty-list"
              label="Difficulty"
              v-model="form.difficultyLevel"
              :storeCache="true"
            />
          </div>
        </div>

        <div class="row q-col-gutter-x-md">
          <div class="col-12 q-mb-md">
            <GInput
              :isDisabled="!permissions.isAllowedEditTask"
              type="select-search"
              apiUrl="/select-box/project-list"
              null-option="No Project"
              label="Project"
              v-model="form.project"
              :storeCache="true"
            />
          </div>
        </div>

        <div class="col-12">
          <GInput
            :isDisabled="!permissions.isAllowedEditTask"
            type="editor"
            label="Description"
            v-model="form.description"
          />
        </div>
      </div>
    </div>

    <!-- Fixed Bottom Action Bar -->
    <div class="action-bar">
      <div class="action-bar-content">
        <!-- Status Actions (Left side) -->
        <div class="status-actions">
          <!-- Workflow Action Buttons -->
          <workflow-action-buttons
            v-if="hasWorkflowInstance"
            :workflow-instance-id="workflowInstanceId"
            @action-performed="handleWorkflowAction"
          />
          
          <!-- Regular Task Buttons (only shown when no workflow) -->
          <template v-else>
            <!-- Start Timer Button - Show when no timer running for this task AND task is assigned to current user -->
            <q-btn
              v-if="isAssignedToCurrentUser && (!currentTimer || currentTimer.taskId !== taskInformation.id)"
              @click="startTaskTimer"
              unelevated
              no-caps
              color="primary"
              class="action-button primary"
              :disable="!taskInformation.isOpen"
            >
              <q-icon name="o_timer" size="20px" class="q-mr-sm" />
              Start Timer
            </q-btn>
            
            <!-- Stop Timer Button - Show when timer is running for this task AND task is assigned to current user -->
            <q-btn
              v-else-if="isAssignedToCurrentUser && currentTimer && currentTimer.taskId === taskInformation.id"
              @click="stopTaskTimer"
              unelevated
              no-caps
              color="negative"
              class="action-button primary"
            >
              <q-icon name="o_timer_off" size="20px" class="q-mr-sm" />
              Stop Timer ({{ formatTime(elapsedSeconds) }})
            </q-btn>
            
            <!-- Claim Task Button -->
            <q-btn
              v-if="permissions.isAllowedClaimTask"
              @click="updateTaskStatus('claim')"
              unelevated
              no-caps
              color="primary"
              class="action-button primary"
            >
              <q-icon name="o_pan_tool" size="20px" class="q-mr-sm" />
              Claim Task
            </q-btn>

            <!-- Start Task Button -->
            <q-btn
              v-if="permissions.isAllowedStartTask"
              @click="updateTaskStatus('start')"
              unelevated
              no-caps
              color="primary"
              class="action-button primary"
            >
              <q-icon name="o_play_arrow" size="20px" class="q-mr-sm" />
              Start Task
            </q-btn>

            <!-- Complete Task Button -->
            <q-btn
              v-if="permissions.isAllowedCompleteTask"
              @click="updateTaskStatus('complete')"
              unelevated
              no-caps
              color="positive"
              class="action-button primary"
            >
              <q-icon name="o_check_circle" size="20px" class="q-mr-sm" />
              Complete Task
            </q-btn>

            <!-- Accept Task Button -->
            <q-btn
              v-if="permissions.isAllowedAcceptTask"
              @click="updateTaskStatus('accept')"
              unelevated
              no-caps
              color="positive"
              class="action-button primary"
            >
              <q-icon name="o_thumb_up" size="20px" class="q-mr-sm" />
              Accept Task
            </q-btn>

            <!-- Reject Task Button -->
            <q-btn
              v-if="permissions.isAllowedRejectTask"
              @click="updateTaskStatus('reject')"
              unelevated
              no-caps
              color="negative"
              class="action-button primary"
            >
              <q-icon name="o_thumb_down" size="20px" class="q-mr-sm" />
              Reject Task
            </q-btn>
          </template>
        </div>

        <!-- Primary Actions (Right side) -->
        <div class="primary-actions">
          <!-- Update Task Button -->
          <q-btn
            @click="updateData"
            unelevated
            no-caps
            color="primary"
            class="action-button primary"
            :loading="loading"
          >
            <q-icon name="o_save" size="20px" class="q-mr-sm" />
            Update Task
          </q-btn>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import GInput from '../../../../components/shared/form/GInput.vue';
import WorkflowActionButtons from '../../../../components/workflow/WorkflowActionButtons.vue';
import { api } from 'src/boot/axios';
import { useAssigneeList } from 'src/composables/useAssigneeList';
import { useAuthStore } from 'src/stores/auth';

export default {
  name: 'TaskInformationForm',
  components: {
    GInput,
    WorkflowActionButtons,
  },
  props: {
    taskInformation: {
      type: Object,
      required: true,
    },
  },
  setup() {
    const { assignees, loading: assigneesLoading } = useAssigneeList();
    return {
      assignees,
      assigneesLoading
    };
  },
  data: () => ({
    isInitialized: false,
    permission: {},
    form: {},
    loading: false,
    currentTimer: null,
    isCheckingTimer: false,
    timerInterval: null,
    elapsedSeconds: 0,
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
    hasWorkflowInstance() {
      return !!this.taskInformation?.workflowInstanceId;
    },
    workflowInstanceId() {
      return this.taskInformation?.workflowInstanceId || null;
    },
    isAssignedToCurrentUser() {
      const authStore = useAuthStore();
      const currentUserId = authStore.accountInformation?.id;

      // Check if task is assigned to current user
      if (!currentUserId) return false;

      return this.taskInformation.assignedToId === currentUserId ||
             this.taskInformation.assignedTo?.id === currentUserId;
    },
  },
  watch: {
    taskInformation: {
      deep: true,
      handler() {
        this.initialize();
      }
    }
  },
  mounted() {
    this.isInitialized = false;
    this.initialize();
    this.checkCurrentTimer();
  },
  beforeUnmount() {
    // Clear interval when component is destroyed
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  },
  methods: {
    initialize() {
      // Handle cases where permissions might not be available yet (e.g., when opening from task list)
      // Default permissions will be restrictive until full data is loaded
      this.permissions = this.taskInformation.permissions || {
        isShowCreator: false,
        isAllowedEditTask: false,
        isAllowedChangeAssignee: false,
        isAllowedChangeDueDate: false,
        isAllowedClaimTask: false,
        isAllowedStartTask: false,
        isAllowedCompleteTask: false,
        isAllowedAcceptTask: false,
        isAllowedRejectTask: false
      };

      this.form = {
        title: this.taskInformation.title,
        assignee: this.taskInformation.assignedTo ? this.taskInformation.assignedTo.id : null,
        priorityLevel: this.taskInformation.priorityLevel?.key || null,
        description: this.taskInformation.description,
        difficultyLevel: this.taskInformation.assignedToDifficultySet?.key || null,
        dueDateString: this.taskInformation.dueDate?.dateStandard || null,
        project: this.taskInformation.project?.id || this.taskInformation.projectId || null,
      };

      this.isInitialized = true;
    },
    
    // Check if timer is running for this task
    async checkCurrentTimer() {
      try {
        // Skip timer check if taskInformation is not fully loaded
        if (!this.taskInformation || !this.taskInformation.id) {
          return null;
        }

        const response = await api.get('/time-tracking/current');
        this.currentTimer = response.data;

        // If timer is running for this task, start the interval
        if (this.currentTimer && this.currentTimer.taskId === this.taskInformation.id) {
          this.elapsedSeconds = this.currentTimer.elapsedSeconds || 0;
          this.startTimerInterval();
        }

        return response.data;
      } catch (error) {
        this.currentTimer = null;
        return null;
      }
    },
    
    // Start timer interval for updating elapsed time
    startTimerInterval() {
      // Clear any existing interval
      if (this.timerInterval) {
        clearInterval(this.timerInterval);
      }
      
      // Update every second
      this.timerInterval = setInterval(() => {
        this.elapsedSeconds++;
      }, 1000);
    },
    
    // Format time for display
    formatTime(seconds) {
      if (!seconds && seconds !== 0) return '00:00:00';
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const secs = seconds % 60;
      return [hours, minutes, secs]
        .map(val => String(val).padStart(2, '0'))
        .join(':');
    },
    
    // Start timer for this task
    async startTaskTimer() {
      try {
        // Check if there's a timer running for a different task
        if (this.currentTimer && this.currentTimer.taskId !== this.taskInformation.id) {
          // Show confirmation dialog for switching timers
          this.$q.dialog({
            title: 'Switch Timer',
            message: `Timer is currently running for "${this.currentTimer.taskTitle}". Switch to this task?`,
            cancel: true,
            persistent: true,
            ok: {
              label: 'Switch Timer',
              color: 'primary',
              flat: false
            },
            cancel: {
              label: 'Cancel',
              flat: true
            }
          }).onOk(async () => {
            await this.performStartTimer(true);
          });
        } else {
          await this.performStartTimer(false);
        }
      } catch (error) {
        console.error('Error in startTaskTimer:', error);
      }
    },
    
    // Perform the actual timer start
    async performStartTimer(isSwitching = false) {
      try {
        this.$q.loading.show();
        
        await api.post('/time-tracking/start', { 
          taskId: this.taskInformation.id 
        });
        
        // Refresh timer status
        await this.checkCurrentTimer();
        
        // Emit event to update TimerWidget
        if (this.$bus) {
          if (isSwitching) {
            this.$bus.emit('timer-switched');  // Specific event for timer switching
          }
          this.$bus.emit('timer-started');
          this.$bus.emit('reloadTaskList');
        }
        
        const message = isSwitching 
          ? 'Timer switched successfully' 
          : 'Timer started successfully';
          
        this.$q.notify({
          type: 'positive',
          message
        });
      } catch (error) {
        this.$q.notify({
          type: 'negative',
          message: error.response?.data?.message || 'Failed to start timer'
        });
      } finally {
        this.$q.loading.hide();
      }
    },
    
    // Stop timer
    async stopTaskTimer() {
      try {
        this.$q.loading.show();
        await api.post('/time-tracking/stop', {});
        
        // Clear interval
        if (this.timerInterval) {
          clearInterval(this.timerInterval);
          this.timerInterval = null;
        }
        
        // Reset timer state
        this.currentTimer = null;
        this.elapsedSeconds = 0;
        
        // Emit event to update TimerWidget
        if (this.$bus) {
          this.$bus.emit('timer-stopped');
          this.$bus.emit('reloadTaskList');
        }
        
        this.$q.notify({
          type: 'positive',
          message: 'Timer stopped successfully'
        });
      } catch (error) {
        this.$q.notify({
          type: 'negative',
          message: 'Failed to stop timer'
        });
      } finally {
        this.$q.loading.hide();
      }
    },
    async updateTaskStatus(key) {
      // If completing task and timer is running for this task, stop it first
      if (key === 'complete' && this.currentTimer?.taskId === this.taskInformation.id) {
        await this.stopTaskTimer();
      }
      
      let url = '';
      let message = '';

      switch (key) {
        case 'accept':
          url = '/task/accept';
          message = 'Task accepted successfully';

          break;

        case 'reject':
          url = '/task/reject';
          message = 'Task rejected successfully';

          break;

        case 'claim':
          url = '/task/claim';
          message = 'Task claimed successfully';
          break;

        case 'complete':
          url = '/task/complete';
          message = 'Task completed successfully';
          break;

        case 'start':
          url = '/task/start';
          message = 'Task started successfully';
          break;
      }

      this.$q.loading.show();
      api
        .put(url, { id: this.taskInformation.id, taskId: this.taskInformation.id })
        .then(() => {
          this.$bus.emit('reloadTaskList');
          this.$emit('closeDialog');

          this.$q.notify({
            message,
            color: 'positive',
            position: 'top',
            timeout: 2000,
          });
        })
        .catch((error) => {
          this.handleAxiosError(error);
        })
        .finally(() => {
          this.$q.loading.hide();
        });
    },
    updateData() {
      this.loading = true;

      // Prepare the data with correct types
      const updateData = {
        title: this.form.title,
        description: this.form.description,
        assignee: this.form.assignee,
        dueDate: this.form.dueDateString || null,
        projectId: this.form.project || null,
        // Convert to numbers - API expects numbers for these fields
        priorityLevel: this.form.priorityLevel !== null ? Number(this.form.priorityLevel) : null,
        difficultyLevel:
          this.form.difficultyLevel !== null ? Number(this.form.difficultyLevel) : null,
      };

      api
        .put(`/task?id=${this.taskInformation.id}`, updateData)
        .then(() => {
          this.$bus.emit('reloadTaskList');
          this.$emit('closeDialog');

          this.$q.notify({
            message: 'Task updated successfully',
            color: 'positive',
            position: 'top',
            timeout: 2000,
          });
        })
        .catch((error) => {
          this.handleAxiosError(error);
        })
        .finally(() => {
          this.loading = false;
        });
    },
    handleWorkflowAction(event) {
      // Refresh task data after workflow action
      this.$emit('refreshTask');
      
      // Show notification (skip for liquidation approvals - handled by LiquidationApprovalDialog)
      const isLiquidationApproval = event.transition?.dialogType === 'liquidation_approval';
      if (!isLiquidationApproval) {
        this.$q.notify({
          type: 'positive',
          message: `Task ${event.transition?.buttonLabel?.toLowerCase() || 'action'} completed successfully`,
          icon: 'check_circle'
        });
      }
      
      // Mark task as completed if workflow transition was performed (skip for liquidation approvals)
      if (event.transition && !isLiquidationApproval) {
        this.updateTaskStatus('complete');
      }
    },
  },
};
</script>

<style scoped lang="scss">
// Use Quasar CSS variables for consistency
$md3-surface: var(--q-bg-page, #ffffff);
$md3-surface-container: var(--q-bg-secondary, #f5f5f5);
$md3-surface-container-high: var(--q-bg-tertiary, #f0f0f0);
$md3-on-surface: var(--q-text-primary, #1c1b1f);
$md3-on-surface-variant: var(--q-text-secondary, #49454f);
$md3-outline: var(--q-text-caption, #79747e);
$md3-outline-variant: var(--q-separator-color, #e0e0e0);
$md3-primary: var(--q-primary);
$md3-on-primary: #ffffff;
$md3-error: var(--q-negative, #ba1a1a);
$md3-on-error: #ffffff;
$md3-error-container: #ffdad6;
$md3-on-error-container: #410002;

.task-form-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}

// Scrollable content area
.form-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  padding-bottom: 100px; // Extra padding to ensure content doesn't get hidden behind action bar

  @media (max-width: 768px) {
    padding: 16px;
    padding-bottom: 100px;
  }

  // Custom scrollbar
  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: $md3-surface;
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: $md3-outline-variant;
    border-radius: 4px;

    &:hover {
      background: $md3-outline;
    }
  }
}

// Creator banner
.creator-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  margin: -24px -24px 24px -24px;
  background-color: $md3-error-container;
  color: $md3-on-error-container;
  font-weight: 500;

  @media (max-width: 768px) {
    margin: -16px -16px 16px -16px;
    padding: 8px 12px;
    font-size: 14px;
  }

  .q-icon {
    color: $md3-error;
  }
}

// Fixed action bar
.action-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: $md3-surface;
  border-top: 1px solid $md3-outline-variant;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.1);
  z-index: 10;
}

.action-bar-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  gap: 16px;

  @media (max-width: 768px) {
    padding: 12px 16px;
    flex-direction: column;
    gap: 12px;
  }
}

.status-actions,
.primary-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;

  @media (max-width: 768px) {
    width: 100%;
    justify-content: center;
    flex-direction: column;
  }
}

// Material Design 3 button styling
.action-button {
  font-weight: 500;
  letter-spacing: 0.1px;
  padding: 0 24px;
  height: 40px;
  border-radius: 20px;
  transition: all 0.2s ease;

  @media (max-width: 768px) {
    padding: 0 16px;
    height: 36px;
    font-size: 13px;

    .q-icon {
      font-size: 18px !important;
    }
  }

  // Primary filled button
  &.primary {
    // No shadow effects
    &:hover:not([disabled]) {
      filter: brightness(0.92);
    }
  }

  // Icon adjustments
  .q-icon {
    font-size: 20px;
  }

  // Loading state
  &.q-btn--loading {
    .q-btn__content {
      opacity: 0;
    }
  }
}

// Responsive adjustments
@media (max-width: 599px) {
  .form-content {
    padding-bottom: 140px; // More padding for stacked buttons
  }

  .action-button {
    width: 100%;
  }

  .action-bar-content {
    .status-actions {
      order: 2;
    }

    .primary-actions {
      order: 1;
      width: 100%;


    }
  }
}

// Label styling to match GInput labels
.label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  letter-spacing: 0.00937em;
  color: rgba(0, 0, 0, 0.6);
  margin-bottom: 4px;
}

// Fake field styling to match Quasar input fields
.fake-field {
  width: 100%;
  padding: 8px 14px;
  border: 1px solid rgba(0, 0, 0, 0.24);
  border-radius: 4px;
  height: 40px;
  background-color: transparent;
  font-size: 16px;
  line-height: 24px;
  font-weight: 400;
  letter-spacing: 0.00937em;
  color: rgba(0, 0, 0, 0.87);
  transition: border-color 0.36s cubic-bezier(0.4, 0, 0.2, 1);
  box-sizing: border-box;
  display: flex;
  align-items: center;
  
  &:hover {
    border-color: rgba(0, 0, 0, 0.87);
  }
}

// Dark mode support
.body--dark {
  .form-content {
    &::-webkit-scrollbar-track {
      background: #1e1e1e;
    }

    &::-webkit-scrollbar-thumb {
      background: #4a4a4a;

      &:hover {
        background: #5a5a5a;
      }
    }
  }

  .creator-banner {
    background-color: rgba($md3-error, 0.15);
    color: #ff8a80;

    .q-icon {
      color: #ff8a80;
    }
  }

  .action-bar {
    background-color: #1e1e1e;
    border-top-color: #3a3a3a;
    box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.3);
  }
  
  // Dark mode label and fake field
  .label {
    color: rgba(255, 255, 255, 0.7);
  }
  
  .fake-field {
    color: rgba(255, 255, 255, 0.87);
    border-color: rgba(255, 255, 255, 0.24);
    
    &:hover {
      border-color: rgba(255, 255, 255, 0.7);
    }
  }
}
</style>
