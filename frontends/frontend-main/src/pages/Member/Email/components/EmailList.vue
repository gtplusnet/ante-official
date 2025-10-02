<template>
  <div class="email-list">

    <!-- Email Items -->
    <div class="email-items">
      <div v-if="loading" class="flex flex-center q-pa-xl">
        <q-spinner-dots color="primary" size="40px" />
      </div>

      <div v-else-if="emails.length === 0" class="no-emails">
        <q-icon name="inbox" size="38px" color="grey-5" />
        <div class="text-title-medium text-grey" >No emails</div>
      </div>

      <template v-else>
        <div
          v-for="email in emails"
          :key="email.id"
          class="email-item"
          :class="{
            'email-item--selected': isSelected(email.id),
            'email-item--active': selectedEmail?.id === email.id,
            'email-item--unread': email.unread,
          }"
          @click="onEmailClick(email)"
        >
          <q-checkbox
            :model-value="isSelected(email.id)"
            @click.stop
            @update:model-value="toggleSelection(email.id)"
          />

          <q-icon
            :name="email.starred ? 'star' : 'star_outline'"
            :color="email.starred ? 'amber' : 'grey-5'"
            class="star-icon"
            @click.stop="toggleStar(email)"
          />

          <div class="email-content">
            <div class="email-header">
              <span class="sender">{{ email.from.name }}</span>
              <span class="date">{{ formatDate(email.date) }}</span>
            </div>
            <div class="subject">
              {{ email.subject }}
              <q-icon v-if="email.hasAttachments" name="attach_file" size="16px" color="grey-6" />
            </div>
            <div class="preview">{{ email.preview }}</div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, PropType } from 'vue';
import { useQuasar } from 'quasar';
import { APIRequests } from '../../../../utility/api.handler';

interface EmailData {
  id: string;
  messageId?: string;
  from: {
    name: string;
    email: string;
    avatar?: string | null;
  };
  to: Array<{ name?: string; email: string }>;
  cc?: Array<{ name?: string; email: string }>;
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
  name: 'EmailList',
  props: {
    emails: {
      type: Array as PropType<EmailData[]>,
      default: () => [],
    },
    selectedEmail: {
      type: Object as PropType<EmailData | null>,
      default: null,
    },
    loading: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['email-selected', 'emails-selected'],
  setup(props, { emit }) {
    const $q = useQuasar();
    const selected = ref<string[]>([]);

    const selectAll = computed({
      get: () => props.emails.length > 0 && selected.value.length === props.emails.length,
      set: () => {},
    });

    const indeterminate = computed(() =>
      selected.value.length > 0 && selected.value.length < props.emails.length
    );

    const hasSelection = computed(() => selected.value.length > 0);

    const isSelected = (id: string) => selected.value.includes(id);

    const toggleSelection = (id: string) => {
      const index = selected.value.indexOf(id);
      if (index > -1) {
        selected.value.splice(index, 1);
      } else {
        selected.value.push(id);
      }
      emit('emails-selected', selected.value);
    };

    const onSelectAll = (value: boolean) => {
      if (value) {
        selected.value = props.emails.map(e => e.id);
      } else {
        selected.value = [];
      }
      emit('emails-selected', selected.value);
    };

    const onEmailClick = (email: EmailData) => {
      emit('email-selected', email);
    };

    const toggleStar = async (email: EmailData) => {
      const previousState = email.starred;
      email.starred = !email.starred;

      try {
        if (email.starred) {
          await APIRequests.starEmail($q, email.id);
        } else {
          await APIRequests.unstarEmail($q, email.id);
        }
      } catch (error) {
        console.error('Failed to update star status:', error);
        email.starred = previousState;
      }
    };

    const formatDate = (date: Date) => {
      const now = new Date();
      const diff = now.getTime() - date.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));

      if (hours < 1) {
        const minutes = Math.floor(diff / (1000 * 60));
        return `${minutes}m ago`;
      } else if (hours < 24) {
        return `${hours}h ago`;
      } else if (hours < 48) {
        return 'Yesterday';
      } else {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }
    };

    return {
      selected,
      selectAll,
      indeterminate,
      hasSelection,
      isSelected,
      toggleSelection,
      onSelectAll,
      onEmailClick,
      toggleStar,
      formatDate,
    };
  },
});
</script>

<style lang="scss" scoped>
.email-list {
  flex: 1;
  background: white;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  height: 100%;

  .email-items {
    flex: 1;
    overflow-y: auto;
  }

  .no-emails {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: #5f6368;
  }

  .email-item {
    display: flex;
    align-items: center;
    padding: 12px 16px;
    border-bottom: 1px solid #f0f0f0;
    cursor: pointer;
    transition: all 0.2s;

    // Mobile adjustments
    @media (max-width: 599px) {
      padding: 10px 12px;
    }

    // Tablet adjustments
    @media (max-width: 1023px) {
      padding: 11px 14px;
    }

    &:hover {
      background: #f8f9fa;
      box-shadow: inset 1px 0 0 #dadce0, inset -1px 0 0 #dadce0;
    }

    &--selected {
      background: #c2dbff;
    }

    &--active {
      background: #f8f9fa;
      border-left: 3px solid #1a73e8;
    }

    &--unread {
      .sender {
        font-weight: 600;
      }
      .subject {
        font-weight: 600;
      }
    }

    .star-icon {
      margin: 0 12px;
      cursor: pointer;

      @media (max-width: 599px) {
        margin: 0 8px;
      }
    }

    .email-content {
      flex: 1;
      min-width: 0;

      .email-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 4px;

        .sender {
          font-size: 14px;
          color: #202124;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 60%;

          @media (max-width: 599px) {
            font-size: 13px;
            max-width: 55%;
          }
        }

        .date {
          font-size: 13px;
          color: #5f6368;
          white-space: nowrap;

          @media (max-width: 599px) {
            font-size: 12px;
          }
        }
      }

      .subject {
        font-size: 14px;
        color: #202124;
        margin-bottom: 2px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;

        @media (max-width: 599px) {
          font-size: 13px;
        }
      }

      .preview {
        font-size: 13px;
        color: #5f6368;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;

        @media (max-width: 599px) {
          font-size: 12px;
          display: none; // Hide preview on mobile to save space
        }

        @media (min-width: 600px) and (max-width: 1023px) {
          font-size: 12px;
        }
      }
    }
  }
}
</style>
