<template>
  <div class="workflow-timeline">
    <!-- Loading State -->
    <div v-if="loading" class="text-center q-pa-lg">
      <q-spinner size="50px" color="primary" />
      <div class="text-grey-6 q-mt-md">Loading workflow timeline...</div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="text-center q-pa-lg">
      <q-icon name="error_outline" size="48px" color="negative" />
      <div class="text-negative q-mt-md">{{ error }}</div>
    </div>

    <!-- Timeline Content -->
    <q-timeline v-else :layout="layout" color="primary">
      <q-timeline-entry
        v-for="(item, index) in timelineItems"
        :key="item.id"
        :title="item.title"
        :subtitle="item.subtitle"
        :color="item.color"
        :icon="item.icon"
        :side="layout === 'comfortable' ? (index % 2 === 0 ? 'left' : 'right') : undefined"
      >
        <!-- Stage Badge -->
        <div class="q-mb-sm" v-if="item.stage">
          <workflow-status-badge
            :stage="item.stage"
            size="sm"
            dense
          />
        </div>

        <!-- Timeline Content -->
        <div class="timeline-content">
          <!-- Action Description -->
          <div class="text-body2 q-mb-xs">
            {{ item.description }}
          </div>

          <!-- Metadata -->
          <div v-if="item.metadata" class="timeline-metadata q-mt-sm">
            <div v-if="item.metadata.remarks" class="q-mb-xs">
              <span class="text-weight-medium">Remarks:</span>
              <span class="text-grey-7 q-ml-xs">{{ item.metadata.remarks }}</span>
            </div>
            <div v-if="item.metadata.reason" class="q-mb-xs">
              <span class="text-weight-medium">Reason:</span>
              <span class="text-grey-7 q-ml-xs">{{ item.metadata.reason }}</span>
            </div>
          </div>

          <!-- User Info -->
          <div v-if="item.user" class="timeline-user q-mt-sm">
            <q-chip dense size="sm" color="grey-3">
              <q-avatar size="20px">
                <q-icon name="person" />
              </q-avatar>
              <span class="text-caption">{{ item.user }}</span>
            </q-chip>
          </div>

          <!-- Timestamp -->
          <div class="text-caption text-grey-6 q-mt-sm">
            {{ formatDateTime(item.timestamp) }}
          </div>
        </div>
      </q-timeline-entry>

      <!-- Current Stage Indicator -->
      <q-timeline-entry
        v-if="showCurrentStage && currentStage"
        title="Current Stage"
        color="warning"
        icon="hourglass_empty"
      >
        <workflow-status-badge
          :stage="currentStage"
          size="md"
        />
        <div class="text-caption text-grey-6 q-mt-sm">
          Awaiting action...
        </div>
      </q-timeline-entry>
    </q-timeline>

    <!-- Empty State -->
    <div v-if="!loading && !error && timelineItems.length === 0" class="text-center q-pa-lg">
      <q-icon name="timeline" size="48px" color="grey-5" />
      <div class="text-grey-6 q-mt-md">No timeline events available</div>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref, computed, onMounted, watch, onUnmounted } from 'vue';
import WorkflowService from '../../services/workflow.service';
import WorkflowStatusBadge from './WorkflowStatusBadge.vue';
import { date } from 'quasar';

