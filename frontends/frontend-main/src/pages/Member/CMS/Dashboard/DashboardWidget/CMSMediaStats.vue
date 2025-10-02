<template>
  <GlobalWidgetCard>
    <template #title>
      <div class="widget-header">
        <span>Media Library</span>
        <q-btn
          flat
          dense
          no-caps
          size="sm"
          label="Open Library"
          icon="o_folder_open"
          class="open-library-btn"
          @click="showMediaDialog = true"
        />
      </div>
    </template>
    <template #content>
      <div v-if="loading" class="loading-container">
        <q-spinner size="lg" color="primary" />
        <div class="loading-text">Loading media statistics...</div>
      </div>
      <div v-else-if="error" class="error-container">
        <q-icon name="o_error" size="lg" color="negative" />
        <div class="error-text">{{ error }}</div>
        <q-btn 
          flat 
          dense 
          no-caps 
          size="sm" 
          label="Retry" 
          icon="o_refresh" 
          color="primary"
          @click="loadMediaStats"
        />
      </div>
      <div v-else class="media-stats">
        <!-- Storage Overview -->
        <div class="storage-section">
          <div class="storage-visual">
            <div class="storage-circle">
              <svg viewBox="0 0 36 36" class="circular-chart">
                <path class="circle-bg"
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path class="circle"
                  :stroke-dasharray="`${storagePercentage}, 100`"
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div class="percentage-text">{{ storagePercentage }}%</div>
            </div>
            <div class="storage-details">
              <div class="storage-used">
                <span class="value">{{ mediaStats?.storage?.usedFormatted || '0 Bytes' }}</span>
                <span class="label">Used</span>
              </div>
              <div class="storage-total">
                <span class="value">{{ mediaStats?.storage?.totalFormatted || '0 Bytes' }}</span>
                <span class="label">Total</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Media Types Grid -->
        <div class="media-types">
          <div class="type-card" v-for="type in mediaStats?.mediaTypes || []" :key="type.name">
            <div class="type-icon-container" :style="{ backgroundColor: type.bgColor }">
              <q-icon :name="type.icon" size="20px" :style="{ color: type.color }" />
            </div>
            <div class="type-content">
              <div class="type-name">{{ type.name }}</div>
              <div class="type-count">{{ type.count }} files</div>
              <div class="type-size">{{ type.sizeFormatted }}</div>
            </div>
          </div>
        </div>

        <!-- Recent Activity -->
        <div class="recent-activity">
          <div class="activity-header">
            <span class="activity-title">Recent Activity</span>
            <q-btn flat dense no-caps size="sm" label="View all" class="view-all-btn" />
          </div>
          <div class="activity-list">
            <div class="activity-item" v-for="upload in mediaStats?.recentUploads || []" :key="upload.id">
              <div class="file-icon" :class="`file-${upload.type}`">
                <q-icon :name="upload.icon" size="16px" />
              </div>
              <div class="file-details">
                <div class="file-name">{{ upload.originalName }}</div>
                <div class="file-meta">
                  <span class="file-size">{{ upload.sizeFormatted }}</span>
                  <span class="separator">•</span>
                  <span class="file-time">{{ upload.timeAgo }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Selected Media Preview -->
        <div v-if="selectedMedia.length > 0" class="selected-media">
          <div class="selected-header">
            <span class="selected-title">Recently Selected</span>
            <q-btn flat dense no-caps size="sm" label="Clear" @click="selectedMedia = []" />
          </div>
          <div class="selected-grid">
            <div v-for="media in selectedMedia.slice(0, 4)" :key="media.id" class="selected-item">
              <img v-if="media.type === 'image'" :src="media.thumbnail" :alt="media.name" />
              <q-icon v-else :name="getMediaIcon(media.type)" size="24px" />
              <div class="selected-name">{{ media.name }}</div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </GlobalWidgetCard>

  <!-- Media Library Dialog -->
  <MediaLibraryDialog
    v-model="showMediaDialog"
    title="Select Media Files"
    selection-mode="multiple"
    :file-types="['image', 'video', 'document']"
    :allow-upload="true"
    :allow-folders="true"
    confirm-label="Select Files"
    @select="handleMediaSelection"
    @cancel="handleDialogCancel"
  />
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, computed } from 'vue';
import { useQuasar } from 'quasar';
import GlobalWidgetCard from '../../../../../components/shared/global/GlobalWidgetCard.vue';
import MediaLibraryDialog from '../../../../../components/shared/MediaLibrary/MediaLibraryDialog.vue';
import type { MediaItem } from '../../../../../components/shared/MediaLibrary/MediaLibraryCore.vue';
import { CMSAnalyticsService, DetailedMediaStats } from '../../../../../services/cms-analytics.service';

