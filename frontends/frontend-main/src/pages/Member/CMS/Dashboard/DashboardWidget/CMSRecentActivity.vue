<template>
  <GlobalWidgetCard>
    <template #title>Recent Activity</template>
    <template #actions>
      <q-btn flat dense label="VIEW ALL" color="primary" size="sm" class="text-caption" />
    </template>
    <template #content>
      <div class="recent-activity">
        <div class="activity-list">
          <div v-for="activity in activities" :key="activity.id" class="activity-item">
            <div class="activity-timeline">
              <div class="timeline-dot" :class="`type-${activity.type}`">
                <q-icon :name="activity.icon" size="16px" />
              </div>
              <div class="timeline-line" v-if="activity.id !== activities[activities.length - 1].id"></div>
            </div>
            <div class="activity-content">
              <div class="activity-header">
                <span class="activity-time text-caption">{{ activity.time }}</span>
              </div>
              <div class="activity-title text-body-medium">{{ activity.title }}</div>
              <div class="activity-description text-caption">{{ activity.description }}</div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </GlobalWidgetCard>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import GlobalWidgetCard from '../../../../../components/shared/global/GlobalWidgetCard.vue';

export default defineComponent({
  name: 'CMSRecentActivity',
  components: {
    GlobalWidgetCard,
  },
  setup() {
    const activities = ref([
      {
        id: 1,
        icon: 'o_add_circle',
        type: 'create',
        time: '2 MINUTES AGO',
        title: 'New Article Created',
        description: 'John Doe created "Getting Started with Strapi"',
      },
      {
        id: 2,
        icon: 'o_edit',
        type: 'update',
        time: '15 MINUTES AGO',
        title: 'Content Updated',
        description: 'Jane Smith updated product "Premium Package"',
      },
      {
        id: 3,
        icon: 'o_publish',
        type: 'publish',
        time: '1 HOUR AGO',
        title: 'Content Published',
        description: '3 articles published to production',
      },
      {
        id: 4,
        icon: 'o_image',
        type: 'media',
        time: '2 HOURS AGO',
        title: 'Media Uploaded',
        description: '12 new images added to Media Library',
      },
      {
        id: 5,
        icon: 'o_delete',
        type: 'delete',
        time: '3 HOURS AGO',
        title: 'Content Deleted',
        description: 'Draft article "Untitled" removed',
      },
      {
        id: 6,
        icon: 'o_settings',
        type: 'settings',
        time: '5 HOURS AGO',
        title: 'Settings Changed',
        description: 'API rate limits updated',
      },
    ]);

    return {
      activities,
    };
  },
});
</script>

<style scoped lang="scss">
.recent-activity {
  padding: 12px 0 20px 0;
  max-height: 500px;
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-track {
    background: #f8f9fa;
    border-radius: 2px;
  }

  &::-webkit-scrollbar-thumb {
    background: #dee2e6;
    border-radius: 2px;

    &:hover {
      background: #adb5bd;
    }
  }

  .activity-list {
    .activity-item {
      display: flex;
      gap: 16px;
      position: relative;
      
      .activity-timeline {
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 32px;
        flex-shrink: 0;
        
        .timeline-dot {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: #f1f3f5;
          color: #6c757d;
          transition: all 0.2s ease;
          
          &.type-create {
            background-color: #e8f5e9;
            color: #4caf50;
          }
          
          &.type-update {
            background-color: #e3f2fd;
            color: #2196f3;
          }
          
          &.type-publish {
            background-color: #f3e5f5;
            color: #9c27b0;
          }
          
          &.type-media {
            background-color: #fff3e0;
            color: #ff9800;
          }
          
          &.type-delete {
            background-color: #ffebee;
            color: #f44336;
          }
          
          &.type-settings {
            background-color: #e8eaf6;
            color: #673ab7;
          }
        }
        
        .timeline-line {
          position: absolute;
          top: 32px;
          left: 50%;
          transform: translateX(-50%);
          width: 2px;
          height: calc(100% + 20px);
          background-color: #e9ecef;
        }
      }
      
      .activity-content {
        flex: 1;
        padding-bottom: 24px;
        
        .activity-header {
          margin-bottom: 4px;
          
          .activity-time {
            color: #868e96;
            font-size: 11px;
            font-weight: 500;
            letter-spacing: 0.5px;
          }
        }
        
        .activity-title {
          color: #212529;
          font-weight: 500;
          margin-bottom: 4px;
          line-height: 1.4;
        }
        
        .activity-description {
          color: #6c757d;
          line-height: 1.5;
        }
      }
      
      &:hover {
        .timeline-dot {
          transform: scale(1.1);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
      }
      
      &:last-child {
        .activity-content {
          padding-bottom: 0;
        }
      }
    }
  }
}

@media (max-width: 768px) {
  .recent-activity {
    .activity-list {
      .activity-item {
        gap: 12px;
        
        .activity-timeline {
          width: 28px;
          
          .timeline-dot {
            width: 28px;
            height: 28px;
          }
        }
      }
    }
  }
}
</style>