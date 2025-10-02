<template>
  <q-dialog
    ref="dialog"
    @before-show="fetchData"
    :maximized="$q.platform.is.mobile"
    :transition-show="$q.platform.is.mobile ? 'slide-up' : 'fade'"
    :transition-hide="$q.platform.is.mobile ? 'slide-down' : 'fade'"
  >
    <q-card class="task-dialog-card" :class="{ 'mobile-fullscreen': $q.platform.is.mobile }">
      <!-- MD3 Header -->
      <div class="dialog-header">
        <div class="header-content">
          <q-btn
            v-if="$q.platform.is.mobile"
            flat
            round
            dense
            icon="arrow_back"
            class="header-action"
            v-close-popup
          />
          <div class="header-title">
            <h2 class="text-h6">
              <span v-if="taskInformation.id" class="task-id">#{{ taskInformation.id }} - </span>
              {{ taskInformation.title }}
            </h2>
            <div class="text-caption text-grey-7" v-if="taskInformation.project">
              {{ taskInformation.project.name }}
            </div>
          </div>
          <q-space />
          <discussion-button
            v-if="taskInformation.id && !hideDiscussionButton"
            flat
            round
            icon="o_comment"
            size="md"
            class="header-action q-mr-sm"
            :data="discussionData"
          />
          <q-btn
            v-if="!$q.platform.is.mobile"
            flat
            round
            dense
            icon="close"
            class="header-action"
            v-close-popup
          />
        </div>
      </div>

      <!-- MD3 Tab Navigation -->
      <div class="tab-navigation">
        <q-tabs
          v-model="activeTab"
          dense
          class="task-tabs"
          :indicator-color="$q.platform.is.mobile ? 'primary' : 'transparent'"
          active-class="tab-active"
          :align="$q.platform.is.mobile ? 'justify' : 'left'"
        >
          <q-tab
            v-for="tab in tabList"
            :key="tab.key"
            :name="tab.key"
            class="task-tab"
          >
            <div class="tab-content">
              <q-icon :name="tab.icon" size="20px" />
              <span class="tab-label" v-if="!$q.platform.is.mobile || $q.screen.width > 400">
                {{ tab.name }}
              </span>
            </div>
          </q-tab>
        </q-tabs>
      </div>

      <!-- Content Area -->
      <q-card-section class="dialog-body">
        <q-tab-panels
          v-model="activeTab"
          animated
          transition-prev="slide-right"
          transition-next="slide-left"
          class="tab-panels"
        >
          <!-- Information Tab -->
          <q-tab-panel name="information" class="q-pa-none">
            <div class="panel-content form-panel">
              <task-information-form
                @closeDialog="$refs.dialog.hide()"
                ref="taskInformationForm"
                :taskInformation="taskInformation"
              />
            </div>
          </q-tab-panel>

          <!-- Other Information Tab / Workflow Details -->
          <q-tab-panel name="other_information" class="q-pa-none">
            <div class="panel-content">
              <!-- Show workflow details if it's a workflow task -->
              <workflow-details 
                v-if="isWorkflowTask"
                :taskInformation="taskInformation" 
                @view-image="handleViewImage"
              />
              <!-- Show regular task info otherwise -->
              <task-other-information 
                v-else
                :taskInformation="taskInformation" 
              />
            </div>
          </q-tab-panel>

          <!-- Collaborators Tab -->
          <q-tab-panel name="collaborators" class="q-pa-none">
            <div class="panel-content">
              <task-collaborators :taskInformation="taskInformation" />
            </div>
          </q-tab-panel>

          <!-- Attachments Tab -->
          <q-tab-panel name="attachments" class="q-pa-none">
            <div class="panel-content">
              <file-manager
                :fileList="taskInformation.attachments"
                :fileType="'task'"
                :taskId="taskInformation.id"
                :projectId="taskInformation.project?.id"
              />
            </div>
          </q-tab-panel>
        </q-tab-panels>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<style scoped lang="scss">
// Material Design 3 Design Tokens (using app colors)
$md3-surface: #ffffff;
$md3-surface-container: #f5f5f5;
$md3-surface-container-high: #f0f0f0;
$md3-on-surface: #1c1b1f;
$md3-on-surface-variant: #49454f;
$md3-outline: #79747e;
$md3-outline-variant: #e0e0e0;
$md3-primary: var(--q-primary);
$md3-on-primary: #ffffff;
$md3-primary-container: #e3f2fd;
$md3-on-primary-container: #0d47a1;
$md3-secondary-container: #f3e5f5;
$md3-elevation-1: 0px 1px 3px rgba(0, 0, 0, 0.12), 0px 1px 2px rgba(0, 0, 0, 0.24);
$md3-elevation-2: 0px 3px 6px rgba(0, 0, 0, 0.16), 0px 3px 6px rgba(0, 0, 0, 0.23);