export default defineComponent({
  name: 'CMSMediaStats',
  components: {
    GlobalWidgetCard,
    MediaLibraryDialog,
  },
  setup() {
    const $q = useQuasar();
    const showMediaDialog = ref(false);
    const selectedMedia = ref<MediaItem[]>([]);
    const mediaStats = ref<DetailedMediaStats | null>(null);
    const loading = ref(true);
    const error = ref<string | null>(null);

    const storagePercentage = computed(() => {
      return mediaStats.value?.storage?.percentage || 0;
    });

    const loadMediaStats = async () => {
      try {
        loading.value = true;
        error.value = null;
        mediaStats.value = await CMSAnalyticsService.getDetailedMediaStats();
      } catch (err) {
        console.error('Failed to load media statistics:', err);
        error.value = 'Failed to load media statistics';
        $q.notify({
          type: 'negative',
          message: 'Failed to load media statistics',
          position: 'top',
        });
      } finally {
        loading.value = false;
      }
    };

    onMounted(() => {
      loadMediaStats();
    });

    const getMediaIcon = (type: string) => {
      const icons: Record<string, string> = {
        image: 'o_image',
        video: 'o_movie',
        document: 'o_description',
        pdf: 'o_picture_as_pdf',
      };
      return icons[type] || 'o_insert_drive_file';
    };

    const handleMediaSelection = (items: MediaItem | MediaItem[]) => {
      // Handle single or multiple selection
      const selectedItems = Array.isArray(items) ? items : [items];
      selectedMedia.value = [...selectedItems, ...selectedMedia.value].slice(0, 10);
      
      $q.notify({
        type: 'positive',
        message: `${selectedItems.length} file(s) selected`,
        position: 'top',
      });
    };

    const handleDialogCancel = () => {
      console.log('Media selection cancelled');
    };

    return {
      storagePercentage,
      mediaStats,
      loading,
      error,
      showMediaDialog,
      selectedMedia,
      getMediaIcon,
      handleMediaSelection,
      handleDialogCancel,
      loadMediaStats,
    };
  },
});
</script>

<style scoped lang="scss">
.widget-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;

  .open-library-btn {
    color: #1976d2;
    font-size: 12px;
    padding: 2px 8px;
    margin-left: auto;

    &:hover {
      background: rgba(25, 118, 210, 0.04);
    }
  }
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  min-height: 300px;

  .loading-text {
    margin-top: 16px;
    font-size: 14px;
    color: #5f6368;
  }
}

.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  min-height: 300px;

  .error-text {
    margin: 16px 0;
    font-size: 14px;
    color: #d32f2f;
    text-align: center;
  }
}

