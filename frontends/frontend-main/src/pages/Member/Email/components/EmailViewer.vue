<template>
  <div class="email-viewer">
    <!-- Email Actions -->
    <div class="email-actions">
      <q-btn-group flat>
        <q-btn flat round dense icon="arrow_back" @click="$emit('back')">
          <q-tooltip>Back to list</q-tooltip>
        </q-btn>
        <q-btn flat round dense icon="archive">
          <q-tooltip>Archive</q-tooltip>
        </q-btn>
        <q-btn flat round dense icon="report">
          <q-tooltip>Report spam</q-tooltip>
        </q-btn>
        <q-btn flat round dense icon="delete" @click="$emit('delete', email)">
          <q-tooltip>Delete</q-tooltip>
        </q-btn>
        <q-separator vertical class="q-mx-sm" />
        <q-btn flat round dense icon="markunread" @click="$emit('mark-unread', email)">
          <q-tooltip>Mark as unread</q-tooltip>
        </q-btn>
        <q-btn flat round dense icon="label">
          <q-tooltip>Add label</q-tooltip>
        </q-btn>
        <q-btn flat round dense icon="more_vert">
          <q-menu>
            <q-list style="min-width: 200px">
              <q-item clickable v-close-popup>
                <q-item-section>Forward as attachment</q-item-section>
              </q-item>
              <q-item clickable v-close-popup>
                <q-item-section>Print</q-item-section>
              </q-item>
              <q-item clickable v-close-popup>
                <q-item-section>Download</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
      </q-btn-group>
    </div>

    <!-- Email Content -->
    <div class="email-content-wrapper">
      <!-- Email Header -->
      <div class="email-header">
        <h5 class="email-subject">{{ email.subject }}</h5>
        <div class="email-meta">
          <div class="sender-info">
            <q-avatar size="40px" class="q-mr-md">
              <img v-if="email.from.avatar" :src="email.from.avatar" />
              <div v-else class="avatar-placeholder">
                {{ email.from.name.charAt(0).toUpperCase() }}
              </div>
            </q-avatar>
            <div>
              <div class="sender-name">{{ email.from.name }}</div>
              <div class="sender-email">{{ email.from.email }}</div>
            </div>
          </div>
          <div class="email-date">
            {{ formatDate(email.date) }}
            <q-icon 
              :name="email.starred ? 'star' : 'star_outline'"
              :color="email.starred ? 'amber' : 'grey-5'"
              class="q-ml-sm star-icon"
              @click="toggleStar"
            />
          </div>
        </div>
        <div class="recipients">
          <span class="recipient-label">to</span>
          <span class="recipient-list">
            {{ email.to.map((r: EmailRecipient) => r.name || r.email).join(', ') }}
          </span>
        </div>
      </div>

      <!-- Email Body -->
      <div class="email-body" v-html="email.body"></div>

      <!-- Attachments -->
      <div v-if="email.hasAttachments" class="email-attachments">
        <div class="attachments-header">
          <q-icon name="attach_file" size="20px" />
          <span>Attachments</span>
        </div>
        <div class="attachment-list">
          <!-- Mock attachments for now -->
          <div class="attachment-item">
            <q-icon name="description" size="32px" color="blue-6" />
            <div class="attachment-info">
              <div class="attachment-name">document.pdf</div>
              <div class="attachment-size">245 KB</div>
            </div>
            <q-btn flat round dense icon="download" />
          </div>
        </div>
      </div>

      <!-- Reply Section -->
      <div class="reply-section">
        <q-btn
          @click="$emit('reply', email)"
          outline
          color="primary"
          no-caps
          class="q-mr-sm"
        >
          <q-icon name="reply" class="q-mr-xs" />
          Reply
        </q-btn>
        <q-btn
          @click="$emit('forward', email)"
          outline
          color="primary"
          no-caps
        >
          <q-icon name="forward" class="q-mr-xs" />
          Forward
        </q-btn>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

interface EmailRecipient {
  name?: string;
  email: string;
}