// Dialog Card Base
.task-dialog-card {
  width: 840px;
  max-width: calc(100vw - 48px);
  height: 680px; // Fixed height
  max-height: calc(100vh - 48px);
  border-radius: 28px;
  background-color: $md3-surface-container;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: $md3-elevation-2;

  &.mobile-fullscreen {
    width: 100vw;
    height: 100dvh;
    max-width: 100vw;
    max-height: 100dvh;
    margin: 0;
    border-radius: 0;
  }
}

// MD3 Header
.dialog-header {
  background-color: $md3-surface;
  border-bottom: 1px solid $md3-outline-variant;
  padding: 0;

  .header-content {
    display: flex;
    align-items: center;
    padding: 4px;
    min-height: 64px;

    @media (max-width: 768px) {
      min-height: 56px;
    }
  }

  .header-action {
    margin: 0 4px;
    color: $md3-on-surface-variant;
  }

  .header-title {
    flex: 1;
    padding: 0 16px;

    h2 {
      margin: 0;
      font-weight: 400;
      color: $md3-on-surface;
      line-height: 1.2;
    }

    .text-caption {
      margin-top: 2px;
    }
  }
}

// MD3 Tab Navigation
.tab-navigation {
  background-color: $md3-surface;
  border-bottom: 1px solid $md3-outline-variant;
  position: sticky;
  top: 0;
  z-index: 100;
}

.task-tabs {
  height: 48px;

  :deep(.q-tabs__content) {
    height: 100%;
  }

  :deep(.q-tab__indicator) {
    height: 3px;
    border-radius: 3px 3px 0 0;
  }
}

.task-tab {
  min-height: 48px;
  padding: 0 24px;
  text-transform: none;
  font-weight: 500;
  color: $md3-on-surface-variant;

  @media (max-width: 768px) {
    padding: 0 16px;
    flex: 1;
  }

  .tab-content {
    display: flex;
    align-items: center;
    gap: 8px;

    .q-icon {
      color: inherit;
    }
  }

  .tab-label {
    font-size: 14px;
    white-space: nowrap;

    @media (max-width: 400px) {
      display: none;
    }
  }

  &.tab-active {
    color: $md3-primary;

    :deep(.q-focus-helper) {
      background-color: rgba($md3-primary, 0.12);
    }
  }

  &:hover:not(.tab-active) {
    color: $md3-on-surface;

    :deep(.q-focus-helper) {
      background-color: rgba($md3-on-surface, 0.08);
    }
  }
}

// Content Area
.dialog-body {
  flex: 1;
  padding: 0;
  background-color: $md3-surface;
  overflow: hidden;

  .tab-panels {
    height: 100%;
    background-color: transparent;
  }

  .panel-content {
    height: 100%;
    display: flex;
    flex-direction: column;

    // For form tabs that need fixed bottom buttons
    &.form-panel {
      padding: 0;
    }

    // For regular content panels
    &:not(.form-panel) {
      padding: 24px;
      overflow-y: auto;

      @media (max-width: 768px) {
        padding: 16px;
      }
    }

    // Custom scrollbar
    &::-webkit-scrollbar {
      width: 8px;
    }

    &::-webkit-scrollbar-track {
      background: $md3-surface;
    }

    &::-webkit-scrollbar-thumb {
      background-color: $md3-outline-variant;
      border-radius: 4px;

      &:hover {
        background-color: $md3-outline;
      }
    }
  }
}

// Mobile specific adjustments
@media (max-width: 768px) {
  .task-dialog-card {
    &.mobile-fullscreen {
      .dialog-body {
        // Account for header and tabs
        height: calc(100vh - 56px - 48px);

        .panel-content {
          height: 100%;
        }
      }
    }
  }
}

// Animation improvements
:deep(.q-tab-panel) {
  padding: 0;
}

// Focus states
.header-action,
.task-tab {
  position: relative;

  &:focus-visible {
    outline: 2px solid $md3-primary;
    outline-offset: 2px;
  }
}

// Elevation on scroll (optional enhancement)
.tab-navigation {
  transition: box-shadow 0.2s ease;

  &.elevated {
    box-shadow: $md3-elevation-1;
  }
}
</style>