.media-stats {
  padding: 8px 0 20px 0;

  .storage-section {
    padding: 16px;
    background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
    border-radius: 12px;
    margin-bottom: 20px;

    .storage-visual {
      display: flex;
      align-items: center;
      gap: 24px;

      .storage-circle {
        position: relative;
        width: 80px;
        height: 80px;

        .circular-chart {
          width: 100%;
          height: 100%;
          transform: rotate(-90deg);
        }

        .circle-bg {
          fill: none;
          stroke: #e8eaed;
          stroke-width: 3;
        }

        .circle {
          fill: none;
          stroke: #1976d2;
          stroke-width: 3;
          stroke-linecap: round;
          transition: stroke-dasharray 0.5s ease;
        }

        .percentage-text {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-size: 18px;
          font-weight: 600;
          color: #1976d2;
        }
      }

      .storage-details {
        flex: 1;
        display: flex;
        gap: 32px;

        .storage-used,
        .storage-total {
          display: flex;
          flex-direction: column;

          .value {
            font-size: 20px;
            font-weight: 600;
            color: #202124;
            line-height: 1.2;
          }

          .label {
            font-size: 12px;
            color: #5f6368;
            margin-top: 2px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
        }
      }
    }
  }

  .media-types {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    margin-bottom: 24px;

    .type-card {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      background: #ffffff;
      border: 1px solid #e8eaed;
      border-radius: 8px;
      transition: all 0.2s ease;
      cursor: pointer;

      &:hover {
        border-color: #dadce0;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        transform: translateY(-1px);
      }

      .type-icon-container {
        width: 40px;
        height: 40px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      .type-content {
        flex: 1;
        min-width: 0;

        .type-name {
          font-size: 13px;
          color: #5f6368;
          margin-bottom: 2px;
        }

        .type-count {
          font-size: 16px;
          font-weight: 600;
          color: #202124;
          margin-bottom: 2px;
        }

        .type-size {
          font-size: 12px;
          color: #80868b;
        }
      }
    }
  }

  .recent-activity {
    .activity-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      padding: 0 4px;

      .activity-title {
        font-size: 14px;
        font-weight: 600;
        color: #202124;
      }

      .view-all-btn {
        color: #1976d2;
        font-size: 12px;
        padding: 2px 8px;
        min-height: 24px;

        &:hover {
          background: rgba(25, 118, 210, 0.04);
        }
      }
    }

    .activity-list {
      display: flex;
      flex-direction: column;
      gap: 1px;

      .activity-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 10px 8px;
        border-radius: 6px;
        transition: background-color 0.15s ease;
        cursor: pointer;

        &:hover {
          background-color: #f8f9fa;
        }

        .file-icon {
          width: 32px;
          height: 32px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;

          &.file-image {
            background: #e8f5e9;
            color: #2e7d32;
          }

          &.file-video {
            background: #e3f2fd;
            color: #1565c0;
          }

          &.file-document {
            background: #fff3e0;
            color: #e65100;
          }
        }

        .file-details {
          flex: 1;
          min-width: 0;

          .file-name {
            font-size: 13px;
            font-weight: 500;
            color: #202124;
            margin-bottom: 2px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .file-meta {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 11px;
            color: #80868b;

            .separator {
              opacity: 0.5;
            }
          }
        }
      }
    }
  }

  .selected-media {
    margin-top: 24px;
    padding-top: 20px;
    border-top: 1px solid #e8eaed;

    .selected-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;

      .selected-title {
        font-size: 14px;
        font-weight: 600;
        color: #202124;
      }
    }

    .selected-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;

      .selected-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 12px;
        background: #f8f9fa;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s;

        &:hover {
          background: #e8eaed;
          transform: translateY(-1px);
        }

        img {
          width: 48px;
          height: 48px;
          object-fit: cover;
          border-radius: 4px;
          margin-bottom: 8px;
        }

        .q-icon {
          margin-bottom: 8px;
          color: #5f6368;
        }

        .selected-name {
          font-size: 11px;
          color: #5f6368;
          text-align: center;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          width: 100%;
        }
      }
    }
  }
}

@media (max-width: 599px) {
  .media-stats {
    .media-types {
      grid-template-columns: 1fr;
    }

    .storage-section {
      .storage-visual {
        flex-direction: column;
        gap: 16px;

        .storage-details {
          width: 100%;
          justify-content: center;
        }
      }
    }
  }
}
</style>