interface EmailData {
  id: string;
  messageId?: string;
  from: {
    name: string;
    email: string;
    avatar?: string | null;
  };
  to: EmailRecipient[];
  cc?: EmailRecipient[];
  subject: string;
  preview: string;
  body: string;
  date: Date;
  unread: boolean;
  starred: boolean;
  folder: string;
  hasAttachments: boolean;
  attachments?: Array<{
    filename: string;
    size: number;
    contentType: string;
  }>;
}

export default defineComponent({
  name: 'EmailViewer',
  props: {
    email: {
      type: Object as PropType<EmailData>,
      required: true,
    },
  },
  emits: ['reply', 'forward', 'delete', 'mark-unread', 'back', 'toggle-star'],
  setup(props, { emit }) {
    const formatDate = (date: Date) => {
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    };

    const toggleStar = () => {
      emit('toggle-star', props.email);
    };

    return {
      formatDate,
      toggleStar,
    };
  },
});
</script>

<style lang="scss" scoped>
.email-viewer {
  flex: 1;
  background: white;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  height: 100%;

  .email-actions {
    padding: 8px 16px;
    border-bottom: 1px solid #e0e0e0;
    overflow-x: auto;
    white-space: nowrap;

    @media (max-width: 599px) {
      padding: 6px 12px;
    }
  }

  .email-content-wrapper {
    flex: 1;
    overflow-y: auto;
    padding: 24px 32px;

    @media (max-width: 599px) {
      padding: 16px;
    }

    @media (max-width: 1023px) {
      padding: 20px 24px;
    }
  }

  .email-header {
    margin-bottom: 24px;

    @media (max-width: 599px) {
      margin-bottom: 16px;
    }

    .email-subject {
      font-size: 22px;
      font-weight: 400;
      margin: 0 0 16px 0;
      color: #202124;

      @media (max-width: 599px) {
        font-size: 18px;
        margin-bottom: 12px;
      }

      @media (max-width: 1023px) {
        font-size: 20px;
      }
    }

    .email-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      flex-wrap: wrap;
      gap: 12px;

      @media (max-width: 599px) {
        flex-direction: column;
        align-items: flex-start;
      }

      .sender-info {
        display: flex;
        align-items: center;

        .avatar-placeholder {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: #1a73e8;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 500;
        }

        .sender-name {
          font-weight: 500;
          color: #202124;
        }

        .sender-email {
          font-size: 13px;
          color: #5f6368;
        }
      }

      .email-date {
        font-size: 13px;
        color: #5f6368;
        display: flex;
        align-items: center;

        .star-icon {
          cursor: pointer;
        }
      }
    }

    .recipients {
      font-size: 13px;
      color: #5f6368;

      .recipient-label {
        margin-right: 8px;
      }
    }
  }

  .email-body {
    line-height: 1.6;
    color: #202124;
    margin-bottom: 32px;

    :deep(p) {
      margin-bottom: 16px;
    }

    :deep(ul), :deep(ol) {
      margin-bottom: 16px;
      padding-left: 24px;
    }

    :deep(blockquote) {
      border-left: 3px solid #e0e0e0;
      padding-left: 16px;
      margin: 16px 0;
      color: #5f6368;
    }
  }

  .email-attachments {
    background: #f8f9fa;
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 24px;

    .attachments-header {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 500;
      margin-bottom: 12px;
    }

    .attachment-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px;
      background: white;
      border-radius: 4px;
      border: 1px solid #e0e0e0;

      .attachment-info {
        flex: 1;

        .attachment-name {
          font-size: 14px;
          color: #202124;
        }

        .attachment-size {
          font-size: 12px;
          color: #5f6368;
        }
      }
    }
  }

  .reply-section {
    border-top: 1px solid #e0e0e0;
    padding-top: 16px;

    @media (max-width: 599px) {
      padding-top: 12px;
      
      .q-btn {
        width: 48%;
        
        &:first-child {
          margin-right: 4%;
        }
      }
    }
  }
}
</style>