export default defineComponent({
  name: 'WorkflowTimeline',
  components: {
    WorkflowStatusBadge
  },
  props: {
    workflowInstanceId: {
      type: [Number, String],
      required: true
    },
    layout: {
      type: String,
      default: 'dense', // 'dense', 'comfortable', 'loose'
      validator: (value) => ['dense', 'comfortable', 'loose'].includes(value)
    },
    showCurrentStage: {
      type: Boolean,
      default: true
    },
    autoRefresh: {
      type: Boolean,
      default: false
    },
    refreshInterval: {
      type: Number,
      default: 30000 // 30 seconds
    }
  },
  emits: ['timeline-loaded', 'error'],
  setup(props, { emit }) {
    const loading = ref(false);
    const error = ref(null);
    const timeline = ref([]);
    const workflowInstance = ref(null);
    let refreshTimer = null;

    // Computed properties
    const timelineItems = computed(() => {
      return timeline.value.map(item => ({
        id: item.id,
        title: getEventTitle(item),
        subtitle: getEventSubtitle(item),
        description: getEventDescription(item),
        color: getEventColor(item),
        icon: getEventIcon(item),
        stage: item.toStage || item.fromStage,
        user: formatUserName(item.performedBy),
        timestamp: item.performedAt || item.createdAt,
        metadata: item.metadata
      }));
    });

    const currentStage = computed(() => {
      return workflowInstance.value?.currentStage || null;
    });

    // Helper functions
    const getEventTitle = (item) => {
      switch (item.eventType) {
        case 'WORKFLOW_STARTED':
          return 'Workflow Started';
        case 'STAGE_ENTERED':
          return 'Stage Entered';
        case 'STAGE_EXITED':
          return 'Stage Completed';
        case 'TRANSITION_EXECUTED':
          return item.action || 'Transition';
        case 'WORKFLOW_COMPLETED':
          return 'Workflow Completed';
        case 'WORKFLOW_CANCELLED':
          return 'Workflow Cancelled';
        case 'TASK_CREATED':
          return 'Task Created';
        case 'TASK_COMPLETED':
          return 'Task Completed';
        default:
          return item.eventType || 'Event';
      }
    };

    const getEventSubtitle = (item) => {
      if (item.toStage) {
        return `Moved to ${item.toStage.name}`;
      }
      if (item.fromStage) {
        return `From ${item.fromStage.name}`;
      }
      return '';
    };

    const getEventDescription = (item) => {
      switch (item.eventType) {
        case 'WORKFLOW_STARTED':
          return 'Workflow instance has been initiated';
        case 'TRANSITION_EXECUTED':
          if (item.action === 'APPROVE') {
            return 'Request has been approved';
          } else if (item.action === 'REJECT') {
            return 'Request has been rejected';
          }
          return `Action performed: ${item.action}`;
        case 'WORKFLOW_COMPLETED':
          return 'Workflow has been completed successfully';
        case 'WORKFLOW_CANCELLED':
          return 'Workflow has been cancelled';
        default:
          return item.description || '';
      }
    };

    const getEventColor = (item) => {
      switch (item.eventType) {
        case 'WORKFLOW_STARTED':
          return 'primary';
        case 'TRANSITION_EXECUTED':
          if (item.action === 'APPROVE') return 'positive';
          if (item.action === 'REJECT') return 'negative';
          return 'info';
        case 'WORKFLOW_COMPLETED':
          return 'positive';
        case 'WORKFLOW_CANCELLED':
          return 'negative';
        case 'STAGE_ENTERED':
        case 'STAGE_EXITED':
          return 'secondary';
        default:
          return 'grey';
      }
    };

    const getEventIcon = (item) => {
      switch (item.eventType) {
        case 'WORKFLOW_STARTED':
          return 'play_arrow';
        case 'TRANSITION_EXECUTED':
          if (item.action === 'APPROVE') return 'check_circle';
          if (item.action === 'REJECT') return 'cancel';
          return 'arrow_forward';
        case 'WORKFLOW_COMPLETED':
          return 'check_circle';
        case 'WORKFLOW_CANCELLED':
          return 'block';
        case 'STAGE_ENTERED':
          return 'login';
        case 'STAGE_EXITED':
          return 'logout';
        case 'TASK_CREATED':
          return 'add_task';
        case 'TASK_COMPLETED':
          return 'task_alt';
        default:
          return 'circle';
      }
    };

    const formatUserName = (user) => {
      if (!user) return null;
      if (typeof user === 'string') return user;
      if (user.firstName && user.lastName) {
        return `${user.firstName} ${user.lastName}`;
      }
      return user.email || user.username || 'Unknown User';
    };

    const formatDateTime = (timestamp) => {
      if (!timestamp) return '';
      return date.formatDate(timestamp, 'MMM DD, YYYY - hh:mm A');
    };

    // Load timeline data
    const loadTimeline = async () => {
      if (!props.workflowInstanceId) return;

      loading.value = true;
      error.value = null;

      try {
        // Load both timeline and instance data
        const [timelineData, instanceData] = await Promise.all([
          WorkflowService.getWorkflowTimeline(props.workflowInstanceId),
          WorkflowService.getWorkflowInstance(props.workflowInstanceId)
        ]);

        timeline.value = timelineData;
        workflowInstance.value = instanceData;
        
        emit('timeline-loaded', {
          timeline: timelineData,
          instance: instanceData
        });
      } catch (err) {
        console.error('Error loading workflow timeline:', err);
        error.value = err.response?.data?.message || 'Failed to load workflow timeline';
        emit('error', err);
      } finally {
        loading.value = false;
      }
    };

    // Setup auto-refresh
    const startAutoRefresh = () => {
      if (props.autoRefresh && props.refreshInterval > 0) {
        refreshTimer = setInterval(() => {
          loadTimeline();
        }, props.refreshInterval);
      }
    };

    const stopAutoRefresh = () => {
      if (refreshTimer) {
        clearInterval(refreshTimer);
        refreshTimer = null;
      }
    };

    // Lifecycle hooks
    onMounted(() => {
      loadTimeline();
      startAutoRefresh();
    });

    // Watch for workflow instance changes
    watch(() => props.workflowInstanceId, () => {
      loadTimeline();
    });

    // Watch for auto-refresh changes
    watch(() => props.autoRefresh, (newVal) => {
      if (newVal) {
        startAutoRefresh();
      } else {
        stopAutoRefresh();
      }
    });

    // Cleanup
    onUnmounted(() => {
      stopAutoRefresh();
    });

    return {
      loading,
      error,
      timelineItems,
      currentStage,
      formatDateTime,
      loadTimeline
    };
  }
});
</script>

<style lang="scss" scoped>
.workflow-timeline {
  padding: 16px;

  .timeline-content {
    background-color: #f5f5f5;
    padding: 12px;
    border-radius: 8px;
    max-width: 400px;
  }

  .timeline-metadata {
    padding: 8px;
    background-color: white;
    border-radius: 4px;
    border-left: 3px solid #1976d2;
  }

  .timeline-user {
    display: inline-block;
  }

  :deep(.q-timeline__dot) {
    transition: all 0.3s ease;
  }

  :deep(.q-timeline__entry:hover .q-timeline__dot) {
    transform: scale(1.2);
  }

  :deep(.q-timeline__subtitle) {
    font-size: 0.875rem;
    opacity: 0.8;
  }
}</style>