<script>
import TaskCollaborators from './tabs/TaskCollaborators.vue';
import TaskOtherInformation from './tabs/TaskOtherInformation.vue';
import TaskInformationForm from './tabs/TaskInformationForm.vue';
import WorkflowDetails from './tabs/WorkflowDetails.vue';
import FileManager from "../../../components/upload/FileManager.vue";
import DiscussionButton from 'src/components/shared/discussion/DiscussionButton.vue';
import { DiscussionModule } from 'src/components/shared/discussion/DiscussionProps';

export default {
  name: 'TaskInformationDialog',
  props: {
    taskInformation: Object,
    hideDiscussionButton: {
      type: Boolean,
      default: false,
    },
  },
  components: {
    FileManager,
    TaskCollaborators,
    TaskOtherInformation,
    TaskInformationForm,
    WorkflowDetails,
    DiscussionButton,
  },
  data: () => ({
    form: {},
    asigneeId: null,
    creatorId: null,
    permissions: {},
    activeTab: 'information',
    showDiscussion: true,
    DiscussionModule: DiscussionModule,
    taskRelatedIds: [],
  }),
  watch: {},
  computed: {
    discussionData() {
      return {
        discussionTitle: `Task: ${this.taskInformation.title}`,
        discussionModule: this.DiscussionModule.Task,
        targetId: this.taskInformation.id,
        fromNotification: false,
        defaultWatcherIds: this.taskRelatedIds,
        syncWatchers: true,
      };
    },
    isWorkflowTask() {
      return !!this.taskInformation?.workflowInstanceId;
    },
    tabList() {
      // Dynamic tab list based on whether it's a workflow task
      const tabs = [
        {
          key: 'information',
          name: 'Information',
          icon: 'o_info',
        },
        {
          key: 'other_information',
          name: this.isWorkflowTask ? 'More Details' : 'More Info',
          icon: this.isWorkflowTask ? 'o_more_horiz' : 'o_more_horiz',
        },
        {
          key: 'collaborators',
          name: 'Collaborators',
          icon: 'o_group',
        },
        {
          key: 'attachments',
          name: 'Attachments',
          icon: 'o_attach_file',
        },
      ];
      return tabs;
    },
  },
  methods: {
    async fetchTaskRelatedIds() {
      if (!this.taskInformation.id) return;

      try {
        const ids = [];

        // Add creator ID
        if (this.taskInformation.createdById) {
          ids.push(this.taskInformation.createdById);
        } else if (this.taskInformation.createdBy?.id) {
          ids.push(this.taskInformation.createdBy.id);
        }

        // Add assignee ID
        if (this.taskInformation.assignedToId) {
          ids.push(this.taskInformation.assignedToId);
        } else if (this.taskInformation.assignedTo?.id) {
          ids.push(this.taskInformation.assignedTo.id);
        }

        // Fetch task collaborators/watchers using the instance's $api
        const response = await this.$api.get(`/task/collaborators?taskId=${this.taskInformation.id}`);
        if (response.data && response.data.items) {
          const collaboratorIds = response.data.items.map(collaborator => collaborator.id);
          ids.push(...collaboratorIds);
        }

        // Remove duplicates and empty values
        this.taskRelatedIds = [...new Set(ids.filter(id => id))];
      } catch (error) {
        console.error('Failed to fetch task-related IDs:', error);
        // Fallback to just creator and assignee
        const ids = [];
        if (this.taskInformation.createdById) ids.push(this.taskInformation.createdById);
        if (this.taskInformation.createdBy?.id) ids.push(this.taskInformation.createdBy.id);
        if (this.taskInformation.assignedToId) ids.push(this.taskInformation.assignedToId);
        if (this.taskInformation.assignedTo?.id) ids.push(this.taskInformation.assignedTo.id);
        this.taskRelatedIds = [...new Set(ids.filter(id => id))];
      }
    },
    async fetchData() {
      this.activeTab = 'information';
      
      // Fetch fresh task data to include workflow information
      if (this.taskInformation && this.taskInformation.id) {
        try {
          const response = await this.$api.get(`/task?id=${this.taskInformation.id}`);
          if (response.data) {
            console.log('Fresh task data fetched:', {
              id: response.data.id,
              workflowInstanceId: response.data.workflowInstanceId,
              WorkflowTask: response.data.WorkflowTask,
              taskType: response.data.taskType
            });
            // Update taskInformation with fresh data including workflowInstanceId
            Object.assign(this.taskInformation, response.data);
          }
        } catch (error) {
          console.error('Failed to fetch fresh task data:', error);
        }
      }
      
      await this.fetchTaskRelatedIds();
    },
    handleViewImage(image) {
      // Handle image viewing - could open in a modal or new tab
      if (image && image.url) {
        window.open(image.url, '_blank');
      }
    },
  },
};
</script>
