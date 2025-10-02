<template>
  <div class="task-other-info-container">
    <!-- Task Details Section -->
    <div class="info-section">
      <h3 class="section-title text-title-small">Task Details</h3>
      
      <div class="info-card surface-container">
        <!-- Title -->
        <div class="info-item">
          <q-icon name="o_title" class="info-icon" />
          <div class="info-content">
            <div class="info-label text-label-medium">Title</div>
            <div class="info-value text-body-medium">{{ taskInformation.title }}</div>
          </div>
        </div>

        <!-- Project -->
        <div class="info-item">
          <q-icon name="o_folder" class="info-icon" />
          <div class="info-content">
            <div class="info-label text-label-medium">Project</div>
            <div class="info-value text-body-medium">
              <q-chip 
                v-if="taskInformation.project"
                dense
                class="project-chip"
                text-color="primary"
                color="primary"
                outline
              >
                {{ taskInformation.project.name }}
              </q-chip>
              <span v-else class="text-grey-6">No Project</span>
            </div>
          </div>
        </div>

        <!-- Status -->
        <div class="info-item">
          <q-icon name="o_pending_actions" class="info-icon" />
          <div class="info-content">
            <div class="info-label text-label-medium">Status</div>
            <div class="info-value text-body-medium">
              <q-badge 
                :color="getStatusColor(taskInformation.boardLane?.key?.value)"
                text-color="white"
                class="status-badge"
              >
                {{ taskInformation.boardLane?.key?.label || 'Unknown' }}
              </q-badge>
            </div>
          </div>
        </div>

        <!-- Priority -->
        <div class="info-item">
          <q-icon name="o_flag" class="info-icon" :class="getPriorityClass(taskInformation.priorityLevel?.value)" />
          <div class="info-content">
            <div class="info-label text-label-medium">Priority Level</div>
            <div class="info-value text-body-medium">
              <q-chip 
                v-if="taskInformation.priorityLevel"
                dense
                :color="getPriorityColor(taskInformation.priorityLevel.value)"
                text-color="white"
                class="priority-chip"
              >
                {{ taskInformation.priorityLevel.label }}
              </q-chip>
              <span v-else class="text-grey-6">No Priority</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Assignment Section -->
    <div class="info-section">
      <h3 class="section-title text-title-small">Assignment</h3>
      
      <div class="info-card surface-container">
        <!-- Assignee -->
        <div class="info-item">
          <q-icon name="o_person" class="info-icon" />
          <div class="info-content">
            <div class="info-label text-label-medium">Assignee</div>
            <div class="info-value text-body-medium">
              <div v-if="taskInformation.assignedTo" class="user-info">
                <q-avatar size="24px" class="q-mr-sm">
                  <img 
                    v-if="taskInformation.assignedTo.image" 
                    :src="taskInformation.assignedTo.image" 
                  />
                  <template v-else>
                    {{ getInitials(taskInformation.assignedTo) }}
                  </template>
                </q-avatar>
                {{ taskInformation.assignedTo.firstName }} {{ taskInformation.assignedTo.lastName }}
              </div>
              <span v-else class="text-grey-6">No Assignee Yet</span>
            </div>
          </div>
        </div>

        <!-- Created By -->
        <div class="info-item">
          <q-icon name="o_person_add" class="info-icon" />
          <div class="info-content">
            <div class="info-label text-label-medium">Created By</div>
            <div class="info-value text-body-medium">
              <div v-if="taskInformation.createdBy" class="user-info">
                <q-avatar size="24px" class="q-mr-sm">
                  <img 
                    v-if="taskInformation.createdBy.image" 
                    :src="taskInformation.createdBy.image" 
                  />
                  <template v-else>
                    {{ getInitials(taskInformation.createdBy) }}
                  </template>
                </q-avatar>
                {{ taskInformation.createdBy.firstName }} {{ taskInformation.createdBy.lastName }}
              </div>
              <span v-else class="text-grey-6">Unknown</span>
            </div>
          </div>
        </div>

        <!-- Difficulty (Creator) -->
        <div class="info-item">
          <q-icon name="o_speed" class="info-icon" />
          <div class="info-content">
            <div class="info-label text-label-medium">Difficulty (Creator)</div>
            <div class="info-value text-body-medium">
              <q-linear-progress 
                v-if="taskInformation.assignedByDifficultySet"
                :value="getDifficultyValue(taskInformation.assignedByDifficultySet.value)"
                :color="getDifficultyColor(taskInformation.assignedByDifficultySet.value)"
                size="20px"
                class="difficulty-bar"
              >
                <div class="absolute-full flex flex-center">
                  <q-badge color="white" text-color="black" :label="taskInformation.assignedByDifficultySet.label" />
                </div>
              </q-linear-progress>
              <span v-else class="text-grey-6">Not Set</span>
            </div>
          </div>
        </div>

        <!-- Difficulty (Assignee) -->
        <div class="info-item">
          <q-icon name="o_psychology" class="info-icon" />
          <div class="info-content">
            <div class="info-label text-label-medium">Difficulty (Assignee)</div>
            <div class="info-value text-body-medium">
              <q-linear-progress 
                v-if="taskInformation.assignedToDifficultySet"
                :value="getDifficultyValue(taskInformation.assignedToDifficultySet.value)"
                :color="getDifficultyColor(taskInformation.assignedToDifficultySet.value)"
                size="20px"
                class="difficulty-bar"
              >
                <div class="absolute-full flex flex-center">
                  <q-badge color="white" text-color="black" :label="taskInformation.assignedToDifficultySet.label" />
                </div>
              </q-linear-progress>
              <span v-else class="text-grey-6">Not Set</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Timeline Section -->
    <div class="info-section">
      <h3 class="section-title text-title-small">Timeline</h3>
      
      <div class="info-card surface-container">
        <!-- Creation Date -->
        <div class="info-item">
          <q-icon name="o_calendar_today" class="info-icon" />
          <div class="info-content">
            <div class="info-label text-label-medium">Creation Date</div>
            <div class="info-value text-body-medium">
              <div v-if="taskInformation.createdAt">
                <div class="date-primary">{{ taskInformation.createdAt.dateTime }}</div>
                <div class="date-secondary text-caption text-grey-6">{{ taskInformation.createdAt.timeAgo }}</div>
              </div>
              <span v-else class="text-grey-6">-</span>
            </div>
          </div>
        </div>

        <!-- Due Date -->
        <div class="info-item">
          <q-icon name="o_event" class="info-icon" :class="{ 'text-negative': isOverdue }" />
          <div class="info-content">
            <div class="info-label text-label-medium">Due Date</div>
            <div class="info-value text-body-medium">
              <div v-if="taskInformation.dueDate" :class="{ 'text-negative': isOverdue }">
                <div class="date-primary">{{ taskInformation.dueDate.dateFull }}</div>
                <div class="date-secondary text-caption" :class="dueDateClass">
                  {{ getDueDateStatus() }}
                </div>
              </div>
              <span v-else class="text-grey-6">No Due Date</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'TaskOtherInformation',
  props: {
    taskInformation: {
      type: Object,
      required: true,
    },
  },
  computed: {
    isOverdue() {
      if (!this.taskInformation.dueDate?.raw) return false;
      return new Date(this.taskInformation.dueDate.raw) < new Date();
    },
    dueDateClass() {
      if (this.isOverdue) return 'text-negative';
      const daysUntilDue = this.getDaysUntilDue();
      if (daysUntilDue <= 3) return 'text-warning';
      return 'text-grey-6';
    },
  },
  methods: {
    getStatusColor(status) {
      const statusColors = {
        'TODO': 'grey-6',
        'IN_PROGRESS': 'primary',
        'IN_REVIEW': 'orange',
        'DONE': 'positive',
        'BLOCKED': 'negative',
      };
      return statusColors[status] || 'grey-5';
    },
    getPriorityColor(priority) {
      const priorityColors = {
        'HIGHEST': 'red-9',
        'HIGH': 'orange-8',
        'MEDIUM': 'yellow-8',
        'LOW': 'green-7',
        'LOWEST': 'grey-6',
      };
      return priorityColors[priority] || 'grey-5';
    },
    getPriorityClass(priority) {
      const priorityClasses = {
        'HIGHEST': 'text-red-9',
        'HIGH': 'text-orange-8',
        'MEDIUM': 'text-yellow-8',
        'LOW': 'text-green-7',
        'LOWEST': 'text-grey-6',
      };
      return priorityClasses[priority] || '';
    },
    getDifficultyValue(difficulty) {
      const difficultyValues = {
        'EASY': 0.33,
        'MEDIUM': 0.66,
        'HARD': 1,
      };
      return difficultyValues[difficulty] || 0;
    },
    getDifficultyColor(difficulty) {
      const difficultyColors = {
        'EASY': 'green',
        'MEDIUM': 'orange',
        'HARD': 'red',
      };
      return difficultyColors[difficulty] || 'grey';
    },
    getInitials(user) {
      if (!user) return '';
      const first = user.firstName?.charAt(0) || '';
      const last = user.lastName?.charAt(0) || '';
      return (first + last).toUpperCase();
    },
    getDaysUntilDue() {
      if (!this.taskInformation.dueDate?.raw) return null;
      const dueDate = new Date(this.taskInformation.dueDate.raw);
      const today = new Date();
      const diffTime = dueDate - today;
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    },
    getDueDateStatus() {
      if (this.isOverdue) {
        const daysOverdue = Math.abs(this.getDaysUntilDue());
        return `${daysOverdue} day${daysOverdue !== 1 ? 's' : ''} overdue`;
      }
      const daysUntilDue = this.getDaysUntilDue();
      if (daysUntilDue === 0) return 'Due today';
      if (daysUntilDue === 1) return 'Due tomorrow';
      if (daysUntilDue <= 7) return `Due in ${daysUntilDue} days`;
      return this.taskInformation.dueDate.timeAgo;
    },
  },
};
</script>

<style scoped lang="scss">
// Material Design 3 color tokens
$md3-surface: #ffffff;
$md3-surface-container: #f5f5f5;
$md3-surface-container-high: #f0f0f0;
$md3-on-surface: #1c1b1f;
$md3-on-surface-variant: #49454f;
$md3-outline: #79747e;
$md3-outline-variant: #e0e0e0;

.task-other-info-container {
  padding: 16px;
  max-height: calc(100vh - 200px);
  overflow-y: auto;
  
  // Custom scrollbar
  &::-webkit-scrollbar {
    width: 8px;
  }
  
  &::-webkit-scrollbar-track {
    background: $md3-surface-container;
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

.info-section {
  margin-bottom: 24px;
  
  &:last-child {
    margin-bottom: 0;
  }
}

.section-title {
  color: $md3-on-surface;
  margin: 0 0 12px 0;
  padding-left: 4px;
}

.info-card {
  border-radius: 12px;
  padding: 16px;
  transition: all 0.3s ease;
  
  &.surface-container {
    background-color: $md3-surface-container;
    border: 1px solid $md3-outline-variant;
  }
}

.info-item {
  display: flex;
  align-items: flex-start;
  padding: 12px 0;
  border-bottom: 1px solid $md3-outline-variant;
  transition: background-color 0.2s ease;
  
  &:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }
  
  &:first-child {
    padding-top: 0;
  }
  
  &:hover {
    background-color: rgba($md3-on-surface, 0.04);
    margin: 0 -16px;
    padding-left: 16px;
    padding-right: 16px;
  }
}

.info-icon {
  font-size: 20px;
  color: $md3-on-surface-variant;
  margin-right: 16px;
  margin-top: 2px;
  transition: color 0.2s ease;
  
  .info-item:hover & {
    color: var(--q-primary);
  }
}

.info-content {
  flex: 1;
  min-width: 0; // Prevent overflow
}

.info-label {
  color: $md3-on-surface-variant;
  margin-bottom: 4px;
}

.info-value {
  color: $md3-on-surface;
  word-break: break-word;
}

.user-info {
  display: flex;
  align-items: center;
  
  .q-avatar {
    border: 2px solid $md3-outline-variant;
    background-color: $md3-surface-container-high;
    font-weight: 500;
    color: $md3-on-surface;
  }
}

.project-chip {
  font-size: 12px;
  height: 24px;
  
  .q-chip__content {
    padding: 0 8px;
  }
}

.status-badge {
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.priority-chip {
  font-size: 12px;
  height: 24px;
  font-weight: 500;
  
  .q-chip__content {
    padding: 0 8px;
  }
}

.difficulty-bar {
  border-radius: 10px;
  margin-top: 8px;
  
  .q-badge {
    font-size: 11px;
    padding: 2px 8px;
    font-weight: 500;
  }
}

.date-primary {
  font-weight: 500;
}

.date-secondary {
  margin-top: 2px;
}

// Responsive design
@media (max-width: 599px) {
  .task-other-info-container {
    padding: 12px;
  }
  
  .info-card {
    padding: 12px;
  }
  
  .info-icon {
    font-size: 18px;
    margin-right: 12px;
  }
  
  .section-title {
    font-size: 14px;
  }
}

// Dark mode support
.body--dark {
  .info-card.surface-container {
    background-color: #1e1e1e;
    border-color: #3a3a3a;
  }
  
  .info-item {
    border-bottom-color: #3a3a3a;
    
    &:hover {
      background-color: rgba(255, 255, 255, 0.04);
    }
  }
  
  .info-label {
    color: #b0b0b0;
  }
  
  .info-value {
    color: #e0e0e0;
  }
  
  .info-icon {
    color: #888;
  }
  
  .user-info .q-avatar {
    border-color: #3a3a3a;
    background-color: #2a2a2a;
  }
  
  .task-other-info-container {
    &::-webkit-scrollbar-track {
      background: #2a2a2a;
    }
    
    &::-webkit-scrollbar-thumb {
      background: #4a4a4a;
      
      &:hover {
        background: #5a5a5a;
      }
    }
  }
}
</style>
